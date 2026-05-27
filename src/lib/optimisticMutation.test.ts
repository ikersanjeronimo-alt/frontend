import { describe, it, expect, vi } from 'vitest'
import { optimisticMutation } from './optimisticMutation'
import { makeApiError } from '../services/api'

describe('optimisticMutation', () => {
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

  it('error de red (status 0): hace rollback y re-lanza', async () => {
    const setData = vi.fn()
    const netError = makeApiError(0, 'Net')
    const call    = vi.fn().mockRejectedValue(netError)

    await expect(
      optimisticMutation({
        setData,
        optimistic: prev => prev,
        call,
        onSuccess: prev => prev,
        rollback:  prev => prev,
      })
    ).rejects.toBe(netError)

    expect(setData).toHaveBeenCalledTimes(2)  // optimistic + rollback
  })
})
