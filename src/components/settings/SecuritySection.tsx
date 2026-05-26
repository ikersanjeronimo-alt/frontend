import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { changePassword } from '../../services/profile'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { SaveButton } from '../ui/SaveButton'
import { Feedback } from '../ui/Feedback'
import styles from './SecuritySection.module.css'

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

  if (!isMod) {
    return (
      <Section title={t('settings.section_seguridad')}>
        <Card body={t('settings.secUserBody')}>
          <SaveButton onClick={() => navigate('/login')} label={t('settings.secGoLogin')} />
        </Card>
      </Section>
    )
  }

  return (
    <Section title={t('settings.section_seguridad')}>
      <Card title={t('settings.secChangePass')}>
        <div className={styles.fields}>
          <Input
            aria-label={t('settings.secCurrentPh')}
            type="password"
            placeholder={t('settings.secCurrentPh')}
            value={currentPass}
            onChange={e => setCurrentPass(e.target.value)}
          />
          <Input
            aria-label={t('settings.secNewPh')}
            type="password"
            placeholder={t('settings.secNewPh')}
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
          />
          <Input
            aria-label={t('settings.secConfirmPh')}
            type="password"
            placeholder={t('settings.secConfirmPh')}
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
          />
        </div>

        {error && <Feedback variant="error">{error}</Feedback>}
        {msg   && <Feedback variant="success">{msg}</Feedback>}

        <div className={styles.actions}>
          <SaveButton onClick={handleChangePassword} label={t('settings.secSubmit')} />
        </div>
      </Card>
    </Section>
  )
}
