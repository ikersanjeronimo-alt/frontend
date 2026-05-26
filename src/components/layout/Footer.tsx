import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconLock } from '../ui/Icons'
import styles from './Footer.module.css'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className={styles.footer}>
      <NavLink to="/" className={styles.logo}>
        <div className={styles.logoIcon}>S</div>
        <span className={styles.logoText}>ShareYourStory</span>
      </NavLink>

      <NavLink to="/profesionales" className={styles.helpLink}>
        {t('footer.ayuda')}
      </NavLink>

      <span className={styles.privacy}>
        <IconLock size={14} />
        <span>{t('footer.privacy')}</span>
      </span>
    </footer>
  )
}
