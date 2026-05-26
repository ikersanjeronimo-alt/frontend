import { Toggle } from './Toggle'
import styles from './ToggleRow.module.css'

/**
 * Patrón "etiqueta arriba + descripción + toggle a la derecha", separado por
 * línea inferior. Usado en Settings (Privacy, Notifications, Appearance).
 */
interface ToggleRowProps {
  label: string
  sub?: string
  on: boolean
  onChange: (v: boolean) => void
}

export function ToggleRow({ label, sub, on, onChange }: ToggleRowProps) {
  return (
    <div className={styles.row}>
      <div>
        <p className={styles.label}>{label}</p>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
      <Toggle on={on} ariaLabel={label} onChange={onChange} />
    </div>
  )
}
