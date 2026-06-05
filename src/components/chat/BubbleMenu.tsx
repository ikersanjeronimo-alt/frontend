import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { IconKebab } from '../ui/Icons'
import styles from './BubbleMenu.module.css'

export interface BubbleMenuItem {
  label: string
  onClick: () => void
  disabled?: boolean
}

interface BubbleMenuProps {
  /** Acciones a mostrar dentro del popover. Si está vacío, no se renderiza nada. */
  items: BubbleMenuItem[]
  /** aria-label del botón de tres puntos. */
  ariaLabel: string
  /** Hacia dónde se despliega el popover respecto al botón. Por defecto 'left'
   *  (alineado al borde derecho del botón, crece hacia la izquierda). */
  placement?: 'left' | 'right'
  /** Fuerza colores claros fijos (independientes del tema) para usar sobre
   *  superficies siempre blancas, como los popups del mapa (Leaflet). */
  light?: boolean
}

/**
 * Botón de tres puntos verticales que abre un popover con las acciones del
 * mensaje (reportar, borrar...). El popover se renderiza en un portal con
 * `position: fixed` calculada desde el botón para no quedar recortado por el
 * `overflow` del contenedor de mensajes. Se cierra al clicar fuera, con
 * Escape, al hacer scroll o al redimensionar.
 */
export function BubbleMenu({ items, ariaLabel, placement = 'left', light = false }: BubbleMenuProps) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  const place = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const menuW = 176
    const menuH = items.length * 40 + 8
    let top  = r.bottom + 4
    // 'right' → crece hacia la derecha desde el borde izquierdo del botón.
    let left = placement === 'right' ? r.left : r.right - menuW
    // Si no cabe debajo, abre hacia arriba.
    if (top + menuH > window.innerHeight - 8) top = r.top - menuH - 4
    // Mantener dentro del viewport en horizontal.
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - 8 - menuW
    if (left < 8) left = 8
    setCoords({ top, left })
  }, [items.length, placement])

  const toggle = () => {
    if (open) {
      close()
    } else {
      place()
      setOpen(true)
    }
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return
      if (menuRef.current?.contains(e.target as Node)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    // Captura: se ejecuta antes que cualquier stopPropagation en el camino de
    // burbujeo (p. ej. el de los popups de Leaflet), así el cierre al clicar
    // fuera funciona también dentro del mapa.
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close])

  if (items.length === 0) return null

  const handleItem = (item: BubbleMenuItem) => {
    if (item.disabled) return
    item.onClick()
    close()
  }

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className={`${styles.trigger} ${light ? styles.triggerLight : ''}`}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <IconKebab size={16} />
      </button>
      {open && coords && createPortal(
        <div
          ref={menuRef}
          className={`${styles.menu} ${light ? styles.menuLight : ''}`}
          role="menu"
          style={{ top: coords.top, left: coords.left }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className={styles.item}
              onClick={() => handleItem(item)}
              disabled={item.disabled}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
