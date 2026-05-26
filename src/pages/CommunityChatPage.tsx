import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCommunities } from '../hooks/useCommunities'
import { useCommunityChat } from '../hooks/useCommunityChat'
import { useCommunityMembers } from '../hooks/useCommunityMembers'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import {
  ChatLayout, ChatSidebar, ChatSidebarItem, ChatSidebarExplore,
  ChatMain, ChatHeader, ChatMessages, ChatBubble, ChatComposer, ChatPanel,
} from '../components/chat/ChatLayout'
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

  const cat = catFor('/comunidades-chat')

  if (!community) {
    return (
      <ChatLayout>
        <ChatMain>
          <ChatHeader onBack={() => navigate('/comunidades')} name={t('communities.notFoundTitle')} />
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

  const pinned = community.pinnedNote

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    void sendMessage(text)
    setInput('')
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
          name={community.name}
          meta={`${community.online} ${t('common.online')} · ${t('communities.modPrefix')} ${community.mod}`}
          onInfoToggle={() => setShowPanel(p => !p)}
          infoTitle={t('communities.info')}
        />

        {pinned && (
          <div className={styles.pinnedNote}>
            <span className={styles.pinnedIcon}></span>
            <span className={styles.pinnedText}>{pinned}</span>
          </div>
        )}

        <ChatMessages scrollDep={messages.length}>
          {messages.map((m, i) => {
            const prev = messages[i - 1]
            const showUsername = !m.own && (!prev || prev.username !== m.username || prev.own)
            const initials = m.username.slice(0, 2).toUpperCase()
            return (
              <ChatBubble
                key={m.id}
                side={m.own ? 'own' : 'other'}
                avatar={!m.own ? (showUsername ? initials : '') : undefined}
                username={showUsername && !m.own ? m.username : undefined}
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
          placeholder={t('communities.inputPh')}
          ariaLabel={t('communities.inputAria')}
        />
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

        <button
          type="button"
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
      </ChatPanel>

    </ChatLayout>
  )
}
