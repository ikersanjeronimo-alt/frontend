import { useTranslation } from 'react-i18next'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './SaveButton.module.css'

/**
 * Botón "Guardar" / "✓ Guardado" para el patrón useSavedFlash.
 * Si pasas `saved=true`, muestra el texto de éxito durante el flash.
 * Cualquier otra prop nativa de <button> se reenvía (onClick, disabled, etc.).
 */
interface SaveButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  saved?: boolean
  /** Texto en estado normal. Por defecto t('common.save'). */
  label?: ReactNode
  /** Texto en estado guardado. Por defecto t('common.saved'). */
  savedLabel?: ReactNode
}

export function SaveButton({ saved, label, savedLabel, className, type, ...rest }: SaveButtonProps) {
  const { t } = useTranslation()
  return (
    <button
      type={type ?? 'button'}
      className={`${styles.btn} ${className ?? ''}`}
      {...rest}
    >
      {saved ? (savedLabel ?? t('common.saved')) : (label ?? t('common.save'))}
    </button>
  )
}
