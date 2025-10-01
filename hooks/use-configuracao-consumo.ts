import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'
import { apiRequest } from '@/lib/api'

// Interfaces para a estrutura de configuração
export interface PPFItem {
  cor: string
  modelo: string
}

export interface BaseConfig {
  diluente: string
  taxa_diluicao: number
}

export interface MaterialGeral {
  consumo: number | null
  diluente: string
  taxa_diluicao: number
  taxa_catalisador: number
}

export interface VernizGeral {
  diluente: string
  volume_total: number | null
  taxa_diluicao: number
  taxa_catalisador: number
}

export interface EspecificaItem {
  cor: string
  modelo: string
  base: string
  primer: string
  verniz: string
}

export interface ConfiguracaoConsumo {
  ppf: PPFItem[]
  bases: Record<string, BaseConfig>
  geral: {
    base: MaterialGeral
    primer: MaterialGeral
    verniz: VernizGeral
  }
  modoTaxa: string
  especificas: EspecificaItem[]
}

export interface ConfiguracaoConsumoV2 {
  id?: string
  configuracao: ConfiguracaoConsumo
  created_at?: string
  updated_at?: string
}

export function useConfiguracaoConsumo() {
  const { token } = useAuth()
  const [configuracao, setConfiguracao] = useState<ConfiguracaoConsumoV2 | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar configuração atual
  const loadConfiguracao = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const data = await apiRequest('/configuracao-consumo', {
        method: 'GET'
      })
      setConfiguracao(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração')
    } finally {
      setLoading(false)
    }
  }, [token])

  // Salvar nova configuração
  const saveConfiguracao = useCallback(async (novaConfiguracao: ConfiguracaoConsumo) => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const data = await apiRequest('/configuracao-consumo', {
        method: 'POST',
        body: JSON.stringify({ configuracao: novaConfiguracao })
      })
      setConfiguracao(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração')
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  // Atualizar configuração existente
  const updateConfiguracao = useCallback(async (id: string, novaConfiguracao: ConfiguracaoConsumo) => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const data = await apiRequest('/configuracao-consumo', {
        method: 'PUT',
        body: JSON.stringify({ id, configuracao: novaConfiguracao })
      })
      setConfiguracao(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração')
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  // Resetar para configuração padrão
  const resetConfiguracao = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const result = await apiRequest('/configuracao-consumo/reset', {
        method: 'POST'
      })
      setConfiguracao(result.data)
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resetar configuração')
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  // Calcular consumo para um modelo/cor específico
  const calcularConsumo = useCallback((modelo: string, cor: string, quantidade: number = 1) => {
    if (!configuracao) return null

    const { configuracao: config } = configuracao

    // Buscar configuração específica
    const especifica = config.especificas.find(
      e => e.modelo === modelo && e.cor === cor
    )

    if (especifica) {
      return {
        primer: parseFloat(especifica.primer) * quantidade,
        base: parseFloat(especifica.base) * quantidade,
        verniz: parseFloat(especifica.verniz) * quantidade
      }
    }

    // Usar configurações gerais como fallback
    const baseConfig = config.bases[cor] || config.geral.base
    
    return {
      primer: (config.geral.primer.consumo || 0) * quantidade,
      base: (baseConfig.consumo || config.geral.base.consumo || 0) * quantidade,
      verniz: (config.geral.verniz.volume_total || 0) * quantidade
    }
  }, [configuracao])

  // Verificar se um modelo/cor é pintado (está no PPF)
  const isPintado = useCallback((modelo: string, cor: string) => {
    if (!configuracao) return false
    
    return configuracao.configuracao.ppf.some(
      item => item.modelo === modelo && item.cor === cor
    )
  }, [configuracao])

  return {
    configuracao,
    loading,
    error,
    loadConfiguracao,
    saveConfiguracao,
    updateConfiguracao,
    resetConfiguracao,
    calcularConsumo,
    isPintado
  }
}
