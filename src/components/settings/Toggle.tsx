import styles from '../../pages/SettingsPage.module.css'

interface ToggleProps {
  on: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}

export function Toggle({ on, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={() => onChange(!on)}
      aria-checked={on}
      aria-label={ariaLabel}
      role="switch"
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}
