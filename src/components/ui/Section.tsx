import type { ReactNode } from 'react'
import styles from './Section.module.css'

/**
 * Contenedor para una sección de pantalla (Settings, Moderation, etc.).
 * Padding responsive + título opcional. Sustituye a la pareja
 * `<div className={styles.section}><h2 className={styles.sectionTitle}>`
 * que estaba repetida en cada page padre.
 */
interface SectionProps {
  title?: string
  children: ReactNode
  className?: string
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <div className={`${styles.section} ${className ?? ''}`}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {children}
    </div>
  )
}
