import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { saveOnboarding } from '../services/profile'
import { silentMutation } from '../lib/silentMutation'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './OnboardingPage.module.css'

const TOPIC_IDS = ['ansiedad','depresion','autoestima','relaciones','duelo','mindfulness','soledad','estres','identidad','familia'] as const

export function OnboardingPage() {
  const { user, updateUsername } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const STEPS = [
    { title: t('onboarding.step0Title'), subtitle: t('onboarding.step0Sub') },
    { title: t('onboarding.step1Title'), subtitle: t('onboarding.step1Sub') },
    { title: t('onboarding.step2Title'), subtitle: t('onboarding.step2Sub') },
    { title: t('onboarding.step3Title'), subtitle: t('onboarding.step3Sub') },
  ]
  const TOPICS = TOPIC_IDS.map(id => ({ id, label: t(`onboarding.topics.${id}`) }))

  const [step, setStep]           = useState(0)
  const [usernameDraft, setUsernameDraft] = useState(user?.username ?? '')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [animating, setAnimating] = useState(false)

  const isLast = step === STEPS.length - 1

  const goNext = async () => {
    if (animating) return

    if (step === 1 && usernameDraft.trim() && usernameDraft.trim() !== user?.username) {
      // En onboarding no bloqueamos al usuario con un error si el server falla
      // — silentMutation marca demo en network errors y devuelve el mensaje
      // si fue 4xx/5xx. Aquí lo ignoramos a propósito: el username se puede
      // re-intentar desde Configuración después.
      await silentMutation(updateUsername(usernameDraft.trim()))
    }

    if (isLast) {
      if (selected.size > 0) {
        // Mismo razonamiento: si el endpoint falla, la sesión sigue funcionando
        // — los temas elegidos se pueden volver a editar desde Configuración.
        void silentMutation(saveOnboarding([...selected]))
      }
      navigate('/dashboard')
      return
    }

    setAnimating(true)
    setTimeout(() => {
      setStep(s => s + 1)
      setAnimating(false)
    }, 200)
  }

  const toggleTopic = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const current = STEPS[step]

  return (
    <div className={styles.page}>
      <div className={`${styles.blob1} blob blob-float`} />
      <div className={`${styles.blob2} blob blob-float-slow`} />

      <div className={`${styles.card} ${animating ? styles.cardOut : 'animate-fadeInUp'}`}>

        <SleepingCat
          color={catFor('/onboarding').color}
          seed={catFor('/onboarding').seed}
          size={96}
          className={styles.onboardingCat}
        />

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${i < step ? styles.dotDone : ''}`}
            />
          ))}
        </div>

        <div className={styles.stepContent}>
          <h1 className={styles.stepTitle}>{current?.title}</h1>
          <p className={styles.stepSubtitle}>{current?.subtitle}</p>

          {step === 0 && (
            <div className={styles.welcomeItems}>
              <div className={styles.welcomeItem}>
                <span>{t('onboarding.step0Item1')}</span>
              </div>
              <div className={styles.welcomeItem}>
                <span>{t('onboarding.step0Item2')}</span>
              </div>
              <div className={styles.welcomeItem}>
                <span>{t('onboarding.step0Item3')}</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={styles.usernameWrapper}>
              <input
                type="text"
                className={styles.usernameInput}
                aria-label={t('onboarding.step1Title')}
                value={usernameDraft}
                onChange={e => setUsernameDraft(e.target.value)}
                maxLength={32}
                placeholder={t('onboarding.step1Ph')}
                autoFocus
              />
              <p className={styles.usernameHint}>
                {t('onboarding.step1Hint')}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className={styles.topicsGrid}>
              {TOPICS.map(topic => (
                <button
                  key={topic.id}
                  className={`${styles.topicChip} ${selected.has(topic.id) ? styles.topicChipActive : ''}`}
                  onClick={() => toggleTopic(topic.id)}
                >
                  <span>{topic.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className={styles.privacyItems}>
              <div className={styles.privacyItem}>
                <div className={styles.privacyIcon}></div>
                <div>
                  <strong>{t('onboarding.step3a')}</strong>
                  <p>{t('onboarding.step3aDesc')}</p>
                </div>
              </div>
              <div className={styles.privacyItem}>
                <div className={styles.privacyIcon}></div>
                <div>
                  <strong>{t('onboarding.step3b')}</strong>
                  <p>{t('onboarding.step3bDesc')}</p>
                </div>
              </div>
              <div className={styles.privacyItem}>
                <div className={styles.privacyIcon}></div>
                <div>
                  <strong>{t('onboarding.step3c')}</strong>
                  <p>{t('onboarding.step3cDesc')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {step === 2 && selected.size === 0 && (
            <button className={styles.skipBtn} onClick={goNext}>
              {t('onboarding.skip')}
            </button>
          )}
          <button
            className={`${styles.nextBtn} hover-lift`}
            onClick={goNext}
            disabled={step === 1 && usernameDraft.trim().length === 0}
          >
            {isLast ? t('onboarding.finish') : t('onboarding.next')}
          </button>
        </div>

      </div>
    </div>
  )
}
