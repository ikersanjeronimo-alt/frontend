import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loginMod, verifyModLogin } from '../services/auth'
import { type ApiError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { IconEye, IconEyeOff } from '../components/ui/Icons'
import { TotpPanel } from '../components/auth/TotpPanel'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './LoginPage.module.css'

type Phase = 'credentials' | 'totp'

export function ModLoginPage() {
  const { loginAsModWithToken } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [phase, setPhase]   = useState<Phase>('credentials')
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]   = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError(t('modLogin.errFields'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError(t('modLogin.errEmail'))
      return
    }

    setLoading(true)
    try {
      const { challengeId: id } = await loginMod(email.trim(), password.trim())
      setChallengeId(id)
      setPhase('totp')
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 401) {
        setError(t('modLogin.errCredentials') || 'Usuario o contraseña inválidos.')
      } else if (apiErr.status === 403) {
        setError('Debes tener el 2FA activado y ser moderador o administrador para entrar por aqu�.')
      } else {
        setError(apiErr.message || t('login.errUnexpected'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (code: string) => {
    try {
      const authResponse = await verifyModLogin(challengeId, code)
      loginAsModWithToken(authResponse.token, authResponse.user)
      navigate('/moderacion')
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 401) {
        // Codigo TOTP invalido o challenge expirado.
        throw new Error(t('totp.errCode') || 'El código de verificación es inválido.', { cause: err })
      } else if (apiErr.status === 400) {
        throw new Error(t('totp.errCode') || 'El código de verificación es inválido.', { cause: err })
      }
      throw err
    }
  }

  const handleCancelTotp = () => {
    setPhase('credentials')
    setPassword('')
    setChallengeId('')
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.blob1} blob blob-float`} />
      <div className={`${styles.blob2} blob blob-float-slow`} />

      <div className={`${styles.card} animate-fadeInUp`}>

        <SleepingCat
          color={catFor('/loginmod').color}
          seed={catFor('/loginmod').seed}
          size={90}
          className={styles.authCat}
        />

        <NavLink to="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>S</div>
          <span className={styles.logoText}>ShareYourStory</span>
        </NavLink>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.tabActive}`} disabled>
            {phase === 'credentials' ? t('modLogin.title') : t('totp.verifyTitle')}
          </button>
        </div>

        {phase === 'totp' && (
          <TotpPanel
            onVerify={handleVerify}
            onCancel={handleCancelTotp}
            submitLabel={t('modLogin.submit')}
          />
        )}

        {phase === 'credentials' && (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            <div className={styles.field}>
              <label className={styles.label}>{t('modLogin.emailLbl')}</label>
              <input
                className={styles.input}
                type="email"
                placeholder={t('modLogin.emailPh')}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t('modLogin.passLbl')}</label>
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
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={`${styles.submitBtn} hover-lift`}
              disabled={loading}
            >
              {loading ? t('modLogin.loading') : t('modLogin.submit')}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}

