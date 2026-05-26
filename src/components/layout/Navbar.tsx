import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRole } from '../../hooks/useRole'
import { IconUser } from '../ui/Icons'
import styles from './Navbar.module.css'

export function Navbar() {
  const { user, isMod, isLoggedIn } = useRole()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Links según rol: los mods/admins ven panel + lo justo para moderar;
  // anon/users mantienen el catálogo completo de features de bienestar.
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

  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const goToDashboard = () => { navigate('/dashboard'); closeMenu() }
  const goToSettings  = () => { navigate('/configuracion'); closeMenu() }

  // Mismo bloque para ANON y USER/MOD/ADMIN: engranaje → ajustes, username → dashboard.
  // La edición del username vive solo en /configuracion > Cuenta (fuente única).
  const userSection = user ? (
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
  ) : null

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
