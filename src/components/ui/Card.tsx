import type { ReactNode } from 'react'
import styles from './Card.module.css'

/**
 * Caja blanca con padding, sombra suave y gap vertical entre hijos.
 * Soporta `title` (h3) y `body` (descripción) opcionales para los patrones
 * típicos de Settings/Moderation.
 */
interface CardProps {
  title?: string
  body?: ReactNode
  children?: ReactNode
  className?: string
}

export function Card({ title, body, children, className }: CardProps) {
  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {body && <p className={styles.body}>{body}</p>}
      {children}
    </div>
  )
}
