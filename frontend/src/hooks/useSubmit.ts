// Estado de envío de un formulario: `pending`, `error` (ApiError) y `run()` que devuelve el resultado.
import { useCallback, useState } from 'react'
import { toApiError, type ApiError } from '../services/httpClient'

export function useSubmit<Args extends unknown[], Result>(action: (...args: Args) => Promise<Result>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      setPending(true)
      setError(null)
      try {
        return await action(...args)
      } catch (caught) {
        setError(toApiError(caught))
        return undefined
      } finally {
        setPending(false)
      }
    },
    [action],
  )

  const clearError = useCallback(() => setError(null), [])
  return { pending, error, run, clearError }
}
