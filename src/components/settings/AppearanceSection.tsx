import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getInitialTheme, setTheme } from '../../lib/theme'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import { ToggleRow } from '../ui/ToggleRow'

export function AppearanceSection() {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(() => getInitialTheme() === 'dark')

  const handleToggle = (on: boolean) => {
    setDarkMode(on)
    setTheme(on ? 'dark' : 'light')
  }

  return (
    <Section title={t('settings.section_apariencia')}>
      <Card>
        <ToggleRow
          label={t('settings.darkMode')}
          sub={t('settings.darkModeSub')}
          on={darkMode}
          onChange={handleToggle}
        />
      </Card>
    </Section>
  )
}
