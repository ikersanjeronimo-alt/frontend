import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { sendLetter } from '../services/letters'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './TimeMachinePage.module.css'

type Step = 'write' | 'confirm' | 'sent'

const DELIVERY_YEARS = 5
const MAX_CHARS = 1000

export function TimeMachinePage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [step, setStep]     = useState<Step>('write')
  const [letter, setLetter] = useState('')
  const [email, setEmail]   = useState('')
  const [sendError, setSendError] = useState('')
  const [sending, setSending]     = useState(false)

  // Fecha de entrega elegida por el usuario (input type=date → yyyy-MM-dd).
  // Por defecto, dentro de DELIVERY_YEARS años; mínimo, mañana.
  const toInputValue = (d: Date) => d.toISOString().slice(0, 10)
  const todayInput = toInputValue(new Date())
  const minDelivery = toInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000))

  const [deliveryInput, setDeliveryInput] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + DELIVERY_YEARS)
    return toInputValue(d)
  })

  // El backend espera dd-MM-yyyy.
  const deliveryStr = deliveryInput ? deliveryInput.split('-').reverse().join('-') : ''
  const isFutureDate = !!deliveryInput && deliveryInput > todayInput

  const canContinue = letter.trim().length >= 20 && email.trim().length > 0 && isFutureDate

  const handleSend = async () => {
    setSendError('')
    setSending(true)
    try {
      await sendLetter(letter, email, deliveryStr)
      setStep('sent')
    } catch (e) {
      setSendError(e instanceof Error ? e.message : t('time.errSend'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.blob1} blob blob-float`} />
      <div className={`${styles.blob2} blob blob-float-slow`} />

      <div className={`${styles.card} animate-fadeInUp`}>

        <div className={styles.header}>
          <div className={styles.headerEmoji}></div>
          <h1 className={styles.title}>{t('time.title')}</h1>
          <p className={styles.subtitle}>
            {t('time.subtitle1')}<br />
            {t('time.subtitle2')} <strong>{deliveryStr}</strong>.
          </p>
          <SleepingCat
            color={catFor('/maquina-del-tiempo').color}
            seed={catFor('/maquina-del-tiempo').seed}
            size={88}
            className={styles.timeCat}
          />
        </div>

        {step === 'write' && (
          <div className={styles.body}>
            <div className={styles.paperWrapper}>
              <div className={styles.paperLines} aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={styles.paperLine} />
                ))}
              </div>
              <textarea
                aria-label={t('time.textareaAria')}
                className={styles.textarea}
                placeholder={t('time.textareaPh', { username: user?.username ?? 'yo', years: DELIVERY_YEARS })}
                value={letter}
                onChange={e => setLetter(e.target.value.slice(0, MAX_CHARS))}
                maxLength={MAX_CHARS}
                autoFocus
              />
            </div>
            <div className={styles.charCount}>
              {letter.length} / {MAX_CHARS} {t('time.chars')}
              {letter.length < 20 && letter.length > 0 && (
                <span className={styles.charHint}> · {t('time.minChars')}</span>
              )}
            </div>

            <div className={styles.emailRow}>
              <label className={styles.emailLabel} htmlFor="tm-email">
                {t('time.emailLbl')}
              </label>
              <input
                id="tm-email"
                className={styles.emailInput}
                type="email"
                placeholder={t('time.emailPh')}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p className={styles.emailNote}>
                {t('time.emailNote')}
              </p>
            </div>

            <div className={styles.emailRow}>
              <label className={styles.emailLabel} htmlFor="tm-date">
                {t('time.sendOnDay')}
              </label>
              <input
                id="tm-date"
                className={styles.emailInput}
                type="date"
                min={minDelivery}
                value={deliveryInput}
                onChange={e => setDeliveryInput(e.target.value)}
              />
            </div>

            <button
              className={`${styles.primaryBtn} hover-lift`}
              onClick={() => setStep('confirm')}
              disabled={!canContinue}
            >
              {t('time.review')}
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className={styles.body}>
            <div className={styles.confirmBox}>
              <p className={styles.confirmLetter}>{letter}</p>
            </div>

            <div className={styles.confirmMeta}>
              <div className={styles.confirmRow}>
                <span className={styles.confirmIcon}></span>
                <div>
                  <span className={styles.confirmLabel}>{t('time.sendOnDay')}</span>
                  <span className={styles.confirmValue}>{deliveryStr}</span>
                </div>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmIcon}></span>
                <div>
                  <span className={styles.confirmLabel}>{t('time.toEmail')}</span>
                  <span className={styles.confirmValue}>{email}</span>
                </div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setStep('write')}
                disabled={sending}
              >
                {t('time.editLetter')}
              </button>
              <button
                className={`${styles.primaryBtn} hover-lift`}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? t('time.sending') : t('time.sendFuture')}
              </button>
            </div>

            {sendError && (
              <p className={styles.errorMsg} role="alert">{sendError}</p>
            )}
          </div>
        )}

        {step === 'sent' && (
          <div className={`${styles.body} ${styles.sentBody}`}>
            <div className={styles.sentEmoji}></div>
            <h2 className={styles.sentTitle}>{t('time.sentTitle')}</h2>
            <p className={styles.sentText}>
              {t('time.sentLine1Pre')} <strong>{deliveryStr}</strong> {t('time.sentLine1Mid')} <strong>{email}</strong>.
            </p>
            <p className={styles.sentText}>
              {t('time.sentLine2')}
            </p>
            <button
              className={`${styles.primaryBtn} hover-lift`}
              onClick={() => { setStep('write'); setLetter(''); setEmail('') }}
            >
              {t('time.another')}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
