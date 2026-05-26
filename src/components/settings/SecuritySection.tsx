import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { changePassword } from '../../services/profile'
import styles from '../../pages/SettingsPage.module.css'

interface SecuritySectionProps {
  isMod: boolean
}

export function SecuritySection({ isMod }: SecuritySectionProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass]         = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [msg, setMsg]                 = useState('')
  const [error, setError]             = useState('')

  const handleChangePassword = async () => {
    setError('')
    setMsg('')
    if (!currentPass || !newPass || !confirmPass) {
      setError(t('settings.secErrFields'))
      return
    }
    if (newPass.length < 8) {
      setError(t('settings.secErrLen'))
      return
    }
    if (newPass !== confirmPass) {
      setError(t('settings.secErrMatch'))
      return
    }
    try {
      await changePassword(currentPass, newPass)
      setMsg(t('settings.secSuccess'))
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settings.secErrGeneric'))
    }
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.section_seguridad')}</h2>

      {isMod ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t('settings.secChangePass')}</h3>

          <div className={styles.passFields}>
            <input
              aria-label={t('settings.secCurrentPh')}
              className={styles.input}
              type="password"
              placeholder={t('settings.secCurrentPh')}
              value={currentPass}
              onChange={e => setCurrentPass(e.target.value)}
            />
            <input
              aria-label={t('settings.secNewPh')}
              className={styles.input}
              type="password"
              placeholder={t('settings.secNewPh')}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
            />
            <input
              aria-label={t('settings.secConfirmPh')}
              className={styles.input}
              type="password"
              placeholder={t('settings.secConfirmPh')}
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
            />
          </div>

          {error && <p className={styles.fieldError} role="alert">{error}</p>}
          {msg   && <p className={styles.fieldSuccess}>{msg}</p>}

          <div className={styles.inputRow + ' ' + styles.inputRowSpacedSm}>
            <button className={styles.saveBtn} onClick={handleChangePassword}>
              {t('settings.secSubmit')}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <p className={styles.cardBody}>{t('settings.secUserBody')}</p>
          <button className={styles.saveBtn} onClick={() => navigate('/login')}>
            {t('settings.secGoLogin')}
          </button>
        </div>
      )}
    </div>
  )
}
