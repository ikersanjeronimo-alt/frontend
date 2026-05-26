import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateSettings } from '../../services/profile'
import { silentMutation } from '../../lib/silentMutation'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import { ToggleRow } from '../ui/ToggleRow'
import { Feedback } from '../ui/Feedback'

export function PrivacySection() {
  const { t } = useTranslation()
  const [anonProfile, setAnonProfile]     = useState(true)
  const [onlineStatus, setOnlineStatus]   = useState(true)
  const [activityHistory, setHistory]     = useState(true)
  const [error, setError] = useState<string | null>(null)

  const items = [
    { label: t('settings.privAnon'),    sub: t('settings.privAnonSub'),    val: anonProfile,     set: setAnonProfile,  key: 'anonProfile' as const },
    { label: t('settings.privOnline'),  sub: t('settings.privOnlineSub'),  val: onlineStatus,    set: setOnlineStatus, key: 'onlineStatus' as const },
    { label: t('settings.privHistory'), sub: t('settings.privHistorySub'), val: activityHistory, set: setHistory,      key: 'activityHistory' as const },
  ]

  const handleChange = async <K extends 'anonProfile' | 'onlineStatus' | 'activityHistory'>(
    item: typeof items[number],
    v: boolean,
  ) => {
    setError(null)
    item.set(v)
    const err = await silentMutation(updateSettings({ [item.key]: v } as Record<K, boolean>))
    if (err) {
      item.set(!v)         // rollback visual
      setError(err)
    }
  }

  return (
    <Section title={t('settings.section_privacidad')}>
      <Card>
        {items.map(item => (
          <ToggleRow
            key={item.label}
            label={item.label}
            sub={item.sub}
            on={item.val}
            onChange={v => { void handleChange(item, v) }}
          />
        ))}
        {error && <Feedback variant="error">{error}</Feedback>}
      </Card>
    </Section>
  )
}
