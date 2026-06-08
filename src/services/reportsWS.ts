import type { Client } from '@stomp/stompjs'
import { getClient, onConnect, onDisconnect } from '../lib/wsClient'

/**
 * Aviso de "reporte nuevo" para el panel de moderación. El backend difunde una
 * señal SIN datos por `/topic/moderation/reports`; al recibirla, el panel recarga
 * la lista por el endpoint REST (no se expone contenido sensible en el topic).
 */
const TOPIC = '/topic/moderation/reports'
const listeners = new Set<() => void>()
let subscribed = false
let registered = false

function subscribe(client: Client): void {
  client.subscribe(TOPIC, () => {
    listeners.forEach(fn => fn())
  })
  subscribed = true
}

function ensureInit(): void {
  const client = getClient()
  if (client?.connected && !subscribed) subscribe(client)

  if (registered) return
  registered = true

  // Re-suscribirse en cada (re)conexión (login/logout o corte de red).
  onConnect((connectedClient: Client) => {
    if (!subscribed) subscribe(connectedClient)
  })
  onDisconnect(() => {
    subscribed = false
  })
}

/** Registra un callback invocado al llegar un aviso de reporte nuevo. Devuelve la
 *  función para desuscribir. */
export function onNewReport(cb: () => void): () => void {
  ensureInit()
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}
