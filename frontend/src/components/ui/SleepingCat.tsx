import { useId, useRef, useState } from 'react'
import styles from './SleepingCat.module.css'

type Props = {
  /** Color del trazo del gato. Acepta cualquier color CSS válido. */
  color?: string
  /** Ancho en píxeles. La altura se calcula proporcional. */
  size?: number
  /** Clase extra para posicionar (position: absolute en el padre que prefieras). */
  className?: string
  /** Texto accesible. */
  title?: string
  /**
   * Seed entero (0..n). Sirve para desincronizar el wag de cola y el filtro
   * "wobbly" entre gatos distintos de la misma página o de la web.
   */
  seed?: number
  /** Si false, ignora el click (decorativo puro). Default true. */
  interactive?: boolean
}

// Proporción del viewBox. Se usa para calcular altura desde el width.
const VB_W = 220
const VB_H = 130

export function SleepingCat({
  color = 'var(--primary)',
  size = 120,
  className,
  title = 'Gatito durmiendo',
  seed = 0,
  interactive = true,
}: Props) {
  const reactId = useId()
  const filterId = `cat-rough-${reactId.replace(/[:]/g, '')}`
  const [awake, setAwake] = useState(false)
  const wakeTimer = useRef<number | null>(null)

  function handleClick() {
    if (!interactive) return
    if (wakeTimer.current) window.clearTimeout(wakeTimer.current)
    setAwake(true)
    wakeTimer.current = window.setTimeout(() => setAwake(false), 1800)
  }

  const height = Math.round((size * VB_H) / VB_W)

  // Desincroniza las animaciones entre gatos según el seed.
  const wagDelay = `${((seed * 1.7) % 5).toFixed(2)}s`
  const breatheDelay = `${((seed * 0.9) % 3).toFixed(2)}s`
  // Variabilidad del trazo "imperfecto" — distinta semilla = trazo distinto.
  const turbSeed = seed % 16

  const Tag = interactive ? 'button' : 'span'

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      aria-label={interactive ? title : undefined}
      aria-hidden={interactive ? undefined : true}
      className={`${styles.cat} ${className ?? ''}`}
      onClick={interactive ? handleClick : undefined}
      style={{ width: size, height, color }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width={size}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        className={`${styles.svg} ${awake ? styles.awake : ''}`}
      >
        <defs>
          {/* Wobble suave para que el trazo parezca pintado con cera por un niño. */}
          <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022"
              numOctaves={2}
              seed={turbSeed}
            />
            <feDisplacementMap in="SourceGraphic" scale="1.6" />
          </filter>
        </defs>

        <g
          filter={`url(#${filterId})`}
          stroke="currentColor"
          fill="none"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* CUERPO: blob alargado que respira */}
          <g
            className={styles.bodyGroup}
            style={{ animationDelay: breatheDelay }}
          >
            <path
              className={styles.bodyFill}
              fill="currentColor"
              fillOpacity={0.14}
              stroke="none"
              d="M 70,118
                 C 70,82 108,74 152,77
                 C 196,80 214,93 209,110
                 C 205,120 80,122 70,118 Z"
            />
            <path
              d="M 70,118
                 C 70,82 108,74 152,77
                 C 196,80 214,93 209,110
                 C 205,120 80,122 70,118 Z"
            />
          </g>

          {/* CABEZA: grupo que se ladea al despertar */}
          <g className={styles.headGroup}>
            {/* Relleno suave */}
            <path
              className={styles.bodyFill}
              fill="currentColor"
              fillOpacity={0.14}
              stroke="none"
              d="M 32,115
                 C 18,102 18,78 30,64
                 C 44,52 66,54 74,72
                 C 80,86 76,104 64,114
                 C 56,120 40,120 32,115 Z"
            />
            {/* Contorno */}
            <path
              d="M 32,115
                 C 18,102 18,78 30,64
                 C 44,52 66,54 74,72
                 C 80,86 76,104 64,114
                 C 56,120 40,120 32,115 Z"
            />

            {/* Oreja izquierda */}
            <path d="M 28,68 L 32,46 L 46,62" />
            {/* Oreja derecha */}
            <path d="M 56,58 L 64,42 L 72,64" />

            {/* Ojos cerrados (dos pequeñas curvas como en el dibujo) */}
            <g className={styles.eyesClosed}>
              <path d="M 32,86 Q 38,90 44,86" />
              <path d="M 52,84 Q 58,88 64,84" />
            </g>

            {/* Ojos abiertos (un pelín) */}
            <g className={styles.eyesOpen}>
              <ellipse
                cx="38"
                cy="85"
                rx="1.8"
                ry="2.6"
                fill="currentColor"
                stroke="none"
              />
              <ellipse
                cx="58"
                cy="83"
                rx="1.8"
                ry="2.6"
                fill="currentColor"
                stroke="none"
              />
            </g>

            {/* Nariz */}
            <path
              d="M 44,96 L 47,99 L 50,96 Z"
              fill="currentColor"
              fillOpacity={0.55}
              strokeWidth={1.8}
            />
            {/* Boca */}
            <path d="M 42,101 Q 46,104 50,101 Q 54,104 58,101" strokeWidth={1.8} />
          </g>

          {/* COLA: grupo que hace wag periódico */}
          <g
            className={styles.tail}
            style={{ animationDelay: wagDelay }}
          >
            <path d="M 205,92 Q 226,96 226,112 Q 224,124 210,122" />
          </g>
        </g>
      </svg>
    </Tag>
  )
}
