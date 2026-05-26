import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import loginStyles from '../../pages/LoginPage.module.css'
import styles from './TotpPanel.module.css'

interface EnrollData {
  secret: string
  otpauthUri: string
}

interface Props {
  /** Si está presente, se renderiza el QR + secret arriba del input. */
  enroll?: EnrollData
  onVerify: (code: string) => Promise<void>
  /** Etiqueta del botón secundario (típicamente "Volver" / "Cancelar"). */
  onCancel?: () => void
  /** Submit label opcional. Por defecto "Verificar". */
  submitLabel?: string
  cancelLabel?: string
}

export function TotpPanel({ enroll, onVerify, onCancel, submitLabel, cancelLabel }: Props) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Render del QR a data URL para meter en <img>. El componente qrcode trabaja
  // sobre canvas/dataURL; con dataURL evitamos tener que tocar el DOM imperativo.
  // Si no hay enroll, no hace falta limpiar el state porque la sección del QR
  // se condiciona con `enroll && (...)` y `qrDataUrl` solo se lee dentro de ella.
  useEffect(() => {
    if (!enroll) return
    let cancelled = false
    QRCode.toDataURL(enroll.otpauthUri, { width: 220, margin: 1 })
      .then(url => { if (!cancelled) setQrDataUrl(url) })
      .catch(() => { if (!cancelled) setQrDataUrl(null) })
    return () => { cancelled = true }
  }, [enroll])

  // Foco automático en el input al montar y al volver a habilitarse tras error.
  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError(t('totp.errLength'))
      return
    }
    setLoading(true)
    try {
      await onVerify(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('totp.errGeneric'))
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={loginStyles.form} onSubmit={handleSubmit} noValidate>

      {enroll && (
        <>
          <p className={styles.intro}>{t('totp.enrollIntro')}</p>

          <div className={styles.qrFrame}>
            {qrDataUrl
              ? <img className={styles.qrImg} src={qrDataUrl} alt={t('totp.qrAlt')} />
              : <div className={styles.qrPlaceholder}>{t('totp.qrLoading')}</div>}
          </div>

          <button
            type="button"
            className={styles.secretToggle}
            onClick={() => setShowSecret(s => !s)}
          >
            {showSecret ? t('totp.hideSecret') : t('totp.showSecret')}
          </button>

          {showSecret && (
            <div className={styles.secretReveal}>
              <span className={styles.secretLabel}>{t('totp.secretLabel')}</span>
              <code className={styles.secretValue}>{enroll.secret}</code>
            </div>
          )}
        </>
      )}

      <div className={loginStyles.field}>
        <label className={loginStyles.label}>{t('totp.codeLbl')}</label>
        <input
          ref={inputRef}
          className={`${loginStyles.input} ${styles.codeInput}`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          disabled={loading}
        />
      </div>

      {error && <p className={loginStyles.error}>{error}</p>}

      <button
        type="submit"
        className={`${loginStyles.submitBtn} hover-lift`}
        disabled={loading || code.length !== 6}
      >
        {loading ? t('totp.verifying') : (submitLabel ?? t('totp.verify'))}
      </button>

      {onCancel && (
        <button
          type="button"
          className={`${loginStyles.forgotBtn} ${loginStyles.backBtnBlock}`}
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel ?? t('common.back')}
        </button>
      )}

    </form>
  )
}
