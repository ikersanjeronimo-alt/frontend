import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCommunities } from '../hooks/useCommunities'
import { useCommunityChat } from '../hooks/useCommunityChat'
import { useCommunityMembers } from '../hooks/useCommunityMembers'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './CommunityChatPage.module.css'

export function CommunityChatPage() {
  const { comunidadId } = useParams<{ comunidadId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: communities } = useCommunities()
  const community = communities.find(c => c.id === comunidadId)

  const { messages, sendMessage }   = useCommunityChat(comunidadId ?? '')
  const { data: activeMembers }     = useCommunityMembers(comunidadId ?? '')
  const { words: bannedWords }      = useBannedWords()
  const [input, setInput]           = useState('')
  const [showPanel, setShowPanel]   = useState(false)

  const messagesRef    = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Solo auto-scroll si el usuario ya estaba cerca del final, para no secuestrar
  // su scroll mientras lee el historial.
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (!community) {
    return (
      <div className={styles.layout}>
        <main className={styles.chat}>
          <div className={styles.chatHeader}>
            <button className={styles.backBtn} onClick={() => navigate('/comunidades')}>
              ←
            </button>
            <div className={styles.chatHeaderInfo}>
              <span className={styles.chatHeaderName}>{t('communities.notFoundTitle')}</span>
            </div>
          </div>
          <div className={styles.notFound}>
            <p className={styles.notFoundMsg}>{t('communities.notFoundMsg')}</p>
            <button className={styles.sendBtn} onClick={() => navigate('/comunidades')}>
              {t('communities.seeAll')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  const pinned = community.pinnedNote

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

  const joinedCommunities = communities.filter(c => c.joined)

  return (
    <div className={styles.layout}>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>{t('communities.sidebarTitle')}</h2>
          <SleepingCat
            color={catFor('/comunidades-chat').color}
            seed={catFor('/comunidades-chat').seed}
            size={72}
            className={styles.sidebarCat}
          />
        </div>
        <nav className={styles.sidebarList}>
          {joinedCommunities.map(c => (
            <NavLink
              key={c.id}
              to={`/comunidades/${c.id}`}
              className={({ isActive }) => `${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
            >
              <div className={styles.sidebarInfo}>
                <span className={styles.sidebarName}>{c.name}</span>
                <span className={styles.sidebarOnline}>{c.online} {t('common.online')}</span>
              </div>
            </NavLink>
          ))}
          <NavLink to="/comunidades" className={styles.sidebarExplore}>
            {t('communities.explore')}
          </NavLink>
        </nav>
      </aside>

      <main className={styles.chat}>

        <div className={styles.chatHeader}>
          <button className={styles.backBtn} onClick={() => navigate('/comunidades')}>
            ←
          </button>
          <div className={styles.chatHeaderInfo}>
            <span className={styles.chatHeaderName}>{community.name}</span>
            <span className={styles.chatHeaderMeta}>{community.online} {t('common.online')} · {t('communities.modPrefix')} {community.mod}</span>
          </div>
          <button
            className={styles.infoToggle}
            onClick={() => setShowPanel(p => !p)}
            title={t('communities.info')}
          >
            ⓘ
          </button>
        </div>

        {pinned && (
          <div className={styles.pinnedNote}>
            <span className={styles.pinnedIcon}></span>
            <span className={styles.pinnedText}>{pinned}</span>
          </div>
        )}

        <div className={styles.messages} ref={messagesRef}>
          {messages.map((m, i) => {
            const showUsername = !m.own && (i === 0 || messages[i - 1].username !== m.username || messages[i - 1].own)
            const initials = m.username.slice(0, 2).toUpperCase()
            return (
              <div key={m.id} className={`${styles.messageGroup} ${m.own ? styles.messageGroupOwn : ''}`}>
                {!m.own && (
                  <div className={styles.bubbleAvatar}>
                    {showUsername ? initials : ''}
                  </div>
                )}
                <div className={styles.bubbleCol}>
                  {showUsername && !m.own && (
                    <span className={styles.bubbleUsername}>{m.username}</span>
                  )}
                  <div className={`${styles.bubble} ${m.own ? styles.bubbleOwn : styles.bubbleOther}`}>
                    {maskBannedWords(m.text, bannedWords)}
                  </div>
                  <span className={styles.bubbleTime}>{m.time}</span>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            aria-label={t('communities.inputAria')}
            className={styles.input}
            placeholder={t('communities.inputPh')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            ➤
          </button>
        </div>
      </main>

      <aside className={`${styles.panel} ${showPanel ? styles.panelVisible : ''}`}>
        <h3 className={styles.panelName}>{community.name}</h3>
        <p className={styles.panelDesc}>{community.desc}</p>

        <div className={styles.panelStats}>
          <div className={styles.panelStat}>
            <strong>{community.members}</strong>
            <span>{t('common.members')}</span>
          </div>
          <div className={styles.panelStat}>
            <strong>{community.online}</strong>
            <span>{t('common.online')}</span>
          </div>
        </div>

        <div className={styles.panelMod}>
          <div className={styles.panelModAvatar}>
            {community.mod.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <span className={styles.panelModLabel}>{t('communities.modLabel')}</span>
            <span className={styles.panelModName}>{community.mod}</span>
          </div>
        </div>

        <button
          className={styles.panelContactBtn}
          onClick={() => navigate('/profesionales')}
        >
          {t('communities.contactMod')}
        </button>

        <div className={styles.panelSection}>
          <h4 className={styles.panelSectionTitle}>{t('communities.activeMembers')}</h4>
          <div className={styles.memberList}>
            {activeMembers.map(m => (
              <div key={m.username} className={styles.memberRow}>
                <div className={styles.memberAvatar}>{m.initials}</div>
                <span className={styles.memberUsername}>{m.username}</span>
                <span className={styles.memberOnlineDot} />
              </div>
            ))}
          </div>
        </div>
      </aside>

    </div>
  )
}
