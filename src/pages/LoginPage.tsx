import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { IconEye, IconEyeOff } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './LoginPage.module.css'

type Mode = 'login' | 'register'

export function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [mode, setMode]         = useState<Mode>('login')
  const [username, setUsername]         = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Por favor rellena todos los campos.')
      return
    }
    if (username.trim().length < 3) {
      setError('El username debe tener al menos 3 caracteres.')
      return
    }
    if (mode === 'register' && password.trim().length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username.trim(), password.trim())
      } else {
        await register(username.trim(), password.trim())
      }
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof Error && 'status' in err && (err as { status?: number }).status === 403) {
        setError('Este acceso es solo para usuarios normales. Moderadores y administradores deben entrar desde /loginmod.')
      } else {
        setError(err instanceof Error ? err.message : 'Error inesperado.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: Mode) => { setMode(m); setError('') }

  return (
    <div className={styles.page}>
      <div className={`${styles.blob1} blob blob-float`} />
      <div className={`${styles.blob2} blob blob-float-slow`} />

      <div className={`${styles.card} animate-fadeInUp`}>

        <SleepingCat
          color={catFor('/login').color}
          seed={catFor('/login').seed}
          size={90}
          className={styles.authCat}
        />

        <NavLink to="/" className={styles.logoLink}>
          <img src="/logo.png" alt="" aria-hidden className={styles.logoIcon} />
          <span className={styles.logoText}>ShareYourStory</span>
        </NavLink>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchMode('login')}
          >
            {t('login.tabLogin')}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => switchMode('register')}
          >
            {t('login.tabRegister')}
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-username">{t('login.labelUsername')}</label>
            <input
              id="login-username"
              className={styles.input}
              type="text"
              placeholder="MiUsernameAnónimo"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={32}
              autoFocus
            />
            {mode === 'register' && (
              <p className={styles.fieldHint}>{t('login.hintUsername')}</p>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="login-password">{t('login.labelPassword')}</label>
              {mode === 'login' && (
                <button type="button" className={styles.forgotBtn}>{t('login.forgot')}</button>
              )}
            </div>
            <div className={styles.passWrapper}>
              <input
                id="login-password"
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
            {mode === 'register' && (
              <p className={styles.fieldHint}>{t('login.hintPassword')}</p>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={`${styles.submitBtn} hover-lift`}
            disabled={loading}
          >
            {loading ? t('login.loading') : mode === 'login' ? t('login.submitLogin') : t('login.submitRegister')}
          </button>

        </form>

        <div className={styles.divider}><span>o</span></div>

        <button className={styles.anonBtn} onClick={() => navigate('/dashboard')}>
          {t('login.anon')}
        </button>

        <p className={styles.privacyNote}>
          {t('login.privacy')}
        </p>

      </div>
    </div>
  )
}
