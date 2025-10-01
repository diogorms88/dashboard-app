import { useState, useMemo, useCallback } from 'react'
import { FilterConfig, FormFieldValue } from '@/lib/types'

interface UseFiltersOptions<T> {
  initialFilters?: FilterConfig
  searchFields?: (keyof T)[]
  customFilterFn?: (item: T, filters: FilterConfig, searchTerm: string) => boolean
}

// Tipo mais específico para objetos filtráveis
type FilterableObject = Record<string, FormFieldValue | FormFieldValue[] | undefined>

export function useFilters<T extends FilterableObject>(
  data: T[],
  options: UseFiltersOptions<T> = {}
) {
  const {
    initialFilters = {},
    searchFields = [],
    customFilterFn
  } = options

  const [filters, setFilters] = useState<FilterConfig>(initialFilters)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = useMemo(() => {
    if (!data) return []

    return data.filter(item => {
      // Aplicar filtros customizados se fornecidos
      if (customFilterFn) {
        return customFilterFn(item, filters, searchTerm)
      }

      // Aplicar filtros padrão
      const passesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all' || value === '') return true
        return item[key] === value
      })

      // Aplicar busca por texto
      const passesSearch = !searchTerm || searchFields.some(field => {
        const fieldValue = item[field]
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(searchTerm.toLowerCase())
        }
        return false
      })

      return passesFilters && passesSearch
    })
  }, [data, filters, searchTerm, searchFields, customFilterFn])

  const updateFilter = useCallback((key: string, value: FormFieldValue) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
    setSearchTerm('')
  }, [initialFilters])

  const setMultipleFilters = useCallback((newFilters: FilterConfig) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const memoizedSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  return {
    filters,
    searchTerm,
    filteredData,
    updateFilter,
    setSearchTerm: memoizedSetSearchTerm,
    resetFilters,
    setMultipleFilters,
    setFilters
  }
}