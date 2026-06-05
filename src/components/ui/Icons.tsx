type IconProps = { size?: number; className?: string }

// Wrapper SVG con defaults consistentes (stroke = currentColor para que herede el color del padre)
function Svg({
  size = 16,
  className,
  children,
  viewBox = '0 0 24 24',
}: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// ── Iconos ya existentes ─────────────────────────────────────

export function IconSearch(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  )
}

export function IconEye(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  )
}

export function IconEyeOff(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  )
}

// ── Iconos para EventDetailPage / Footer / Settings ──────────

export function IconShield(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  )
}

export function IconHand(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 11V5a1.5 1.5 0 0 1 3 0v6" />
      <path d="M12 11V4a1.5 1.5 0 0 1 3 0v7" />
      <path d="M15 11V5a1.5 1.5 0 0 1 3 0v9" />
      <path d="M9 11V8a1.5 1.5 0 0 0-3 0v8a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-2" />
    </Svg>
  )
}

export function IconLock(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  )
}

export function IconQuestion(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </Svg>
  )
}

export function IconCalendar(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </Svg>
  )
}

export function IconClock(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Svg>
  )
}

export function IconUser(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  )
}

export function IconUsers(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="3" />
      <path d="M16 14a5 5 0 0 1 5.5 5" />
    </Svg>
  )
}

export function IconChat(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12a8 8 0 0 1-8 8c-1.4 0-2.7-.3-3.8-.9L4 21l1.4-4.6A8 8 0 1 1 21 12z" />
    </Svg>
  )
}

export function IconMap(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 4 15 6 9 4 3 6v14l6-2 6 2 6-2V4z" />
      <line x1="9" y1="4" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="20" />
    </Svg>
  )
}

export function IconBottle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 3h4v3a2 2 0 0 0 .6 1.4l1.4 1.4A4 4 0 0 1 17 11.6V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-7.4a4 4 0 0 1 1-2.8l1.4-1.4A2 2 0 0 0 10 6z" />
    </Svg>
  )
}

export function IconHourglass(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M7 3v3a5 5 0 0 0 2 4l3 2 3-2a5 5 0 0 0 2-4V3" />
      <path d="M7 21v-3a5 5 0 0 1 2-4l3-2 3 2a5 5 0 0 1 2 4v3" />
    </Svg>
  )
}

// ── Corazón con variante "filled" ────────────────────────────

export function IconHeart({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={p.size ?? 16}
      height={p.size ?? 16}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={p.className}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// ── Iconos para el selector de mood del Dashboard ────────────
// Cinco caritas line-art. Ojos = puntos (círculos rellenos), boca = curva.
// La boca cambia para reflejar el ánimo; los ojos cambian solo en los extremos.

function MoodFace({
  size = 28,
  className,
  mouth,
  eyes = 'normal',
}: IconProps & {
  mouth: React.ReactNode
  eyes?: 'normal' | 'sad' | 'happy'
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      {eyes === 'sad' && (
        <>
          <path d="M7.5 10.5 L9.5 9.5" />
          <path d="M16.5 10.5 L14.5 9.5" />
        </>
      )}
      {eyes === 'normal' && (
        <>
          <circle cx="9" cy="10" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="15" cy="10" r="0.6" fill="currentColor" stroke="none" />
        </>
      )}
      {eyes === 'happy' && (
        <>
          <path d="M7.5 10.5 Q9 8.5 10.5 10.5" />
          <path d="M13.5 10.5 Q15 8.5 16.5 10.5" />
        </>
      )}
      {mouth}
    </svg>
  )
}

export function IconMoodVeryBad(p: IconProps) {
  return <MoodFace {...p} eyes="sad" mouth={<path d="M8 17 Q12 12 16 17" />} />
}

export function IconMoodBad(p: IconProps) {
  return <MoodFace {...p} mouth={<path d="M8.5 16 Q12 13.5 15.5 16" />} />
}

export function IconMoodNeutral(p: IconProps) {
  return <MoodFace {...p} mouth={<line x1="8.5" y1="15.5" x2="15.5" y2="15.5" />} />
}

export function IconMoodGood(p: IconProps) {
  return <MoodFace {...p} mouth={<path d="M8.5 14.5 Q12 17 15.5 14.5" />} />
}

export function IconMoodVeryGood(p: IconProps) {
  return <MoodFace {...p} eyes="happy" mouth={<path d="M8 14 Q12 18.5 16 14" />} />
}

// ── Tres puntos verticales (menú de acciones) ───────────────

export function IconKebab(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconPencil(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  )
}

export function IconTrash(p: IconProps) {
  return (
    <Svg {...p}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Svg>
  )
}

// ── Punto coloreado para indicadores de disponibilidad ───────

export function IconDot({ color = 'currentColor', size = 10, className }: { color?: string; size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 10 10"
      className={className}
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="5" fill={color} />
    </svg>
  )
}
