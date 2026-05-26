import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

/**
 * Input estilizado de la app. Pasa-todo: cualquier prop nativa de <input>
 * funciona. El consumidor controla type, value, onChange, placeholder, etc.
 */
type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...rest }: InputProps) {
  return <input className={`${styles.input} ${className ?? ''}`} {...rest} />
}
