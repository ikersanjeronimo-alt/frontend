import { describe, it, expect, vi } from 'vitest'

// Mock del módulo env: para estos tests fijamos la flag a true. Así el test
// es determinista independientemente del .env del proyecto.
vi.mock('./env', () => ({ ALLOW_MOCK_FALLBACK: true }))

import { optimisticMutation } from './optimisticMutation'
import { makeApiError } from '../services/api'

describe('optimisticMutation (con ALLOW_MOCK_FALLBACK=true)', () => {
  it('success: aplica optimistic y luego onSuccess con el resultado del server', async () => {
    const setData = vi.fn()
    const call    = vi.fn().mockResolvedValue({ id: 'real-id', text: 'hola' })

    await optimisticMutation<{ items: { id: string; text: string }[] }, { id: string; text: string }>({
      setData,
      optimistic: prev => ({ items: [...prev.items, { id: 'temp', text: 'hola' }] }),
      call,
      onSuccess:  (prev, saved) => ({ items: prev.items.map(i => i.id === 'temp' ? saved : i) }),
      rollback:   prev => ({ items: prev.items.filter(i => i.id !== 'temp') }),
    })

    expect(call).toHaveBeenCalledOnce()
    expect(setData).toHaveBeenCalledTimes(2)  // optimistic + onSuccess
  })

  it('error de servidor (status > 0): hace rollback y re-lanza', async () => {
    const setData = vi.fn()
    const serverError = makeApiError(500, 'Internal')
    const call    = vi.fn().mockRejectedValue(serverError)

    await expect(
      optimisticMutation({
        setData,
        optimistic: prev => prev,
        call,
        onSuccess: prev => prev,
        rollback:  prev => prev,
      })
    ).rejects.toBe(serverError)

    expect(setData).toHaveBeenCalledTimes(2)  // optimistic + rollback
  })

  it('error de red (status 0) con flag activa: NO hace rollback, NO tira', async () => {
    const setData = vi.fn()
    const netError = makeApiError(0, 'Net')
    const call    = vi.fn().mockRejectedValue(netError)

    // La flag activa hace que el helper se trague el error y deje el
    // optimistic en sitio (la UI ve datos "guardados" + banner demo).
    await optimisticMutation({
      setData,
      optimistic: prev => prev,
      call,
      onSuccess: prev => prev,
      rollback:  prev => prev,
    })

    // Solo se llamó setData una vez: para el optimistic. No rollback.
    expect(setData).toHaveBeenCalledTimes(1)
  })
})

// Suite paralela con la flag DESACTIVADA. Re-importamos vía vi.resetModules
// + un mock distinto. Como vi.mock arriba afecta a todo el archivo, hacemos
// este caso en un test aparte usando importación dinámica.
describe('optimisticMutation (con ALLOW_MOCK_FALLBACK=false)', () => {
  it('error de red (status 0) sin flag: SÍ hace rollback y re-lanza', async () => {
    vi.resetModules()
    vi.doMock('./env', () => ({ ALLOW_MOCK_FALLBACK: false }))
    const { optimisticMutation: m } = await import('./optimisticMutation')
    const { makeApiError: makeErr } = await import('../services/api')

    const setData = vi.fn()
    const netError = makeErr(0, 'Net')
    const call    = vi.fn().mockRejectedValue(netError)

    await expect(
      m({
        setData,
        optimistic: prev => prev,
        call,
        onSuccess: prev => prev,
        rollback:  prev => prev,
      })
    ).rejects.toBe(netError)

    expect(setData).toHaveBeenCalledTimes(2)  // optimistic + rollback
    vi.doUnmock('./env')
  })
})
