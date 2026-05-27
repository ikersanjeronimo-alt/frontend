export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return name.slice(0, 2).toUpperCase()
  return parts.map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
