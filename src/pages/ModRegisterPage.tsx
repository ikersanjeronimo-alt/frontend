import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { registerMod, verifyModRegistration } from '../services/auth'
import type { ModRole, Profession, Specialization, RegisterModEnrollment } from '../types/api'
import { IconEye, IconEyeOff } from '../components/ui/Icons'
import { Select } from '../components/ui/Select'
import { TotpPanel } from '../components/auth/TotpPanel'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './LoginPage.module.css'

type Mode = 'moderador' | 'admin'
type Phase = 'form' | 'enroll' | 'success'

const PROFESSION_OPTIONS: readonly Profession[] = ['Psicólogo', 'Terapeuta', 'Psiquiatra']

const SPECIALIZATION_OPTIONS: readonly Specialization[] = [
  'Ansiedad', 'Depresión', 'Estrés', 'Duelo', 'Autoestima', 'Relaciones',
]

export function ModRegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [mode, setMode]         = useState<Mode>('moderador')
  const [phase, setPhase]       = useState<Phase>('form')
  const [enrollment, setEnrollment] = useState<RegisterModEnrollment | null>(null)

  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [company, setCompany]   = useState('')
  const [profession, setProfession]           = useState<Profession | ''>('')
  const [specialization, setSpecialization] = useState<Specialization | ''>('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  const switchMode = (m: Mode) => { setMode(m); setError('') }

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setUsername('')
    setEmail('')
    setCompany('')
    setProfession('')
    setSpecialization('')
    setPassword('')
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const baseFilled = firstName.trim() && lastName.trim() && username.trim() && email.trim() && password.trim()
    const companyRequired = mode === 'moderador'
    if (!baseFilled || (companyRequired && !company.trim())) {
      setError(t('modRegister.errFields'))
      return
    }
    if (username.trim().length < 3) {
      setError(t('modRegister.errUsername'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('modRegister.errEmail'))
      return
    }
    if (password.trim().length < 8) {
      setError(t('modRegister.errPassword'))
      return
    }

    const role: ModRole = mode === 'moderador' ? 'PROFESSIONAL' : 'ADMINISTRATOR'

    setLoading(true)
    try {
      const result = await registerMod({
        name: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        ...(mode === 'moderador' ? {
          company: company.trim(),
          ...(profession       ? { profession: profession }            : {}),
          ...(specialization ? { specialization: specialization } : {}),
        } : {}),
      })
      setEnrollment(result)
      setPhase('enroll')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errUnexpected'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (code: string) => {
    if (!enrollment) return
    await verifyModRegistration({ email: enrollment.email, code })
    setPhase('success')
    resetForm()
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.blob1} blob blob-float`} />
      <div className={`${styles.blob2} blob blob-float-slow`} />

      <div className={`${styles.card} animate-fadeInUp`}>

        <SleepingCat
          color={catFor('/modregister').color}
          seed={catFor('/modregister').seed}
          size={90}
          className={styles.authCat}
        />

        <NavLink to="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>S</div>
          <span className={styles.logoText}>ShareYourStory</span>
        </NavLink>

        {phase === 'form' && (
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${mode === 'moderador' ? styles.tabActive : ''}`}
              onClick={() => switchMode('moderador')}
            >
              {t('modRegister.tabMod')}
            </button>
            <button
              type="button"
              className={`${styles.tab} ${mode === 'admin' ? styles.tabActive : ''}`}
              onClick={() => switchMode('admin')}
            >
              {t('modRegister.tabAdmin')}
            </button>
          </div>
        )}

        {phase === 'enroll' && enrollment && (
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${styles.tabActive}`} disabled>
              {t('totp.enrollTitle')}
            </button>
          </div>
        )}

        {phase === 'success' && (
          <div className={`${styles.form} ${styles.successBlock}`}>
            <p className={styles.successTitle}>
              {mode === 'moderador' ? t('modRegister.successMod') : t('modRegister.successAdmin')}
            </p>
            <p className={styles.successBody}>
              {t('modRegister.successBody')}
            </p>
            <button
              className={`${styles.submitBtn} hover-lift`}
              onClick={() => { setEnrollment(null); setPhase('form') }}
            >
              {t('modRegister.another')}
            </button>
            <button
              className={`${styles.forgotBtn} ${styles.backBtnBlock}`}
              onClick={() => navigate('/moderacion')}
            >
              {t('modRegister.backPanel')}
            </button>
          </div>
        )}

        {phase === 'enroll' && enrollment && (
          <TotpPanel
            enroll={{ secret: enrollment.secret, otpauthUri: enrollment.otpauthUri }}
            onVerify={handleVerify}
            onCancel={() => { setEnrollment(null); setPhase('form') }}
            submitLabel={t('totp.confirmEnroll')}
            cancelLabel={t('totp.cancelEnroll')}
          />
        )}

        {phase === 'form' && (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            <div className={styles.field}>
              <label className={styles.label}>{t('modRegister.nameLbl')}</label>
              <input
                className={styles.input}
                type="text"
                placeholder={t('modRegister.namePh')}
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                maxLength={64}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('modRegister.lastNameLbl')}</label>
              <input
                className={styles.input}
                type="text"
                placeholder={t('modRegister.lastNamePh')}
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                maxLength={64}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('modRegister.usernameLbl')}</label>
              <input
                className={styles.input}
                type="text"
                placeholder={mode === 'moderador' ? t('modRegister.usernameModPh') : t('modRegister.usernameAdmPh')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={32}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('modRegister.emailLbl')}</label>
              <input
                className={styles.input}
                type="email"
                placeholder={mode === 'moderador' ? t('modRegister.emailModPh') : t('modRegister.emailAdmPh')}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {mode === 'moderador' && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>{t('modRegister.companyLbl')}</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder={t('modRegister.companyPh')}
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    maxLength={128}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>{t('modRegister.professionLbl')}</label>
                  <Select<Profession>
                    value={profession}
                    onChange={setProfession}
                    options={PROFESSION_OPTIONS}
                    ariaLabel={t('modRegister.professionLbl')}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>{t('modRegister.specLbl')}</label>
                  <Select<Specialization>
                    value={specialization}
                    onChange={setSpecialization}
                    options={SPECIALIZATION_OPTIONS}
                    ariaLabel={t('modRegister.specLbl')}
                  />
                </div>
              </>
            )}

            <div className={styles.field}>
              <label className={styles.label}>{t('modRegister.passLbl')}</label>
              <div className={styles.passWrapper}>
                <input
                  className={styles.input}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.showPassBtn}
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  {showPass ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
              <p className={styles.fieldHint}>{t('modRegister.passHint')}</p>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={`${styles.submitBtn} hover-lift`}
              disabled={loading}
            >
              {loading
                ? t('modRegister.loading')
                : mode === 'moderador' ? t('modRegister.submitMod') : t('modRegister.submitAdmin')}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}
