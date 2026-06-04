import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { createCommunity } from '../services/communities'
import { type ApiError } from '../services/api'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './CommunityCreatePage.module.css'

export function CommunityCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [name,     setName]     = useState('')
  const [desc,     setDesc]     = useState('')
  const [emoji,    setEmoji]    = useState('')
  const [category, setCategory] = useState('')
  const [mod,      setMod]      = useState(user?.username ?? '')
  const [done,     setDone]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const redirectTimer = useRef<number | null>(null)

  const CATEGORIES = useMemo(() => [
    { id: 'ansiedad',    label: t('communities.categories.ansiedad') },
    { id: 'depresion',   label: t('communities.categories.depresion') },
    { id: 'autoestima',  label: t('communities.categories.autoestima') },
    { id: 'relaciones',  label: t('communities.categories.relaciones') },
    { id: 'duelo',       label: t('communities.categories.duelo') },
    { id: 'mindfulness', label: t('communities.categories.mindfulness') },
  ], [t])

  useEffect(() => () => {
    if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current)
  }, [])

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.centered}>
          <p className={styles.centeredTitle}>{t('communities.createDone')}</p>
          <p className={styles.centeredText}>{t('communities.createRedir')}</p>
        </div>
      </div>
    )
  }

  const canSubmit = name.trim() && desc.trim() && emoji.trim() && category && mod.trim()

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setError(null)
    setLoading(true)
    try {
      const community = await createCommunity({
        name,
        desc,
        emoji,
        category: category.toUpperCase(),
        mod,
        modUserId: user?.id ?? null,
      })
      setDone(true)
      if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current)
      redirectTimer.current = window.setTimeout(() => {
        redirectTimer.current = null
        navigate(`/comunidades/${community.id}`)
      }, 1800)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message || t('common.errSend'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.backRow}>
        <button className={styles.backLink} onClick={() => navigate('/comunidades')}>
          {t('communities.createBackBtn')}
        </button>
      </div>

      <div className={styles.inner}>

        <div className={styles.preview}>
          <p className={styles.previewLabel}>{t('communities.createPreview')}</p>
          <div className={styles.previewTop}>
            <span className={styles.previewEmoji}>{emoji || '?'}</span>
            <div>
              <p className={styles.previewTitle}>{name || t('communities.createPhName')}</p>
              <p className={styles.previewMod}>{t('communities.modPrefix')} {mod || t('communities.createModFallback')}</p>
            </div>
          </div>
          <SleepingCat
            color={catFor('/comunidades').color}
            seed={catFor('/comunidades').seed + 1}
            size={80}
            className={styles.createCat}
          />
        </div>

        <div className={styles.form}>

          <div className={styles.card}>
            <label className={styles.label} htmlFor="com-name">{t('communities.createLblName')}</label>
            <input
              id="com-name"
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('communities.createPhNameInput')}
              maxLength={60}
            />
          </div>

          <div className={styles.card}>
            <label className={styles.label} htmlFor="com-desc">{t('communities.createLblDesc')}</label>
            <textarea
              id="com-desc"
              className={styles.textarea}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={t('communities.createPhDesc')}
              rows={4}
              maxLength={300}
            />
            <span className={styles.charCount}>{desc.length} / 300</span>
          </div>

          <div className={styles.card}>
            <label className={styles.label} htmlFor="com-emoji">{t('communities.createLblEmoji')}</label>
            <p className={styles.hint}>{t('communities.createEmojiHint')}</p>
            <input
              id="com-emoji"
              className={`${styles.input} ${styles.emojiInput}`}
              value={emoji}
              onChange={e => setEmoji(e.target.value.slice(0, 2))}
              placeholder="e.g. ☀"
              maxLength={2}
            />
          </div>

          <div className={styles.card}>
            <p className={styles.label}>{t('communities.createLblCategory')}</p>
            <div className={styles.categoryGrid}>
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.categoryBtn} ${category === c.id ? styles.categoryBtnActive : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <label className={styles.label} htmlFor="com-mod">{t('communities.createLblMod')}</label>
            <input
              id="com-mod"
              className={styles.input}
              value={mod}
              onChange={e => setMod(e.target.value)}
              placeholder={t('communities.createPhMod')}
              maxLength={60}
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            className={`${styles.submitBtn} hover-lift`}
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? t('modRegister.loading') : t('communities.createSubmit')}
          </button>

        </div>
      </div>
    </div>
  )
}
