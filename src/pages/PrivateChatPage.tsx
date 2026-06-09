import { useMemo, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { BubbleMenu, type BubbleMenuItem } from '../components/chat/BubbleMenu'
import { reportPrivateMessage } from '../services/moderation'
import { initials } from '../lib/initials'
import type { ApiProfessional } from '../types/api'
import styles from './PrivateChatPage.module.css'

function StatusPill({ p }: { p: ApiProfessional }) {
  const { t } = useTranslation()
  return (
    <span className={`${styles.pill} ${p.online ? styles.pillOnline : styles.pillOffline}`}>
      <IconDot color="currentColor" size={8} />
      <span>{p.online ? t('professionals.statusOnline') : t('professionals.statusOffline')}</span>
    </span>
  )
}

export function PrivateChatPage() {
  const { professionalId = '', userId = '' } = useParams<{ professionalId: string; userId?: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isMod } = useRole()
  const { data: professionals, loading: professionalsLoading } = useProfessionals()
  const { words: bannedWords } = useBannedWords()
  const [input, setInput] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [reportedMsgIds, setReportedMsgIds] = useState<Set<string>>(new Set())

  const handleReportPrivate = (messageId: string) => {
    setReportedMsgIds(prev => new Set(prev).add(messageId))
    void reportPrivateMessage(messageId, t('map.reportReason')).catch(() => {
      setReportedMsgIds(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    })
  }

  const SPECIALTY_LABELS: Record<string, string> = {
    psicologo: t('professionals.specPsi'),
    terapeuta: t('professionals.specTer'),
    psiquiatra: t('professionals.specPsq'),
  }

  const isInboxMode = professionalId === 'inbox'

  // Todos los hooks deben llamarse antes de cualquier early return
  const regularProfessional = useMemo(
    () => professionals.find(p => p.id === professionalId),
    [professionals, professionalId],
  )
  const inbox = usePrivateInbox(userId, isInboxMode)
  const privateChat = usePrivateChat(isInboxMode ? '' : professionalId)

  // Early returns DESPUÉS de todos los hooks
  if (isMod && !isInboxMode) {
    return <Navigate to="/chat/inbox" replace />
  }

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
          meta={maskBannedWords(conv.lastMessage, bannedWords)}
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
    ? (inbox.selectedConversation ? maskBannedWords(inbox.selectedConversation.lastMessage, bannedWords) : t('privateChat.inboxMeta'))
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

        <ChatMessages key={`${professionalId}:${userId}`} scrollDep={messages.length}>
          {messages.length === 0 && (
            <p className={styles.emptyMsg}>
              {isInboxMode ? t('privateChat.inboxEmpty') : t('privateChat.noMessages')}
            </p>
          )}
          {messages.map(m => {
            const isUser = m.from === 'user'
            // `from` es el rol absoluto del emisor; "propio" depende de quién mira:
            // el usuario ve como propios los suyos; el profesional (inbox), los del profesional.
            const isOwn = isInboxMode ? !isUser : isUser
            const avatarName = isInboxMode ? inbox.selectedConversation?.username ?? 'Usuario' : activeProfessional?.name ?? 'Usuario'
            const canReport = !isInboxMode && !isUser
            const menuItems: BubbleMenuItem[] = []
            if (canReport) {
              const reported = reportedMsgIds.has(m.id)
              menuItems.push({
                label: reported ? t('map.reported') : t('map.report'),
                onClick: () => handleReportPrivate(m.id),
                disabled: reported,
              })
            }
            return (
              <ChatBubble
                key={m.id}
                side={isOwn ? 'own' : 'other'}
                avatar={!isOwn ? initials(avatarName) : undefined}
                time={m.time}
                actions={menuItems.length > 0
                  ? <BubbleMenu items={menuItems} ariaLabel={t('common.messageActions')} />
                  : undefined}
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
              <StatusPill p={activeProfessional} />
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
              {inbox.selectedConversation.lastTime} · {maskBannedWords(inbox.selectedConversation.lastMessage, bannedWords)}
            </p>
          </div>
        )}
      </ChatPanel>
    </ChatLayout>
  )
}
