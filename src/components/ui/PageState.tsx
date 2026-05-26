import styles from './PageState.module.css'

interface PageStateProps {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  onRetry?: () => void
}

export function PageState({
  loading,
  error,
  empty,
  emptyMessage = 'No hay resultados.',
  onRetry,
}: PageStateProps) {
  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} role="status" aria-label="Cargando" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.error} role="alert">{error}</p>
        {onRetry && (
          <button className={styles.retryBtn} onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className={styles.center}>
        <p className={styles.empty}>{emptyMessage}</p>
      </div>
    )
  }

  return null
}
