import { useState, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useRole } from '../../hooks/useRole'
import { IconUser } from '../ui/Icons'
import styles from './Navbar.module.css'

export function Navbar() {
  const { user, isMod, isLoggedIn } = useRole()
  const { updateUsername } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const NAV_LINKS = isMod
    ? [
        { to: '/moderacion',   label: t('nav.moderacion') },
        { to: '/comunidades',  label: t('nav.comunidades') },
        { to: '/eventos',      label: t('nav.eventos') },
        { to: '/chat/inbox',   label: t('nav.chatsPrivados') },
      ]
    : [
        { to: '/comunidades',        label: t('nav.comunidades') },
        { to: '/profesionales',      label: t('nav.profesionales') },
        { to: '/eventos',            label: t('nav.eventos') },
        { to: '/mapa',               label: t('nav.mapa') },
        { to: '/botella',            label: t('nav.botella') },
        { to: '/maquina-del-tiempo', label: t('nav.timeMachine') },
      ]

  const [menuOpen, setMenuOpen] = useState(false)

  // Estado del chip editable (solo ANON)
  const [editing,   setEditing]   = useState(false)
  const [nickVal,   setNickVal]   = useState('')
  const [nickError, setNickError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const closeMenu = () => setMenuOpen(false)

  const goToDashboard = () => { navigate('/dashboard'); closeMenu() }
  const goToSettings  = () => { navigate('/configuracion'); closeMenu() }

  const startEdit = () => {
    setNickVal(user?.username ?? '')
    setNickError(null)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = async () => {
    const trimmed = nickVal.trim()
    if (!trimmed || trimmed === user?.username) { setEditing(false); return }
    try {
      await updateUsername(trimmed)
      setEditing(false)
      setNickError(null)
    } catch (e: unknown) {
      const status = (e as { status?: number }).status
      setNickError(status === 409 ? t('nav.nickTaken') : t('common.errSend'))
      inputRef.current?.select()
    }
  }

  const handleNickKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); void commitEdit() }
    if (e.key === 'Escape') setEditing(false)
  }

  const isAnon = user?.role === 'ANON'

  // ANON: chip editable con lápiz inline
  // USER/MOD/ADMIN: engranaje (→ ajustes) + username estático (→ dashboard)
  const userSection = !user ? null : isAnon ? (
    editing ? (
      <div className={styles.nickEditWrap}>
        <input
          ref={inputRef}
          className={`${styles.nickInput} ${nickError ? styles.nickInputError : ''}`}
          value={nickVal}
          onChange={e => { setNickVal(e.target.value); setNickError(null) }}
          onBlur={() => { void commitEdit() }}
          onKeyDown={handleNickKey}
          maxLength={32}
          aria-label={t('nav.editNick')}
        />
        {nickError && <span className={styles.nickErrorMsg}>{nickError}</span>}
      </div>
    ) : (
      <button className={styles.nickChip} onClick={startEdit} title={t('nav.editNick')}>
        {user.username}
        <span className={styles.nickEditIcon} aria-hidden>✎</span>
      </button>
    )
  ) : (
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
        {user.username}
      </button>
    </>
  )

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>

        <NavLink to="/" className={styles.logo} onClick={closeMenu}>
          <img src="/logo.png" alt="" aria-hidden className={styles.logoIcon} />
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
