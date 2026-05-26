import styles from './Toggle.module.css'

/**
 * Switch accesible (button + aria-checked + role=switch).
 * Antes vivía en components/settings/ pero se usa también en otras
 * secciones — lo subimos a ui/ para que sea reutilizable.
 */
interface ToggleProps {
  on: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}

export function Toggle({ on, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      onClick={() => onChange(!on)}
      aria-checked={on}
      aria-label={ariaLabel}
      role="switch"
    >
      <span className={styles.thumb} />
    </button>
  )
}
