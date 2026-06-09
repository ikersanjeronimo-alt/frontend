import { create } from 'zustand'

/**
 * Notificación efímera "en vivo" que llega por WebSocket (cola personal del
 * usuario, `/user/queue/notifications`). Hoy solo se usa para los avisos de
 * moderación. El texto localizado lo construye `NotificationToast` según `type`.
 */
export interface AppNotification {
  id:        number
  type:      string   // 'WARNING' | 'INFO' | ...
  warnings?: number   // nº de avisos acumulados (para type WARNING)
}

interface NotificationsState {
  current: AppNotification | null
  show:    (n: Omit<AppNotification, 'id'>) => void
  dismiss: () => void
}

let seq = 0

export const useNotificationsStore = create<NotificationsState>((set) => ({
  current: null,
  show:    (n) => set({ current: { ...n, id: ++seq } }),
  dismiss: () => set({ current: null }),
}))
