import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../hooks/useRole'

import { AccountSection }       from '../components/settings/AccountSection'
import { ModProfileSection }    from '../components/settings/ModProfileSection'
import { PrivacySection }       from '../components/settings/PrivacySection'
import { NotificationsSection } from '../components/settings/NotificationsSection'
import { AppearanceSection }    from '../components/settings/AppearanceSection'
import { LanguageSection }      from '../components/settings/LanguageSection'
import { SecuritySection }      from '../components/settings/SecuritySection'
import { HelpSection }          from '../components/settings/HelpSection'

import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'

import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const { logout } = useAuth()
  const { isMod, isAdmin } = useRole()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const SECTIONS = [
    { id: 'cuenta',          label: t('settings.section_cuenta') },
    { id: 'privacidad',      label: t('settings.section_privacidad') },
    { id: 'notificaciones',  label: t('settings.section_notificaciones') },
    { id: 'apariencia',      label: t('settings.section_apariencia') },
    { id: 'idioma',          label: t('settings.section_idioma') },
  ]
  const MOD_SECTIONS = [
    { id: 'perfil', label: t('settings.section_perfil') },
  ]
  const DANGER_SECTIONS = [
    { id: 'seguridad',  label: t('settings.section_seguridad') },
    { id: 'ayuda',      label: t('settings.section_ayuda') },
    { id: 'salir',      label: t('settings.section_salir') },
  ]

  const [section, setSection]       = useState('cuenta')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSectionClick = (id: string) => {
    if (id === 'salir') { logout(); navigate('/'); return }
    if (id === 'crear_moderador') { navigate('/admin/moderadores/nuevo'); return }
    setSection(id)
    setMobileOpen(false)
  }

  const ADMIN_SECTIONS = isAdmin ? [{ id: 'crear_moderador', label: t('admin.createModeratorTitle') }] : []
  const visibleSections = isMod ? [...SECTIONS, ...MOD_SECTIONS, ...ADMIN_SECTIONS] : [...SECTIONS, ...ADMIN_SECTIONS]
  const allSections     = [...visibleSections, ...DANGER_SECTIONS]
  const currentLabel    = allSections.find(s => s.id === section)?.label ?? ''

  return (
    <div className={styles.page}>

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarGroup}>
          {visibleSections.map(s => (
            <button
              key={s.id}
              className={`${styles.sidebarItem} ${section === s.id ? styles.sidebarItemActive : ''}`}
              onClick={() => handleSectionClick(s.id)}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.sidebarDividerWrap}>
          <SleepingCat
            color={catFor('/configuracion').color}
            seed={catFor('/configuracion').seed}
            size={88}
            className={styles.settingsCat}
          />
          <div className={styles.sidebarDivider} />
        </div>
        <div className={styles.sidebarGroup}>
          {DANGER_SECTIONS.map(s => (
            <button
              key={s.id}
              className={`${styles.sidebarItem} ${s.id === 'salir' ? styles.sidebarItemDanger : ''} ${section === s.id ? styles.sidebarItemActive : ''}`}
              onClick={() => handleSectionClick(s.id)}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className={styles.content}>

        <div className={styles.mobileHeader}>
          <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(o => !o)}>
            ☰
          </button>
          <span className={styles.mobileSection}>{currentLabel}</span>
        </div>

        {section === 'cuenta'         && <AccountSection />}
        {section === 'perfil'         && isMod && <ModProfileSection />}
        {section === 'privacidad'     && <PrivacySection />}
        {section === 'notificaciones' && <NotificationsSection />}
        {section === 'apariencia'     && <AppearanceSection />}
        {section === 'idioma'         && <LanguageSection />}
        {section === 'seguridad'      && <SecuritySection isMod={isMod} />}
        {section === 'ayuda'          && <HelpSection />}

      </main>
    </div>
  )
}
