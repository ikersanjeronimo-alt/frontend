import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../hooks/useRole'
import { useProfessionals } from '../hooks/useProfessionals'
import { usePrivateChat } from '../hooks/usePrivateChat'
import { usePrivateInbox } from '../hooks/usePrivateInbox'
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
  if (p.availability === 'now') {
    return (
      <span className={`${styles.pill} ${styles.pillNow}`}>
        <IconDot color="var(--green)" size={8} />
        <span>{t('professionals.availNow')}</span>
      </span>
    )
  }
  if (p.availability === 'today') {
    return (
      <span className={`${styles.pill} ${styles.pillToday}`}>
        <IconDot color="var(--peach)" size={8} />
        <span>{p.availableAt}</span>
      </span>
    )
  }
  return <span className={`${styles.pill} ${styles.pillTomorrow}`}>{t('professionals.availTomorrow')}</span>
}

export function PrivateChatPage() {
  const { professionalId = '', userId = '' } = useParams<{ professionalId: string; userId?: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isMod } = useRole()
  const { data: professionals, loading: professionalsLoading } = useProfessionals()
  const { words: bannedWords } = useBannedWords()
  const [input, setInput] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const SPECIALTY_LABELS: Record<string, string> = {
    psicologo: t('professionals.specPsi'),
    terapeuta: t('professionals.specTer'),
    psiquiatra: t('professionals.specPsq'),
  }

  const isInboxMode = professionalId === 'inbox'

  if (isInboxMode && !isMod) {
    return (
      <ChatLayout>
        <ChatMain>
          <ChatHeader onBack={() => navigate('/profesionales')} backAriaLabel={t('privateChat.backAria')} name={t('privateChat.notFoundTitle')} />
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

  const regularProfessional = useMemo(
    () => professionals.find(p => p.id === professionalId),
    [professionals, professionalId],
  )

  const inbox = usePrivateInbox(userId, isInboxMode)
  const privateChat = usePrivateChat(isInboxMode ? '' : professionalId)

  const activeProfessional = isInboxMode ? null : regularProfessional
  const messages = isInboxMode ? inbox.messages : privateChat.messages
  const sendMessage = isInboxMode ? inbox.sendMessage : privateChat.sendMessage
  const chatLoading = isInboxMode
    ? inbox.loading
    : (professionalsLoading || privateChat.loading)
  const cat = catFor(isInboxMode ? '/chat/inbox' : '/chat')

  const sidebar = isInboxMode ? (
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
      {inbox.conversations.map(conv => (
        <ChatSidebarItem
          key={conv.userId}
          to={`/chat/inbox/${conv.userId}`}
          avatar={<div className={styles.sidebarAvatar}>{initials(conv.username)}</div>}
          name={conv.username}
          meta={conv.lastMessage}
        />
      ))}
      <ChatSidebarExplore to="/profesionales">{t('privateChat.explore')}</ChatSidebarExplore>
    </ChatSidebar>
  ) : (
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
      {isMod && (
        <ChatSidebarItem
          to="/chat/inbox"
          avatar={<div className={styles.sidebarAvatar}>{initials(user?.username ?? 'ME')}</div>}
          name={t('privateChat.inboxTitle')}
          meta={t('privateChat.inboxMeta')}
        />
      )}
      <ChatSidebarExplore to="/profesionales">{t('privateChat.explore')}</ChatSidebarExplore>
    </ChatSidebar>
  )

  if (chatLoading && messages.length === 0) {
    return <PageState loading />
  }

  if (!isInboxMode && !activeProfessional) {
    return (
      <ChatLayout>
        {sidebar}
        <ChatMain>
          <ChatHeader onBack={() => navigate('/profesionales')} backAriaLabel={t('privateChat.backAria')} name={t('privateChat.notFoundTitle')} />
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

  const headerName = isInboxMode
    ? inbox.selectedConversation?.username ?? t('privateChat.inboxTitle')
    : activeProfessional?.name ?? t('privateChat.notFoundTitle')

  const headerMeta = isInboxMode
    ? inbox.selectedConversation?.lastMessage ?? t('privateChat.inboxMeta')
    : activeProfessional
      ? SPECIALTY_LABELS[activeProfessional.specialty] ?? activeProfessional.specialty
      : undefined

  return (
    <ChatLayout>
      {sidebar}

      <ChatMain>
        <ChatHeader
          onBack={() => navigate('/profesionales')}
          backAriaLabel={t('privateChat.backAria')}
          avatar={activeProfessional ? <div className={styles.headerAvatar}>{initials(activeProfessional.name)}</div> : undefined}
          name={headerName}
          meta={headerMeta}
          onInfoToggle={() => setShowPanel(p => !p)}
          infoTitle={t('privateChat.info')}
        />

        <ChatMessages scrollDep={messages.length}>
          {messages.length === 0 && (
            <p className={styles.emptyMsg}>
              {isInboxMode ? t('privateChat.inboxEmpty') : t('privateChat.noMessages')}
            </p>
          )}
          {messages.map(m => {
            const isUser = m.from === 'user'
            const avatarName = isInboxMode ? inbox.selectedConversation?.username ?? 'Usuario' : activeProfessional?.name ?? 'Usuario'
            return (
              <ChatBubble
                key={m.id}
                side={isUser ? 'own' : 'other'}
                avatar={!isUser ? initials(avatarName) : undefined}
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
          placeholder={
            isInboxMode
              ? t('privateChat.replyPh')
              : t('privateChat.inputPh', { name: activeProfessional?.name ?? '' })
          }
          ariaLabel={isInboxMode ? t('privateChat.replyAria') : t('privateChat.inputAria')}
          sendAriaLabel={t('privateChat.send')}
          disabled={isInboxMode && !inbox.selectedUserId}
        />
        {sendError && <p role="alert" className={styles.sendError}>{sendError}</p>}
      </ChatMain>

      <ChatPanel visible={showPanel}>
        <div className={styles.panelAvatar}>{initials(headerName)}</div>
        <h3 className={styles.panelName}>{headerName}</h3>
        <p className={styles.panelSpecialty}>{headerMeta}</p>

        {!isInboxMode && activeProfessional && (
          <>
            <div className={styles.panelAvail}>
              <AvailabilityPill p={activeProfessional} />
            </div>

            {activeProfessional.bio && (
              <div className={styles.panelSection}>
                <h4 className={styles.panelSectionTitle}>{t('privateChat.about')}</h4>
                <p className={styles.panelBio}>{activeProfessional.bio}</p>
              </div>
            )}

            {activeProfessional.tags.length > 0 && (
              <div className={styles.panelSection}>
                <h4 className={styles.panelSectionTitle}>{t('privateChat.topics')}</h4>
                <div className={styles.tagList}>
                  {activeProfessional.tags.map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {isInboxMode && inbox.selectedConversation && (
          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>{t('privateChat.inboxMeta')}</h4>
            <p className={styles.panelBio}>
              {inbox.selectedConversation.lastTime} · {inbox.selectedConversation.lastMessage}
            </p>
          </div>
        )}
      </ChatPanel>
    </ChatLayout>
  )
}
