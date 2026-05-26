export const CAT_PALETTE = {
  lavender:   '#A89BD8',
  peach:      '#F5A88B',
  mint:       '#8FD8B4',
  sky:        '#8FC1E8',
  butter:     '#F2D27A',
  rose:       '#E89BB8',
  coral:      '#F19082',
  pistachio:  '#C0D88B',
  lilac:      '#C3A5DE',
  sand:       '#D9BB88',
  ocean:      '#7BBFD0',
  raspberry:  '#D88FA8',
  honey:      '#E8B57A',
  fern:       '#9CC98C',
  periwinkle: '#9AA8E0',
  blush:      '#E8A0A0',
} as const

export type CatColorKey = keyof typeof CAT_PALETTE

/** Mapeo determinista de ruta → color + seed. */
const ROUTE_CATS: Record<string, { color: CatColorKey; seed: number }> = {
  '/':                   { color: 'lavender',   seed: 0 },
  '/onboarding':         { color: 'butter',     seed: 1 },
  '/login':              { color: 'sky',        seed: 2 },
  '/dashboard':          { color: 'peach',      seed: 3 },
  '/perfil':             { color: 'mint',       seed: 4 },
  '/configuracion':      { color: 'lilac',      seed: 5 },
  '/profesionales':      { color: 'pistachio',  seed: 6 },
  '/chat':               { color: 'rose',       seed: 7 },
  '/comunidades':        { color: 'coral',      seed: 8 },
  '/comunidades-chat':   { color: 'periwinkle', seed: 9 },
  '/eventos':            { color: 'honey',      seed: 10 },
  '/eventos-detail':     { color: 'sand',       seed: 11 },
  '/maquina-del-tiempo': { color: 'raspberry',  seed: 12 },
  '/botella':            { color: 'ocean',      seed: 13 },
  '/mapa':               { color: 'fern',       seed: 14 },
  '/moderacion':         { color: 'blush',      seed: 15 },
  '/loginmod':           { color: 'sky',        seed: 16 },
  '/modregister':        { color: 'butter',     seed: 17 },
  '/404':                { color: 'lilac',      seed: 18 },
}

export function catFor(key: keyof typeof ROUTE_CATS): { color: string; seed: number } {
  const entry = ROUTE_CATS[key] ?? ROUTE_CATS['/']
  return { color: CAT_PALETTE[entry.color], seed: entry.seed }
}
