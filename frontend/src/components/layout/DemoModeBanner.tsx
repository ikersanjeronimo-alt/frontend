import { useDemoMode } from '../../hooks/useDemoMode'
import styles from './DemoModeBanner.module.css'

export function DemoModeBanner() {
  const active = useDemoMode()
  if (!active) return null
  return (
    <div className={styles.banner} role="status">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.text}>
        <strong>Modo demostración</strong> — el servidor no está disponible; estás viendo datos de ejemplo.
      </span>
    </div>
  )
}
