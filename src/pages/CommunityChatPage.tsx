import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCommunities } from '../hooks/useCommunities'
import { useCommunityChat } from '../hooks/useCommunityChat'
import { useCommunityMembers } from '../hooks/useCommunityMembers'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { initials } from '../lib/initials'
import { useAuth } from '../context/AuthContext'
import { useCommunityChatStore } from '../store/communityChatStore'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import {
  ChatLayout, ChatSidebar, ChatSidebarItem, ChatSidebarExplore,
  ChatMain, ChatHeader, ChatMessages, ChatBubble, ChatComposer, ChatPanel,
} from '../components/chat/ChatLayout'
import { BubbleMenu, type BubbleMenuItem } from '../components/chat/BubbleMenu'
import {
  deleteCommunityMessage,
  kickCommunityMember,
  setCommunityChatClosed,
  setCommunityPinnedNote,
} from '../services/communities'
import { reportMessage } from '../services/moderation'
import styles from './CommunityChatPage.module.css'

export function CommunityChatPage() {
  const { comunidadId } = useParams<{ comunidadId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()

  const { data: communities } = useCommunities()
  const community = communities.find(c => c.id === comunidadId)

  const { messages, sendMessage } = useCommunityChat(comunidadId ?? '')
  const { data: activeMembers } = useCommunityMembers(comunidadId ?? '', [community?.members])
  const { words: bannedWords } = useBannedWords()

  const [input, setInput] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [modError, setModError] = useState<string | null>(null)
  const [pinnedDraft, setPinnedDraft] = useState('')
  const [reportedMsgIds, setReportedMsgIds] = useState<Set<string>>(new Set())

  const handleReportMessage = (messageId: string) => {
    setReportedMsgIds(prev => new Set(prev).add(messageId))
    void reportMessage(messageId, t('map.reportReason')).catch(() => {
      setReportedMsgIds(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
    })
  }

  const cat = catFor('/comunidades-chat')

  useEffect(() => {
    setPinnedDraft(community?.pinnedNote ?? '')
  }, [community?.id, community?.pinnedNote])

  const canModerate = useMemo(() => {
    if (!community || !user) return false
    if (user.role === 'ADMIN') return true
    return user.role === 'MODERATOR' && community.modUserId === user.id
  }, [community, user])

  const isChatClosed = Boolean(community?.chatClosed)

  if (!community) {
    return (
      <ChatLayout>
        <ChatMain>
          <ChatHeader
            onBack={() => navigate('/comunidades')}
            backAriaLabel={t('common.back')}
            name={t('communities.notFoundTitle')}
          />
          <div className={styles.notFound}>
            <p className={styles.notFoundMsg}>{t('communities.notFoundMsg')}</p>
            <button type="button" className={styles.notFoundBtn} onClick={() => navigate('/comunidades')}>
              {t('communities.seeAll')}
            </button>
          </div>
        </ChatMain>
      </ChatLayout>
    )
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    if (isChatClosed && !canModerate) {
      setSendError(t('communities.chatClosedNotice'))
      return
    }

    setSendError(null)
    try {
      await sendMessage(text)
      setInput('')
    } catch {
      setSendError(t('common.errSend'))
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!comunidadId) return
    setModError(null)
    try {
      await deleteCommunityMessage(comunidadId, messageId)
      useCommunityChatStore.getState().removeMessage(comunidadId, messageId)
    } catch {
      setModError(t('common.errGeneric'))
    }
  }

  const handleKickMember = async (memberId: string) => {
    if (!comunidadId) return
    setModError(null)
    try {
      await kickCommunityMember(comunidadId, memberId)
    } catch {
      setModError(t('common.errGeneric'))
    }
  }

  const handleSavePinnedNote = async () => {
    if (!comunidadId) return
    setModError(null)
    try {
      const updated = await setCommunityPinnedNote(comunidadId, pinnedDraft)
      setPinnedDraft(updated.pinnedNote ?? '')
    } catch {
      setModError(t('common.errGeneric'))
    }
  }

  const handleToggleChatClosed = async () => {
    if (!comunidadId || !community) return
    setModError(null)
    try {
      await setCommunityChatClosed(comunidadId, !isChatClosed)
    } catch {
      setModError(t('common.errGeneric'))
    }
  }

  const joinedCommunities = communities.filter(c => c.joined)

  return (
    <ChatLayout>
      <ChatSidebar
        title={t('communities.sidebarTitle')}
        topRight={
          <SleepingCat
            color={cat.color}
            seed={cat.seed}
            size={72}
            className={styles.sidebarCat}
          />
        }
      >
        {joinedCommunities.map(c => (
          <ChatSidebarItem
            key={c.id}
            to={`/comunidades/${c.id}`}
            name={c.name}
            meta={`${c.online} ${t('common.online')}`}
          />
        ))}
        <ChatSidebarExplore to="/comunidades">{t('communities.explore')}</ChatSidebarExplore>
      </ChatSidebar>

      <ChatMain>
        <ChatHeader
          onBack={() => navigate('/comunidades')}
          backAriaLabel={t('common.back')}
          name={community.name}
          meta={`${community.online} ${t('common.online')} · ${t('communities.modPrefix')} ${community.mod}`}
          onInfoToggle={() => setShowPanel(p => !p)}
          infoTitle={t('communities.info')}
        />

        {community.pinnedNote && (
          <div className={styles.pinnedNote}>
            <span className={styles.pinnedIcon}>📌</span>
            <span className={styles.pinnedText}>{community.pinnedNote}</span>
          </div>
        )}

        <ChatMessages scrollDep={messages.length}>
          {messages.map((m) => {
            const isOwn = m.own || m.username === user?.username
            const menuItems: BubbleMenuItem[] = []
            if (!isOwn) {
              const reported = reportedMsgIds.has(m.id)
              menuItems.push({
                label: reported ? t('map.reported') : t('map.report'),
                onClick: () => handleReportMessage(m.id),
                disabled: reported,
              })
            }
            if (canModerate) {
              menuItems.push({
                label: t('common.delete'),
                onClick: () => handleDeleteMessage(m.id),
              })
            }
            return (
              <ChatBubble
                key={m.id}
                side={isOwn ? 'own' : 'other'}
                avatar={!isOwn ? initials(m.username) : undefined}
                username={isOwn ? t('common.you') : m.username}
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
          placeholder={isChatClosed && !canModerate ? t('communities.chatClosedPlaceholder') : t('communities.inputPh')}
          ariaLabel={t('communities.inputAria')}
          sendAriaLabel={t('communities.sendAria')}
          disabled={isChatClosed && !canModerate}
        />
        {sendError && <p role="alert" className={styles.sendError}>{sendError}</p>}
      </ChatMain>

      <ChatPanel visible={showPanel}>
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

        {canModerate ? (
          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>{t('communities.modTools')}</h4>

            <label className={styles.modLabel} htmlFor="pinned-note">
              {t('communities.pinnedNoteLabel')}
            </label>
            <textarea
              id="pinned-note"
              className={styles.modTextarea}
              rows={3}
              value={pinnedDraft}
              onChange={e => setPinnedDraft(e.target.value)}
              placeholder={t('communities.pinnedNotePh')}
            />
            <div className={styles.modActions}>
              <button type="button" className={styles.modPrimaryBtn} onClick={handleSavePinnedNote}>
                {t('communities.saveNote')}
              </button>
              <button type="button" className={styles.modSecondaryBtn} onClick={handleToggleChatClosed}>
                {isChatClosed ? t('communities.openChat') : t('communities.closeChat')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.panelContactBtn}
            onClick={() => navigate('/profesionales')}
          >
            {t('communities.contactMod')}
          </button>
        )}

        <div className={styles.panelSection}>
          <h4 className={styles.panelSectionTitle}>{t('communities.activeMembers')}</h4>
          <div className={styles.memberList}>
            {activeMembers.map(m => (
              <div key={m.userId} className={styles.memberRow}>
                <div className={styles.memberAvatar}>{m.initials}</div>
                <span className={styles.memberUsername}>{m.username}</span>
                <span className={styles.memberOnlineDot} />
                {canModerate && m.userId !== user?.id && (
                  <button
                    type="button"
                    className={styles.memberKickBtn}
                    onClick={() => handleKickMember(m.userId)}
                  >
                    {t('communities.kickMember')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {community.chatClosed && (
          <p className={styles.closedNotice}>
            {canModerate ? t('communities.chatClosedAdmin') : t('communities.chatClosedNotice')}
          </p>
        )}

        {modError && <p role="alert" className={styles.sendError}>{modError}</p>}
      </ChatPanel>
    </ChatLayout>
  )
}
