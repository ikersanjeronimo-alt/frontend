import { useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { IconUser } from '../ui/Icons'
import styles from './Navbar.module.css'

export function Navbar() {
  const { user, updateUsername } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Links según rol: los mods/admins ven panel + lo justo para moderar;
  // anon/users mantienen el catálogo completo de features de bienestar.
  const isMod = user?.role === 'MODERATOR' || user?.role === 'ADMIN'
  const NAV_LINKS = isMod
    ? [
        { to: '/moderacion',         label: t('nav.moderacion') },
        { to: '/comunidades',        label: t('nav.comunidades') },
        { to: '/eventos',            label: t('nav.eventos') },
        { to: '/profesionales',      label: t('nav.profesionales') },
      ]
    : [
        { to: '/comunidades',        label: t('nav.comunidades') },
        { to: '/profesionales',      label: t('nav.profesionales') },
        { to: '/eventos',            label: t('nav.eventos') },
        { to: '/mapa',               label: t('nav.mapa') },
        { to: '/botella',            label: t('nav.botella') },
        { to: '/maquina-del-tiempo', label: t('nav.timeMachine') },
      ]

  const isLoggedIn = !!user && user.role !== 'ANON'

  const [menuOpen, setMenuOpen]     = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameDraft, setUsernameDraft]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUsernameClick = () => {
    setUsernameDraft(user?.username ?? '')
    setEditingUsername(true)
    // setTimeout 0 para esperar a que el input se monte antes de seleccionar
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleUsernameSave = () => {
    const trimmed = usernameDraft.trim()
    if (trimmed && trimmed !== user?.username) updateUsername(trimmed)
    setEditingUsername(false)
  }

  const handleUsernameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  handleUsernameSave()
    if (e.key === 'Escape') setEditingUsername(false)
  }

  const closeMenu = () => setMenuOpen(false)

  const goToDashboard = () => {
    navigate('/dashboard')
    closeMenu()
  }

  const goToSettings = () => {
    navigate('/configuracion')
    closeMenu()
  }

  const usernameChipProps = {
    username: user?.username,
    editing: editingUsername,
    draft: usernameDraft,
    inputRef,
    onChipClick:   handleUsernameClick,
    onDraftChange: setUsernameDraft,
    onBlur:        handleUsernameSave,
    onKeyDown:     handleUsernameKeyDown,
  }

  const userSection = isLoggedIn ? (
    <>
      <button
        className={styles.dashboardBtn}
        onClick={goToSettings}
        aria-label={t('nav.ajustes')}
        title={t('nav.ajustes')}
      >
        <IconUser size={18} />
      </button>
      <button
        className={styles.usernameStatic}
        onClick={goToDashboard}
        title={t('nav.dashboard')}
      >
        {user?.username ?? '...'}
      </button>
    </>
  ) : (
    <UsernameChip {...usernameChipProps} />
  )

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>

        <NavLink to="/" className={styles.logo} onClick={closeMenu}>
          <div className={styles.logoIcon}>S</div>
          <span className={styles.logoText}>ShareYourStory</span>
        </NavLink>

        <div className={styles.links}>
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => isActive ? styles.linkActive : styles.link}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.right}>
          {userSection}
          {!isLoggedIn && (
            <button className={styles.enterBtn} onClick={() => navigate('/login')}>
              {t('nav.entrar')}
            </button>
          )}
        </div>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}
            onClick={closeMenu}
          >
            {link.label}
          </NavLink>
        ))}

        <div className={styles.mobileDivider} />

        <div className={styles.mobileBottom}>
          {userSection}
          {!isLoggedIn && (
            <button
              className={styles.enterBtn}
              onClick={() => { navigate('/login'); closeMenu() }}
            >
              {t('nav.entrar')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

interface UsernameChipProps {
  username:          string | undefined
  editing:       boolean
  draft:         string
  inputRef:      React.RefObject<HTMLInputElement | null>
  onChipClick:   () => void
  onDraftChange: (v: string) => void
  onBlur:        () => void
  onKeyDown:     (e: React.KeyboardEvent) => void
}

function UsernameChip({ username, editing, draft, inputRef, onChipClick, onDraftChange, onBlur, onKeyDown }: UsernameChipProps) {
  const { t } = useTranslation()
  if (editing) {
    return (
      <input
        ref={inputRef}
        className={styles.usernameInput}
        value={draft}
        onChange={e => onDraftChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        maxLength={32}
        autoFocus
      />
    )
  }
  return (
    <button className={styles.usernameChip} onClick={onChipClick} title={t('nav.editUsername')}>
      <span>{username ?? '...'}</span>
      <span className={styles.editIcon}>✎</span>
    </button>
  )
}
