import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfessionals } from '../hooks/useProfessionals'
import { usePrivateChat } from '../hooks/usePrivateChat'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { PageState } from '../components/ui/PageState'
import { IconDot } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import type { ApiProfessional } from '../types/api'
import styles from './PrivateChatPage.module.css'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function AvailabilityPill({ p }: { p: ApiProfessional }) {
  const { t } = useTranslation()
  if (p.availability === 'now') return (
    <span className={`${styles.pill} ${styles.pillNow}`}>
      <IconDot color="var(--green)" size={8} />
      <span>{t('professionals.availNow')}</span>
    </span>
  )
  if (p.availability === 'today') return (
    <span className={`${styles.pill} ${styles.pillToday}`}>
      <IconDot color="var(--peach)" size={8} />
      <span>{p.availableAt}</span>
    </span>
  )
  return <span className={`${styles.pill} ${styles.pillTomorrow}`}>{t('professionals.availTomorrow')}</span>
}

export function PrivateChatPage() {
  const { professionalId = '' } = useParams<{ professionalId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: professionals, loading } = useProfessionals()
  const { messages, sendMessage } = usePrivateChat(professionalId)
  const { words: bannedWords } = useBannedWords()
  const [input, setInput] = useState('')
  const [showPanel, setShowPanel] = useState(false)

  const SPECIALTY_LABELS: Record<string, string> = {
    psicologo:  t('professionals.specPsi'),
    terapeuta:  t('professionals.specTer'),
    psiquiatra: t('professionals.specPsq'),
  }

  const professional = professionals.find(p => p.id === professionalId)

  const messagesRef = useRef<HTMLDivElement>(null)
  const endRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return <PageState loading />
  }

  const sidebar = (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>{t('privateChat.sidebarTitle')}</h2>
        <SleepingCat
          color={catFor('/chat').color}
          seed={catFor('/chat').seed}
          size={72}
          className={styles.sidebarCat}
        />
      </div>
      <nav className={styles.sidebarList}>
        {professionals.map(p => (
          <NavLink
            key={p.id}
            to={`/chat/${p.id}`}
            className={({ isActive }) => `${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
          >
            <div className={styles.sidebarAvatar}>{initials(p.name)}</div>
            <div className={styles.sidebarInfo}>
              <span className={styles.sidebarName}>{p.name}</span>
              <span className={styles.sidebarMeta}>
                {SPECIALTY_LABELS[p.specialty] ?? p.specialty}
              </span>
            </div>
          </NavLink>
        ))}
        <NavLink to="/profesionales" className={styles.sidebarExplore}>
          {t('privateChat.explore')}
        </NavLink>
      </nav>
    </aside>
  )

  if (!professional) {
    return (
      <div className={styles.layout}>
        {sidebar}
        <main className={styles.chat}>
          <div className={styles.chatHeader}>
            <button className={styles.backBtn} onClick={() => navigate('/profesionales')}>
              ←
            </button>
            <div className={styles.chatHeaderInfo}>
              <span className={styles.chatHeaderName}>{t('privateChat.notFoundTitle')}</span>
            </div>
          </div>
          <div className={styles.notFound}>
            <p className={styles.notFoundMsg}>{t('privateChat.notFoundMsg')}</p>
            <button className={styles.notFoundBtn} onClick={() => navigate('/profesionales')}>
              {t('privateChat.seeAll')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    void sendMessage(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.layout}>

      {sidebar}

      <main className={styles.chat}>

        <div className={styles.chatHeader}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/profesionales')}
            aria-label={t('privateChat.backAria')}
          >
            ←
          </button>
          <div className={styles.headerAvatar}>{initials(professional.name)}</div>
          <div className={styles.chatHeaderInfo}>
            <span className={styles.chatHeaderName}>{professional.name}</span>
            <span className={styles.chatHeaderMeta}>
              {SPECIALTY_LABELS[professional.specialty] ?? professional.specialty}
            </span>
          </div>
          <button
            className={styles.infoToggle}
            onClick={() => setShowPanel(p => !p)}
            title={t('privateChat.info')}
          >
            ⓘ
          </button>
        </div>

        <div className={styles.messages} ref={messagesRef}>
          {messages.map(m => {
            const isUser = m.from === 'user'
            return (
              <div
                key={m.id}
                className={`${styles.messageGroup} ${isUser ? styles.messageGroupOwn : ''}`}
              >
                {!isUser && (
                  <div className={styles.bubbleAvatar}>{initials(professional.name)}</div>
                )}
                <div className={styles.bubbleCol}>
                  <div className={`${styles.bubble} ${isUser ? styles.bubbleOwn : styles.bubbleOther}`}>
                    {maskBannedWords(m.text, bannedWords)}
                  </div>
                  <span className={styles.bubbleTime}>{m.time}</span>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            aria-label={t('privateChat.inputAria')}
            className={styles.input}
            placeholder={t('privateChat.inputPh', { name: professional.name })}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label={t('privateChat.send')}
          >
            ➤
          </button>
        </div>
      </main>

      <aside className={`${styles.panel} ${showPanel ? styles.panelVisible : ''}`}>
        <div className={styles.panelAvatar}>{initials(professional.name)}</div>
        <h3 className={styles.panelName}>{professional.name}</h3>
        <p className={styles.panelSpecialty}>
          {SPECIALTY_LABELS[professional.specialty] ?? professional.specialty}
        </p>

        <div className={styles.panelAvail}>
          <AvailabilityPill p={professional} />
        </div>

        {professional.bio && (
          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>{t('privateChat.about')}</h4>
            <p className={styles.panelBio}>{professional.bio}</p>
          </div>
        )}

        {professional.tags.length > 0 && (
          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>{t('privateChat.topics')}</h4>
            <div className={styles.tagList}>
              {professional.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </aside>

    </div>
  )
}
