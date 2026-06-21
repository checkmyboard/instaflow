import { useState, useCallback } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async <T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    data?: unknown
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await api[method]<T>(url, data)
      return res.data
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : 'Erro desconhecido'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { request, loading, error, setError }
}
