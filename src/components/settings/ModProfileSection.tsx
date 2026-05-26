import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { updateModProfile } from '../../services/profile'
import { useSavedFlash } from '../../hooks/useSavedFlash'
import { MOCK_MOD_PROFILE } from '../../mocks/data'
import type { ApiModProfile } from '../../types/api'
import styles from '../../pages/SettingsPage.module.css'

export function ModProfileSection() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const isAdmin = user?.role === 'ADMIN'

  const BASE_FIELDS: { key: keyof ApiModProfile; label: string; placeholder: string }[] = [
    { key: 'name',     label: t('settings.modName'),     placeholder: t('settings.modNamePh') },
    { key: 'lastName', label: t('settings.modLastName'), placeholder: t('settings.modLastNamePh') },
    { key: 'username', label: t('settings.modUsername'), placeholder: t('settings.modUsernamePh') },
    { key: 'email',    label: t('settings.modEmail'),    placeholder: t('settings.modEmailPh') },
  ]
  const COMPANY_FIELD = { key: 'company' as const, label: t('settings.modCompany'), placeholder: t('settings.modCompanyPh') }
  const FIELDS = isAdmin ? BASE_FIELDS : [...BASE_FIELDS, COMPANY_FIELD]

  // TODO: cuando exista GET /api/users/me/mod-profile, sustituir el seed por useApi.
  const [profile, setProfile] = useState<ApiModProfile>(MOCK_MOD_PROFILE)
  const [error, setError]     = useState('')
  const [saved, flash]        = useSavedFlash()

  const handleSave = async () => {
    setError('')
    if (!profile.name.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setError(t('settings.modRequired'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      setError(t('settings.modBadEmail'))
      return
    }
    try {
      await updateModProfile(profile)
      flash()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settings.modGenericErr'))
    }
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.section_perfil')}</h2>

      <div className={styles.card}>
        {FIELDS.map(f => (
          <div key={f.key} className={styles.field ?? styles.card}>
            <label className={styles.cardTitle} htmlFor={`mod-${f.key}`}>{f.label}</label>
            <input
              id={`mod-${f.key}`}
              className={styles.input}
              value={profile[f.key] ?? ''}
              onChange={e => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              type={f.key === 'email' ? 'email' : 'text'}
              maxLength={f.key === 'username' ? 32 : 100}
            />
          </div>
        ))}

        {error && <p className={styles.fieldError} role="alert">{error}</p>}

        <div className={styles.inputRow + ' ' + styles.inputRowSpaced}>
          <button className={styles.saveBtn} onClick={handleSave}>
            {saved ? t('common.saved') : t('settings.modSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
