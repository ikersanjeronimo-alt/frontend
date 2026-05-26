import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateSettings } from '../../services/profile'
import { silentMutation } from '../../lib/silentMutation'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import { ToggleRow } from '../ui/ToggleRow'
import { Feedback } from '../ui/Feedback'

export function NotificationsSection() {
  const { t } = useTranslation()
  const [notifMessages, setNotifMessages] = useState(true)
  const [notifEvents, setNotifEvents]     = useState(true)
  const [notifEmail, setNotifEmail]       = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = [
    { label: t('settings.notifMessages'), sub: t('settings.notifMessagesSub'), val: notifMessages, set: setNotifMessages, key: 'notifMessages' as const },
    { label: t('settings.notifEvents'),   sub: t('settings.notifEventsSub'),   val: notifEvents,   set: setNotifEvents,   key: 'notifEvents' as const },
    { label: t('settings.notifEmail'),    sub: t('settings.notifEmailSub'),    val: notifEmail,    set: setNotifEmail,    key: 'notifEmail' as const },
  ]

  const handleChange = async <K extends 'notifMessages' | 'notifEvents' | 'notifEmail'>(
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
    <Section title={t('settings.section_notificaciones')}>
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
