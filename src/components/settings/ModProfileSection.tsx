import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { updateModProfile } from '../../services/profile'
import { useSavedFlash } from '../../hooks/useSavedFlash'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { FormField } from '../ui/FormField'
import { SaveButton } from '../ui/SaveButton'
import { Feedback } from '../ui/Feedback'
import type { ApiModProfile } from '../../types/api'
import styles from './ModProfileSection.module.css'

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

  // Seed derivado del user actual: cada moderador ve SU username, no el de
  // un mock global. El resto de campos los rellena al ser la primera vez,
  // y a partir de ahí se persiste vía updateModProfile (cuando el back exista).
  // TODO: cuando exista GET /api/users/me/mod-profile, sustituir todo esto por useApi.
  const [profile, setProfile] = useState<ApiModProfile>(() => ({
    name: '',
    lastName: '',
    username: user?.username ?? '',
    email: '',
  }))
  const [error, setError] = useState('')
  const [saved, flash]    = useSavedFlash()

  const handleSave = async () => {
    setError('')
    if (!profile.name.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setError(t('settings.modRequired'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(profile.email.trim())) {
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
    <Section title={t('settings.section_perfil')}>
      <Card>
        {FIELDS.map(f => (
          <FormField key={f.key} label={f.label} htmlFor={`mod-${f.key}`}>
            <Input
              id={`mod-${f.key}`}
              value={profile[f.key] ?? ''}
              onChange={e => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              type={f.key === 'email' ? 'email' : 'text'}
              maxLength={f.key === 'username' ? 32 : 100}
            />
          </FormField>
        ))}

        {error && <Feedback variant="error">{error}</Feedback>}

        <div className={styles.actions}>
          <SaveButton onClick={handleSave} saved={saved} label={t('settings.modSave')} />
        </div>
      </Card>
    </Section>
  )
}
