import type { ReactNode } from 'react'
import styles from './Feedback.module.css'

/**
 * Mensaje breve junto a un control. El de error usa `role="alert"` para que
 * lectores de pantalla lo anuncien inmediatamente.
 */
type Variant = 'error' | 'success'

interface FeedbackProps {
  variant: Variant
  children: ReactNode
}

export function Feedback({ variant, children }: FeedbackProps) {
  return (
    <p
      className={variant === 'error' ? styles.error : styles.success}
      role={variant === 'error' ? 'alert' : undefined}
    >
      {children}
    </p>
  )
}
