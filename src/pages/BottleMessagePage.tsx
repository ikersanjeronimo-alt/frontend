import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sendBottle, receiveBottle } from '../services/bottles'
import type { ApiError } from '../services/api'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './BottleMessagePage.module.css'

const FLOATING_SIZES = [30, 24, 20]

type Step = 'write' | 'sent' | 'received'

const MAX_CHARS = 400

interface ReceivedBottle { text: string}

export function BottleMessagePage() {
  const { t } = useTranslation()
  const [step, setStep]               = useState<Step>('write')
  const [message, setMessage]         = useState('')
  const [received, setReceived]       = useState<ReceivedBottle | null>(null)
  const [throwing, setThrowing]       = useState(false)
  const [receiving, setReceiving]     = useState(false)
  const [sendError, setSendError]     = useState('')
  const { words: bannedWords }        = useBannedWords()

  const handleSend = async () => {
    if (!message.trim() || throwing) return
    setThrowing(true)
    setSendError('')
    try {
      await sendBottle(message.trim())
      setStep('sent')
    } catch (e) {
      setSendError(e instanceof Error ? e.message : t('bottle.errSend'))
    } finally {
      setThrowing(false)
    }
  }

  const handleReceive = async () => {
    if (receiving) return
    setReceiving(true)
    setSendError('')
    try {
      const b = await receiveBottle()
      setReceived({ text: b.message})
      setStep('received')
    } catch (e) {
      const status = (e as ApiError).status
      if (status === 404) {
        setSendError(t('bottle.noBottles'))
      } else {
        setSendError(e instanceof Error ? e.message : t('bottle.errReceive'))
      }
    } finally {
      setReceiving(false)
    }
  }

  const handleReset = () => {
    setStep('write')
    setMessage('')
    setReceived(null)
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.wave1}`} aria-hidden="true" />
      <div className={`${styles.wave2}`} aria-hidden="true" />

      {/* Botellas flotantes: al clicarlas se recoge una botella del mar */}
      <div className={styles.sceneBottles}>
        {([0, 1, 2] as const).map(i => (
          <button
            key={i}
            type="button"
            className={`${styles.floatingBottle} ${styles[`bottle${i + 1}`]}`}
            onClick={handleReceive}
            disabled={receiving}
            aria-label={t('bottle.receive')}
          >
            <img src="/bottle.png" alt="" width={FLOATING_SIZES[i]} className={styles.bottleImg} />
          </button>
        ))}
      </div>

      <div className={`${styles.card} animate-fadeInUp`}>

        {step === 'write' && (
          <>
            <div className={styles.header}>

              <h1 className={styles.title}>{t('bottle.title')}</h1>
              <p className={styles.subtitle}>{t('bottle.subtitle')}</p>
              <SleepingCat
                color={catFor('/botella').color}
                seed={catFor('/botella').seed}
                size={88}
                className={styles.bottleCat}
              />
            </div>

            <div className={styles.body}>
              <textarea
                aria-label={t('bottle.textareaAria')}
                className={styles.textarea}
                placeholder={t('bottle.textareaPh')}
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
                maxLength={MAX_CHARS}
                autoFocus
              />
              <div className={styles.charCount}>
                {message.length} / {MAX_CHARS}
                {message.length > 0 && message.trim().length < 10 && (
                  <span className={styles.charHint}> · {t('bottle.minChars')}</span>
                )}
              </div>

              <button
                className={`${styles.sendBtn} ${throwing ? styles.sendBtnThrowing : ''} hover-lift`}
                onClick={handleSend}
                disabled={message.trim().length < 10 || throwing}
              >
                {throwing ? t('bottle.sending') : t('bottle.send')}
              </button>

              {sendError && (
                <p className={styles.errorMsg} role="alert">{sendError}</p>
              )}

              <div className={styles.divider}>
                <span>{t('bottle.or')}</span>
              </div>

              <button className={styles.receiveBtn} onClick={handleReceive} disabled={receiving}>
                {receiving ? t('common.loading') : t('bottle.receive')}
              </button>
            </div>
          </>
        )}

        {step === 'sent' && (
          <div className={styles.resultBody}>
            <div className={styles.resultEmoji}></div>
            <h2 className={styles.resultTitle}>{t('bottle.sentTitle')}</h2>
            <p className={styles.resultText}>{t('bottle.sentText')}</p>
            <div className={styles.resultActions}>
              <button className={`${styles.sendBtn} hover-lift`} onClick={handleReset}>
                {t('bottle.sentAnother')}
              </button>
              <button className={styles.receiveBtn} onClick={handleReceive} disabled={receiving}>
                {receiving ? t('common.loading') : t('bottle.receive')}
              </button>
            </div>
          </div>
        )}

        {step === 'received' && received && (
          <div className={styles.resultBody}>
            <div className={styles.resultEmoji}></div>
            <h2 className={styles.resultTitle}>{t('bottle.receivedTitle')}</h2>
            <div className={styles.receivedNote}>
              <p className={styles.receivedText}>"{maskBannedWords(received.text, bannedWords)}"</p>
            </div>
            <p className={styles.resultText}>{t('bottle.receivedNote')}</p>
            <div className={styles.resultActions}>
              <button className={`${styles.sendBtn} hover-lift`} onClick={handleReset}>
                {t('bottle.writeMine')}
              </button>
              <button className={styles.receiveBtn} onClick={handleReceive} disabled={receiving}>
                {receiving ? t('common.loading') : t('bottle.receiveAnother')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
