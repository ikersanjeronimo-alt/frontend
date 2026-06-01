import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl       from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png'
import { useTranslation } from 'react-i18next'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { createStory } from '../services/stories'
import { silentMutation } from '../lib/silentMutation'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import { useStoriesStore } from '../store/storiesStore'  // ← NUEVO
import styles from './MapPage.module.css'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => HTML_ESCAPE[c] ?? c)
}

function makeIcon(emoji: string, bg: string, size = 20) {
  const safeEmoji = escapeHtml(emoji).slice(0, 8)
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};border-radius:50%;
      border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.2);
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.44}px;cursor:pointer;transition:transform .15s;
    ">${safeEmoji}</div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

const storyIcon   = makeIcon('', '#8A7DC4')
const pendingIcon = makeIcon('', '#e67e4d', 18)

function MapClickHandler({ active, onMapClick }: { active: boolean; onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { if (active) onMapClick(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

export function MapPage() {
  const { t } = useTranslation()
  const { words: bannedWords } = useBannedWords()

  // Lee directamente del store global — se actualiza solo cuando llega WS
  const stories = useStoriesStore(state => state.stories)

  const [addingMode, setAddingMode] = useState(false)
  const [pending, setPending]       = useState<{ lat: number; lng: number } | null>(null)
  const [draft, setDraft]           = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const resetTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
  }, [])

  const handleMapClick = (lat: number, lng: number) => {
    setPending({ lat, lng })
    setAddingMode(false)
    setDraft('')
    setSubmitted(false)
  }

  const handleSubmit = async () => {
    if (!pending || !draft.trim()) return
    setSubmitError(null)

    // El optimista lo añadimos al store directamente
    // Cuando llegue el broadcast del WS, addStory() detecta el id real
    // y no duplica. Si quieres optimista local, descomenta:
    //
    // useStoriesStore.getState().addStory({
    //   id: `local_${Date.now()}`, lat: pending.lat, lng: pending.lng,
    //   text: draft.trim(), time: 'ahora mismo', emoji: '', own: true,
    // })

    setSubmitted(true)
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => {
      setPending(null)
      setSubmitted(false)
      resetTimer.current = null
    }, 2000)

    try {
      // POST al backend → el backend guarda + hace broadcast WS → llega por el canal
      await createStory(pending.lat, pending.lng, draft.trim())
    } catch (e) {
      const err = await silentMutation(Promise.reject(e))
      if (err) {
        setSubmitError(err)
        setSubmitted(false)
      }
    }
  }

  const cancelAdd = () => { setAddingMode(false); setPending(null); setDraft('') }

  return (
    <div className={styles.page}>
      <MapContainer
        center={[25, 10]} zoom={2} minZoom={2} maxZoom={16}
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
                <p className={styles.popupText}>{maskBannedWords(s.text, bannedWords)}</p>
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

      <SleepingCat color={catFor('/mapa').color} seed={catFor('/mapa').seed} size={86} className={styles.mapCat} />

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
              onClick={() => { void handleSubmit() }}
              disabled={draft.trim().length < 10}
            >
              {t('map.anchor')}
            </button>
          </div>
        </div>
      )}

      {submitted  && <div className={styles.successToast}>{t('map.success')}</div>}
      {submitError && <div className={styles.errorToast} role="alert">{submitError}</div>}

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