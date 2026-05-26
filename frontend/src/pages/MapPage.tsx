import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl       from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png'
import { useTranslation } from 'react-i18next'
import { useMapStories } from '../hooks/useMapStories'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { createStory } from '../services/stories'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './MapPage.module.css'

// Leaflet rompe los paths de iconos por defecto al pasar por bundlers como Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// El emoji puede venir del back; lo escapamos para que un texto malicioso
// no rompa el HTML inline que Leaflet inyecta en divIcon.
const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => HTML_ESCAPE[c])
}

function makeIcon(emoji: string, bg: string, size = 20) {
  const safeEmoji = escapeHtml(emoji).slice(0, 8)
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 2px 10px rgba(0,0,0,0.2);
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.44}px;
      cursor:pointer;
      transition:transform .15s;
    ">${safeEmoji}</div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

const storyIcon   = makeIcon('', '#8A7DC4')
const pendingIcon = makeIcon('', '#e67e4d', 18)

interface Story {
  id:    string
  lat:   number
  lng:   number
  text:  string
  time:  string
  emoji: string
  own?:  boolean
}


function MapClickHandler({ active, onMapClick }: { active: boolean; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (active) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapPage() {
  const { t } = useTranslation()
  const { data: remoteStories, setData: setRemoteStories } = useMapStories()
  const { words: bannedWords } = useBannedWords()

  // Combinar historias del back con historias locales pendientes de guardar
  const [localStories, setLocalStories] = useState<Story[]>([])
  const stories = [...remoteStories, ...localStories]

  const [addingMode, setAddingMode] = useState(false)
  const [pending, setPending]       = useState<{ lat: number; lng: number } | null>(null)
  const [draft, setDraft]           = useState('')
  const [submitted, setSubmitted]   = useState(false)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPending({ lat, lng })
    setAddingMode(false)
    setDraft('')
    setSubmitted(false)
  }, [])

  const handleSubmit = () => {
    if (!pending || !draft.trim()) return
    const optimistic: Story = {
      id:    `local_${Date.now()}`,
      lat:   pending.lat,
      lng:   pending.lng,
      text:  draft.trim(),
      time:  'ahora mismo',
      emoji: '',
      own:   true,
    }
    setLocalStories(prev => [...prev, optimistic])
    createStory(pending.lat, pending.lng, draft.trim(), '')
      .then(saved => {
        setLocalStories(prev => prev.filter(s => s.id !== optimistic.id))
        setRemoteStories(prev => [...prev, saved])
      })
      .catch(() => { /* mantener local si falla */ })
    setSubmitted(true)
    setTimeout(() => {
      setPending(null)
      setSubmitted(false)
    }, 2000)
  }

  const cancelAdd = () => {
    setAddingMode(false)
    setPending(null)
    setDraft('')
  }

  return (
    <div className={styles.page}>

      <MapContainer
        center={[25, 10]}
        zoom={2}
        minZoom={2}
        maxZoom={16}
        className={`${styles.map} ${addingMode ? styles.mapAdding : ''}`}
        worldCopyJump
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapClickHandler active={addingMode} onMapClick={handleMapClick} />

        {stories.map(s => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={storyIcon}>
            <Popup className={styles.popup} maxWidth={280}>
              <div className={styles.popupInner}>
                {s.emoji && <span className={styles.popupEmoji}>{s.emoji}</span>}
                <p className={styles.popupText}>{maskBannedWords(s.text, bannedWords)}</p>
                <span className={styles.popupTime}>{s.time}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {pending && <Marker position={[pending.lat, pending.lng]} icon={pendingIcon} />}
      </MapContainer>

      <div className={styles.statsBar}>
        <span className={styles.statsBadge}>
          {stories.length} {t('map.stories')}
        </span>
      </div>

      <SleepingCat
        color={catFor('/mapa').color}
        seed={catFor('/mapa').seed}
        size={86}
        className={styles.mapCat}
      />

      {addingMode && (
        <div className={styles.instruction}>
          <span>{t('map.instruction')}</span>
          <button className={styles.cancelBtn} onClick={cancelAdd}>{t('map.cancel')}</button>
        </div>
      )}

      {pending && !submitted && (
        <div className={styles.writePanel}>
          <div className={styles.writePanelHeader}>
            <h3 className={styles.writePanelTitle}>{t('map.addTitle')}</h3>
            <button className={styles.writePanelClose} onClick={cancelAdd}>✕</button>
          </div>
          <textarea
            aria-label={t('map.textareaAria')}
            className={styles.writeTextarea}
            placeholder={t('map.textareaPh')}
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, 300))}
            maxLength={300}
            autoFocus
          />
          <div className={styles.writeFooter}>
            <span className={styles.writeCount}>{draft.length}/300</span>
            <button
              className={styles.writeSubmit}
              onClick={handleSubmit}
              disabled={draft.trim().length < 10}
            >
              {t('map.anchor')}
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className={styles.successToast}>{t('map.success')}</div>
      )}

      {!addingMode && !pending && (
        <button
          className={`${styles.fab} hover-lift`}
          onClick={() => { setAddingMode(true); setPending(null) }}
        >
          {t('map.addBtn')}
        </button>
      )}

    </div>
  )
}
