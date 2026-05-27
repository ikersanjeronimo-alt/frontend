export interface OptimisticMutationOps<T, R> {
  setData:    (next: T | ((prev: T) => T)) => void
  optimistic: (prev: T) => T
  call:       () => Promise<R>
  onSuccess:  (prev: T, result: R) => T
  rollback:   (prev: T) => T
}

export async function optimisticMutation<T, R>(ops: OptimisticMutationOps<T, R>): Promise<void> {
  ops.setData(ops.optimistic)
  try {
    const result = await ops.call()
    ops.setData(prev => ops.onSuccess(prev, result))
  } catch (e) {
    ops.setData(ops.rollback)
    throw e
  }
}
