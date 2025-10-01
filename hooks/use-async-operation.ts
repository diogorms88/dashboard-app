import { useState } from 'react'
import { toast } from 'sonner'

interface UseAsyncOperationOptions<T = unknown> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
  ignoreAuthErrors?: boolean
}

export function useAsyncOperation<T = unknown>(options: UseAsyncOperationOptions<T> = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operação realizada com sucesso!',
    errorMessage = 'Erro ao realizar operação',
    ignoreAuthErrors = true
  } = options

  const execute = async (asyncFunction: () => Promise<T>) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await asyncFunction()
      setData(result)
      
      if (showSuccessToast) {
        toast.success(successMessage)
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      const errorMsg = error.message || errorMessage
      setError(errorMsg)
      
      // Não mostrar toast de erro se for problema de autenticação e ignoreAuthErrors for true
      const isAuthError = errorMsg.includes('Token inválido') || 
                         errorMsg.includes('Unauthorized') || 
                         errorMsg.includes('Token de acesso requerido')
      
      if (showErrorToast && !(ignoreAuthErrors && isAuthError)) {
        toast.error(errorMsg)
      }
      
      if (onError) {
        onError(error)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setLoading(false)
    setError(null)
    setData(null)
  }

  return {
    loading,
    error,
    data,
    execute,
    reset
  }
}