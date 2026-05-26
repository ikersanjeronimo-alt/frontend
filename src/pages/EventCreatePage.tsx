import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './EventCreatePage.module.css'

export function EventCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [date,     setDate]     = useState('')
  const [time,     setTime]     = useState('')
  const [duration, setDuration] = useState('')
  const [host,     setHost]     = useState(user?.username ?? '')
  const [done,     setDone]     = useState(false)
  const redirectTimer = useRef<number | null>(null)

  // Limpiar el timer al desmontar para evitar navegar después del unmount.
  useEffect(() => () => {
    if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current)
  }, [])

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.centered}>
          <p className={styles.centeredTitle}>{t('events.createDone')}</p>
          <p className={styles.centeredText}>{t('events.createRedir')}</p>
        </div>
      </div>
    )
  }

  const canSubmit = title.trim() && desc.trim() && date && time && duration.trim() && host.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    // TODO: fetch real — POST /api/events
    // const payload = { title, desc, date, time, duration, host, spots: 20, total: 20, tags: [] }
    // createEvent(payload).then(e => navigate(`/eventos/${e.id}`))
    setDone(true)
    if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current)
    redirectTimer.current = window.setTimeout(() => {
      redirectTimer.current = null
      navigate('/eventos')
    }, 1800)
  }

  return (
    <div className={styles.page}>

      <div className={styles.backRow}>
        <button className={styles.backLink} onClick={() => navigate('/eventos')}>
          {t('events.createBackBtn')}
        </button>
      </div>

      <div className={styles.inner}>

        <div className={styles.preview}>
          <p className={styles.previewLabel}>{t('events.createPreview')}</p>
          <p className={styles.previewTitle}>{title || t('events.createPhTitle')}</p>
          <p className={styles.previewHost}>{host ? `${t('common.host')} ${host}` : t('events.createHostFallback')}</p>
          <SleepingCat
            color={catFor('/eventos-detail').color}
            seed={catFor('/eventos-detail').seed}
            size={80}
            className={styles.createCat}
          />
        </div>

        <div className={styles.form}>

          <div className={styles.card}>
            <label className={styles.label} htmlFor="ev-title">{t('events.createLblTitle')}</label>
            <input
              id="ev-title"
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('events.createPhDescTitle')}
              maxLength={80}
            />
          </div>

          <div className={styles.card}>
            <label className={styles.label} htmlFor="ev-desc">{t('events.createLblDesc')}</label>
            <textarea
              id="ev-desc"
              className={styles.textarea}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={t('events.createPhDescBody')}
              rows={4}
              maxLength={500}
            />
            <span className={styles.charCount}>{desc.length} / 500</span>
          </div>

          <div className={styles.card}>
            <p className={styles.label}>{t('events.createLblDate')}</p>
            <div className={styles.dateRow}>
              <div className={styles.dateField}>
                <label className={styles.subLabel} htmlFor="ev-date">{t('events.createSubDate')}</label>
                <input
                  id="ev-date"
                  className={styles.input}
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className={styles.dateField}>
                <label className={styles.subLabel} htmlFor="ev-time">{t('events.createSubTime')}</label>
                <input
                  id="ev-time"
                  className={styles.input}
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
              <div className={styles.dateField}>
                <label className={styles.subLabel} htmlFor="ev-dur">{t('events.createSubDur')}</label>
                <input
                  id="ev-dur"
                  className={styles.input}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder={t('events.createPhDur')}
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <label className={styles.label} htmlFor="ev-host">{t('events.createLblHost')}</label>
            <input
              id="ev-host"
              className={styles.input}
              value={host}
              onChange={e => setHost(e.target.value)}
              placeholder={t('events.createPhHost')}
              maxLength={60}
            />
          </div>

          <button
            className={`${styles.submitBtn} hover-lift`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {t('events.createSubmit')}
          </button>

        </div>
      </div>
    </div>
  )
}
