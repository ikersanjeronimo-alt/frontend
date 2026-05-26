import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <div className={styles.horizon}>
          <SleepingCat
            color={catFor('/404').color}
            seed={catFor('/404').seed}
            size={120}
            className={styles.notFoundCat}
          />
        </div>
        <h1 className={styles.title}>{t('notFound.title')}</h1>
        <p className={styles.subtitle}>
          {t('notFound.subtitle')}
        </p>
        <Link to="/" className={styles.btn}>
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  )
}
