import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './Select.module.css'

interface SelectProps<T extends string> {
  value: T | ''
  onChange: (value: T | '') => void
  options: readonly T[]
  placeholder?: string
  ariaLabel?: string
  id?: string
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Sin especificar',
  ariaLabel,
  id,
}: SelectProps<T>) {
  const [open, setOpen]           = useState(false)
  const [highlight, setHighlight] = useState<number>(-1)
  const rootRef                   = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setHighlight(-1)
  }, [])

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const select = (val: T | '') => {
    onChange(val)
    close()
  }

  const toggleOpen = () => {
    if (open) {
      close()
    } else {
      setOpen(true)
      const idx = value ? options.findIndex(o => o === value) + 1 : 0
      setHighlight(idx)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleOpen()
      }
      return
    }
    const total = options.length + 1
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => (h + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => (h - 1 + total) % total)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight <= 0) {
        select('')
      } else {
        const opt = options[highlight - 1]
        if (opt !== undefined) select(opt)
      }
    }
  }

  const display = value || placeholder

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${value ? '' : styles.triggerEmpty}`}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={styles.value}>{display}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="12" height="8" viewBox="0 0 12 8" fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className={styles.list} role="listbox">
          <li
            className={`${styles.item} ${styles.itemPlaceholder} ${highlight === 0 ? styles.itemHover : ''} ${!value ? styles.itemActive : ''}`}
            role="option"
            aria-selected={!value}
            onMouseEnter={() => setHighlight(0)}
            onClick={() => select('')}
          >
            {placeholder}
          </li>
          {options.map((opt, i) => {
            const idx      = i + 1
            const selected = value === opt
            return (
              <li
                key={opt}
                className={`${styles.item} ${highlight === idx ? styles.itemHover : ''} ${selected ? styles.itemActive : ''}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => select(opt)}
              >
                {opt}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
