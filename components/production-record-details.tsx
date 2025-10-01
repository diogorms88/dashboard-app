'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ProductionRecord } from '@/lib/types'

// Interfaces para compatibilidade com API existente
interface Downtime {
  id: number
  reason: string
  duration: number
  description: string
}

interface ProductionDetail {
  id: number
  model: string
  color: string
  quantity: number
  is_repaint: number
}

// Interface estendida para detalhes específicos da API
interface ProductionRecordDetails extends Omit<ProductionRecord, 'paradas' | 'producao'> {
  downtimes: Downtime[]
  production_details: ProductionDetail[]
}

interface ProductionRecordDetailsProps {
  recordId: string // Mudado de number para string para suportar UUIDs
}

export function ProductionRecordDetails({ recordId }: ProductionRecordDetailsProps) {
  const [record, setRecord] = useState<ProductionRecordDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { token } = useAuth()

  useEffect(() => {
    const fetchRecordDetails = async () => {
      try {
        if (!token) {
          return
        }

        const response = await fetch(`/api/production-records/${recordId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Falha ao carregar detalhes do registro')
        }

        const data = await response.json()
        setRecord(data)
        setError('') // Limpar erro anterior
      } catch (err) {
        setError('Não foi possível carregar os detalhes do registro')
      } finally {
        setLoading(false)
      }
    }

    if (recordId && token) {
      fetchRecordDetails()
    }
  }, [recordId, token, router])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR')
  }

  const goBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <p>Carregando detalhes do registro...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !record) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <p className="text-red-500">{error || 'Registro não encontrado'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Detalhes do Registro de Produção</h2>
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Horário:</p>
              <p>{record.time_slot}</p>
            </div>
            <div>
              <p className="font-medium">Turno:</p>
              <p>{record.shift}</p>
            </div>
            <div>
              <p className="font-medium">Skids Produzidos:</p>
              <p>{record.skids_produced}</p>
            </div>
            <div>
              <p className="font-medium">Skids Vazios:</p>
              <p>{record.empty_skids}</p>
            </div>
            <div>
              <p className="font-medium">Data de Criação:</p>
              <p>{formatDate(record.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motivos de Paradas</CardTitle>
        </CardHeader>
        <CardContent>
          {record.downtimes && record.downtimes.length > 0 ? (
            <div className="space-y-4">
              {record.downtimes.map((downtime) => (
                <div key={downtime.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Tipo:</p>
                      <p>{downtime.reason}</p>
                    </div>
                    <div>
                      <p className="font-medium">Tempo (minutos):</p>
                      <p>{downtime.duration}</p>
                    </div>
                    <div>
                      <p className="font-medium">Critério:</p>
                      <p>{downtime.criterio || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Descrição:</p>
                      <p>{downtime.description || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma parada registrada.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produção por Modelo e Cor</CardTitle>
        </CardHeader>
        <CardContent>
          {record.producao && record.producao.length > 0 ? (
            <div className="space-y-4">
              {record.producao.map((producao, index) => (
                <div key={`producao-${index}`} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Modelo:</p>
                      <p>{producao.modelo}</p>
                    </div>
                    <div>
                      <p className="font-medium">Cor:</p>
                      <p>{producao.cor}</p>
                    </div>
                    <div>
                      <p className="font-medium">Quantidade:</p>
                      <p>{producao.qtd}</p>
                    </div>
                    <div>
                      <p className="font-medium">Repintura:</p>
                      <p>{producao.repintura ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum detalhe de produção encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}