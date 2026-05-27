import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfessionals } from '../hooks/useProfessionals'
import { usePrivateChat } from '../hooks/usePrivateChat'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { PageState } from '../components/ui/PageState'
import { IconDot } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import {
  ChatLayout, ChatSidebar, ChatSidebarItem, ChatSidebarExplore,
  ChatMain, ChatHeader, ChatMessages, ChatBubble, ChatComposer, ChatPanel,
} from '../components/chat/ChatLayout'
import { initials } from '../lib/initials'
import type { ApiProfessional } from '../types/api'
import styles from './PrivateChatPage.module.css'

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
  const [sendError, setSendError] = useState<string | null>(null)

  const SPECIALTY_LABELS: Record<string, string> = {
    psicologo:  t('professionals.specPsi'),
    terapeuta:  t('professionals.specTer'),
    psiquiatra: t('professionals.specPsq'),
  }

  const professional = professionals.find(p => p.id === professionalId)
  const cat = catFor('/chat')

  if (loading) {
    return <PageState loading />
  }

  const sidebar = (
    <ChatSidebar
      title={t('privateChat.sidebarTitle')}
      topRight={
        <SleepingCat
          color={cat.color}
          seed={cat.seed}
          size={72}
          className={styles.sidebarCat}
        />
      }
    >
      {professionals.map(p => (
        <ChatSidebarItem
          key={p.id}
          to={`/chat/${p.id}`}
          avatar={<div className={styles.sidebarAvatar}>{initials(p.name)}</div>}
          name={p.name}
          meta={SPECIALTY_LABELS[p.specialty] ?? p.specialty}
        />
      ))}
      <ChatSidebarExplore to="/profesionales">{t('privateChat.explore')}</ChatSidebarExplore>
    </ChatSidebar>
  )

  if (!professional) {
    return (
      <ChatLayout>
        {sidebar}
        <ChatMain>
          <ChatHeader onBack={() => navigate('/profesionales')} name={t('privateChat.notFoundTitle')} />
          <div className={styles.notFound}>
            <p className={styles.notFoundMsg}>{t('privateChat.notFoundMsg')}</p>
            <button type="button" className={styles.notFoundBtn} onClick={() => navigate('/profesionales')}>
              {t('privateChat.seeAll')}
            </button>
          </div>
        </ChatMain>
      </ChatLayout>
    )
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setSendError(null)
    try {
      await sendMessage(text)
      setInput('')
    } catch {
      setSendError(t('common.errSend'))
    }
  }

  return (
    <ChatLayout>

      {sidebar}

      <ChatMain>
        <ChatHeader
          onBack={() => navigate('/profesionales')}
          backAriaLabel={t('privateChat.backAria')}
          avatar={<div className={styles.headerAvatar}>{initials(professional.name)}</div>}
          name={professional.name}
          meta={SPECIALTY_LABELS[professional.specialty] ?? professional.specialty}
          onInfoToggle={() => setShowPanel(p => !p)}
          infoTitle={t('privateChat.info')}
        />

        <ChatMessages scrollDep={messages.length}>
          {messages.length === 0 && (
            <p className={styles.emptyMsg}>{t('privateChat.noMessages')}</p>
          )}
          {messages.map(m => {
            const isUser = m.from === 'user'
            return (
              <ChatBubble
                key={m.id}
                side={isUser ? 'own' : 'other'}
                avatar={!isUser ? initials(professional.name) : undefined}
                time={m.time}
              >
                {maskBannedWords(m.text, bannedWords)}
              </ChatBubble>
            )
          })}
        </ChatMessages>

        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          placeholder={t('privateChat.inputPh', { name: professional.name })}
          ariaLabel={t('privateChat.inputAria')}
          sendAriaLabel={t('privateChat.send')}
        />
        {sendError && <p role="alert" className={styles.sendError}>{sendError}</p>}
      </ChatMain>

      <ChatPanel visible={showPanel}>
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
      </ChatPanel>

    </ChatLayout>
  )
}
