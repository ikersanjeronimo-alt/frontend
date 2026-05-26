import { useEffect, useRef } from 'react'
import type { ReactNode, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './ChatLayout.module.css'

/**
 * Esqueleto de pantallas de chat — comparte el visual entre CommunityChatPage
 * y PrivateChatPage. Las páginas padre componen los bloques (sidebar,
 * header, mensajes, composer, panel) y cada bloque tiene su propio sub-componente.
 *
 * Los textos visibles (placeholders, aria-labels, títulos) los pasa la página
 * padre porque dependen del contexto i18n.
 */

interface ChatLayoutProps {
  children: ReactNode
}

export function ChatLayout({ children }: ChatLayoutProps) {
  return <div className={styles.layout}>{children}</div>
}

// ── Sidebar ────────────────────────────────────────────────

interface ChatSidebarProps {
  title: string
  /** Esquina superior derecha — típicamente un SleepingCat decorativo. */
  topRight?: ReactNode
  /** Items de la lista + el botón "Explorar..." si aplica. */
  children: ReactNode
}

export function ChatSidebar({ title, topRight, children }: ChatSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>{title}</h2>
        {topRight}
      </div>
      <nav className={styles.sidebarList}>{children}</nav>
    </aside>
  )
}

interface ChatSidebarItemProps {
  to: string
  avatar?: ReactNode
  name: string
  meta?: string
}

export function ChatSidebarItem({ to, avatar, name, meta }: ChatSidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`
      }
    >
      {avatar}
      <div className={styles.sidebarInfo}>
        <span className={styles.sidebarName}>{name}</span>
        {meta && <span className={styles.sidebarMeta}>{meta}</span>}
      </div>
    </NavLink>
  )
}

interface ChatSidebarExploreProps {
  to: string
  children: ReactNode
}

export function ChatSidebarExplore({ to, children }: ChatSidebarExploreProps) {
  return <NavLink to={to} className={styles.sidebarExplore}>{children}</NavLink>
}

// ── Main column ────────────────────────────────────────────

interface ChatMainProps {
  children: ReactNode
}

export function ChatMain({ children }: ChatMainProps) {
  return <main className={styles.chat}>{children}</main>
}

// ── Header ────────────────────────────────────────────────

interface ChatHeaderProps {
  onBack: () => void
  backAriaLabel?: string
  /** Avatar opcional a la izquierda del título. */
  avatar?: ReactNode
  name: string
  meta?: string
  onInfoToggle?: () => void
  infoTitle?: string
}

export function ChatHeader({ onBack, backAriaLabel, avatar, name, meta, onInfoToggle, infoTitle }: ChatHeaderProps) {
  return (
    <div className={styles.header}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label={backAriaLabel}>
        ←
      </button>
      {avatar}
      <div className={styles.headerInfo}>
        <span className={styles.headerName}>{name}</span>
        {meta && <span className={styles.headerMeta}>{meta}</span>}
      </div>
      {onInfoToggle && (
        <button
          type="button"
          className={styles.infoToggle}
          onClick={onInfoToggle}
          title={infoTitle}
          aria-label={infoTitle}
        >
          ⓘ
        </button>
      )}
    </div>
  )
}

// ── Messages ──────────────────────────────────────────────

interface ChatMessagesProps {
  /** Cualquier valor que cambie cuando lleguen mensajes nuevos. El componente
   *  hará auto-scroll al fondo SOLO si el usuario ya estaba cerca del fondo. */
  scrollDep: unknown
  children: ReactNode
}

export function ChatMessages({ scrollDep, children }: ChatMessagesProps) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const endRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [scrollDep])

  return (
    <div className={styles.messages} ref={messagesRef}>
      {children}
      <div ref={endRef} />
    </div>
  )
}

// ── Bubble ────────────────────────────────────────────────

interface ChatBubbleProps {
  /** Lado del mensaje. `own` = derecha del usuario; `other` = izquierda. */
  side: 'own' | 'other'
  /** Avatar (iniciales/foto) — solo se renderiza si lo pasas; típicamente solo en `other`. */
  avatar?: ReactNode
  /** Username arriba de la burbuja — útil para grupos cuando es el primer
   *  mensaje del autor; omitir para mensajes consecutivos del mismo usuario. */
  username?: string
  time: string
  children: ReactNode
}

export function ChatBubble({ side, avatar, username, time, children }: ChatBubbleProps) {
  const isOwn = side === 'own'
  return (
    <div className={`${styles.messageGroup} ${isOwn ? styles.messageGroupOwn : ''}`}>
      {!isOwn && (avatar !== undefined ? <div className={styles.bubbleAvatar}>{avatar}</div> : null)}
      <div className={styles.bubbleCol}>
        {username && <span className={styles.bubbleUsername}>{username}</span>}
        <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
          {children}
        </div>
        <span className={styles.bubbleTime}>{time}</span>
      </div>
    </div>
  )
}

// ── Composer ──────────────────────────────────────────────

interface ChatComposerProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  placeholder: string
  ariaLabel?: string
  sendAriaLabel?: string
}

export function ChatComposer({ value, onChange, onSend, placeholder, ariaLabel, sendAriaLabel }: ChatComposerProps) {
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className={styles.composer}>
      <textarea
        aria-label={ariaLabel}
        className={styles.composerInput}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <button
        type="button"
        className={styles.sendBtn}
        onClick={onSend}
        disabled={!value.trim()}
        aria-label={sendAriaLabel}
      >
        ➤
      </button>
    </div>
  )
}

// ── Panel lateral derecho ─────────────────────────────────

interface ChatPanelProps {
  visible: boolean
  children: ReactNode
}

export function ChatPanel({ visible, children }: ChatPanelProps) {
  return (
    <aside className={`${styles.panel} ${visible ? styles.panelVisible : ''}`}>
      {children}
    </aside>
  )
}
