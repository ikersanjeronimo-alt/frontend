import { Client, type IFrame } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { tokenStorage } from '../services/storage'

const WS_URL      = import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws'
const onConnectCallbacks: ((client: Client) => void)[] = []
const onDisconnectCallbacks: (() => void)[] = []


let client: Client | null = null

export function getClient(){
  return client
}

export function onConnect(callback: (client: Client) => void): void {
  onConnectCallbacks.push(callback)
}

export function onDisconnect(callback: () => void): void{
  onDisconnectCallbacks.push(callback)
}

export function initWS():void{

  if (client) return

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),

    // Se relee en cada (re)conexión: si el token anónimo aún no existía al
    // arrancar, la reconexión automática lo recoge en cuanto está disponible.
    beforeConnect: () => {
      const token = tokenStorage.get()
      if (client) {
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {}
      }
    },

    onConnect: (frame: IFrame) => {
        console.log('[ws] Conectado, ejecutando callbacks:', onConnectCallbacks.length)
        console.log("[ws] Connected", frame)
        onConnectCallbacks.forEach(cb => cb(client!))
    },
    
    onDisconnect: (frame: IFrame) => {
      console.log("[ws] Disconnected", frame)
      onDisconnectCallbacks.forEach(cb => cb())
    },

    onStompError: (frame: IFrame) => {
      console.error('[ws] STOMP error:', frame.headers['message'], frame.body)
    },

    onWebSocketError: (error) => {
      console.error('[ws] WebSocket error:', error)
    },

    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  })

  console.log('[ws] Iniciando conexión a:', WS_URL)
  client.activate()
}

export function disconnectStories(): void {
  client?.deactivate()
  client = null
}