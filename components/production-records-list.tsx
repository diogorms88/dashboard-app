'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Trash2, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ProductionRecord, Parada, ProducaoItem } from '@/lib/types'

export function ProductionRecordsList() {
  const [records, setRecords] = useState<ProductionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { token } = useAuth()

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        if (!token) {
          return
        }

        const response = await fetch('/api/production-records', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Falha ao carregar registros de produção')
        }

        const data = await response.json()
        setRecords(data)
        setError('') // Limpar erro anterior
      } catch (err) {
        setError(`Não foi possível carregar os registros de produção: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [token])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const formatTime = (timeString: string) => {
    return timeString || 'N/A'
  }

  const formatParadas = (paradas: Parada[]) => {
    if (!paradas || paradas.length === 0) return 'Nenhuma'
    return paradas.length + ' parada(s)'
  }

  const formatProducao = (producao: ProducaoItem[]) => {
    if (!producao || producao.length === 0) return 'Nenhuma'
    const total = producao.reduce((sum, item) => sum + item.qtd, 0)
    return total + ' peças'
  }

  const viewRecord = (id: string) => {
    router.push(`/dashboard/production/${id}`)
  }

  const editRecord = (id: string) => {
    router.push(`/dashboard/production/${id}/edit`)
  }

  const deleteRecord = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de produção? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/production-records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Falha ao excluir registro')
      }

      // Atualizar a lista removendo o registro excluído
      setRecords(records.filter(record => record.id !== id))
      
      // Disparar evento para atualizar o dashboard
      window.dispatchEvent(new CustomEvent('productionRecordCreated'))
      
      alert('Registro excluído com sucesso!')
    } catch (err) {
      alert('Erro ao excluir registro. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <p>Carregando registros...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros de Produção</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-center py-4">Nenhum registro de produção encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Skids Produzidos</TableHead>
                <TableHead>Skids Vazios</TableHead>
                <TableHead>Paradas</TableHead>
                <TableHead>Produção</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.created_at)}</TableCell>
                  <TableCell>{formatTime(record.time_slot)}</TableCell>
                  <TableCell>{record.skids_produced}</TableCell>
                  <TableCell>{record.empty_skids}</TableCell>
                  <TableCell>{formatParadas(record.paradas)}</TableCell>
                  <TableCell>{formatProducao(record.producao)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => viewRecord(record.id)} title="Visualizar registro">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => editRecord(record.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Editar registro"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteRecord(record.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}