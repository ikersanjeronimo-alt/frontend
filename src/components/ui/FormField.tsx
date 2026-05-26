import type { ReactNode } from 'react'
import styles from './FormField.module.css'

/**
 * Envoltura semántica para un campo de formulario:
 *   label opcional + control(es) que recibes como children + hint opcional + error opcional.
 *
 * No incluye el `<input>` para mantener flexibilidad — el consumidor mete
 * `<Input>`, `<textarea>`, `<Select>`, o el control que necesite.
 */
interface FormFieldProps {
  label?: string
  htmlFor?: string
  hint?: string
  error?: string | null
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && <label className={styles.label} htmlFor={htmlFor}>{label}</label>}
      {children}
      {error
        ? <p className={styles.error} role="alert">{error}</p>
        : hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
