'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { CreateProductionRecordSchema, ParadaSchema, ProducaoItemSchema } from '@/lib/schemas'
import { validateData, formatValidationErrors } from '@/lib/validation'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProductionEditFormProps {
  recordId: string
  onClose: () => void
}

interface Downtime {
  id: string
  reason: string
  duration: string
  description: string
}

interface Production {
  id: string
  model: string
  color: string
  quantity: string
  isRepaint: boolean
}

interface ProductionRecord {
  id: string
  data?: string
  hora?: string
  time_slot?: string
  skids_produced?: number
  empty_skids?: number
  paradas?: Array<{
    tipo?: string
    motivo?: string
    tempo?: number
    descricao?: string
  }>
  producao?: Array<{
    modelo?: string
    cor?: string
    qtd?: number
    quantidade?: number
    repintura?: boolean
  }>
}

const timeSlots = [
  '00:00 - 01:00', '01:00 - 02:00', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00', '05:00 - 06:00',
  '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00',
  '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00', '23:00 - 23:59'
]

const getShiftFromTime = (timeSlot: string): 'morning' | 'afternoon' | 'night' => {
  const hour = parseInt(timeSlot.split(':')[0])
  if (hour >= 6 && hour < 14) return 'morning'
  if (hour >= 14 && hour < 22) return 'afternoon'
  return 'night'
}

const getAreaFromReason = (reason: string): string => {
  const areaMap: { [key: string]: string } = {
    'TESTE DE ENGENHARIA': 'Engenharia',
    'LIMITE DE EIXO': 'Engenharia',
    'FALTA DE FERRAMENTAS': 'Gestão',
    'FALTA DE OPERADOR NA CARGA': 'Gestão',
    'FALTA DE PEÇAS DA PREPARAÇÃO': 'Gestão',
    'OPERADOR BUSCANDO PEÇA NO ALMOXARIFADO': 'Gestão',
    'OPERADOR NA ENFERMARIA': 'Gestão',
    'ORGANIZAÇÃO GERAL NO SETOR': 'Gestão',
    'PARADA NA CABINE': 'Gestão',
    'PARADA NA CARGA - ABASTECENDO A LINHA': 'Gestão',
    'PARADA NA DESCARGA - DESCARREGANDO PEÇAS': 'Gestão',
    'PARADA EXTERNA': 'Gestão',
    'REFEIÇÃO': 'Gestão',
    'REGULAGEM DE MÁQUINA': 'Gestão',
    'RETRABALHO / LIMPEZA DE PEÇAS': 'Gestão',
    'REUNIÃO COM A DIRETORIA': 'Gestão',
    'REUNIÃO': 'Gestão',
    'TREINAMENTO': 'Gestão',
    'TROCA DE TURNO': 'Gestão',
    'AGUARDANDO A PROGRAMAÇÃO': 'Logística',
    'FALHA RFID': 'Logística',
    'FALTA DE ABASTECIMENTO DE RACK': 'Logística',
    'FALTA DE EMBALAGEM DA LOGÍSTICA': 'Logística',
    'FALTA DE EMPILHADOR DA LOGÍSTICA ABASTECENDO PEÇAS': 'Logística',
    'FALTA DE MATÉRIA PRIMA (TINTA / VERNIZ)': 'Logística',
    'FALTA DE PEÇAS DO ALMOXARIFADO (REQUISITADO)': 'Logística',
    'FALTA DE PEÇAS INJETADAS': 'Logística',
    'PARADA PROGRAMADA': 'Logística',
    'AGUARDANDO A MANUTENÇÃO': 'Manutenção',
    'CABINE DESBALANCEADA': 'Manutenção',
    'CORRENTE QUEBRADA': 'Manutenção',
    'FALHA NO ELEVADOR': 'Manutenção',
    'FALTA AR COMPRIMIDO': 'Manutenção',
    'FALTA DE ENERGIA': 'Manutenção',
    'MANGUEIRA ENTUPIDA': 'Manutenção',
    'MANGUEIRA VAZANDO': 'Manutenção',
    'MANUTENÇÃO CORRETIVA': 'Manutenção',
    'SKID TRAVADO': 'Manutenção',
    'MANUTENÇÃO ELÉTRICA': 'Manutenção',
    'MANUTENÇÃO MECÂNICA': 'Manutenção',
    'MANUTENÇÃO PREDIAL': 'Manutenção',
    'MANUTENÇÃO PREVENTIVA': 'Manutenção',
    'MANUTENÇÃO SERRALHERIA': 'Manutenção',
    'PROBLEMA NO ROBÔ CAB. FLAMAGEM': 'Manutenção',
    'PROBLEMA NO ROBÔ CAB. PRIMER': 'Manutenção',
    'PROBLEMA NO ROBÔ CAB. BASE': 'Manutenção',
    'PROBLEMA NO ROBÔ CAB. VERNIZ': 'Manutenção',
    'PROBLEMA NO MAÇARICO': 'Manutenção',
    'PROBLEMA NO MOTOR / CORREIA': 'Manutenção',
    'PROBLEMA NO POWER WASH': 'Manutenção',
    'AGUARDANDO OPERADOR PARA LIMPEZA': 'Milclean',
    'FALTA DE OPERADOR': 'Produção',
    'FIM DE EXPEDIENTE': 'Produção',
    'LIMPEZA DE MÁQUINA': 'Produção',
    'PAUSA': 'Produção',
    'TROCA DE PEÇAS': 'Produção',
    'TROCA DE SETUP': 'Produção',
    'ESPERANDO LIBERAÇÃO DA QUALIDADE': 'Qualidade',
    'SETUP DE COR': 'Setup',
    'TROCA DE MODELO': 'Setup',
    'LIMPEZA DA CABINE': 'Pintura',
    'GAP PARA LIMPEZA NA CABINE': 'Pintura',
    'LIMPEZA CONJUNTO ECOBELL': 'Pintura',
    'GAP NA FLAMAGEM': 'Pintura',
    'ACIDENTE / INCIDENTE': 'Segurança',
    'INSPEÇÃO DE SEGURANÇA': 'Segurança'
  }
  return areaMap[reason] || 'Outros'
}

const downtimeReasonsByArea = {
  '🧪 Engenharia': [
    'TESTE DE ENGENHARIA',
    'LIMITE DE EIXO'
  ],
  '👥 Gestão': [
    'FALTA DE FERRAMENTAS',
    'FALTA DE OPERADOR NA CARGA',
    'FALTA DE PEÇAS DA PREPARAÇÃO',
    'OPERADOR BUSCANDO PEÇA NO ALMOXARIFADO',
    'OPERADOR NA ENFERMARIA',
    'ORGANIZAÇÃO GERAL NO SETOR',
    'PARADA NA CABINE',
    'PARADA NA CARGA - ABASTECENDO A LINHA',
    'PARADA NA DESCARGA - DESCARREGANDO PEÇAS',
    'PARADA EXTERNA',
    'REFEIÇÃO',
    'REGULAGEM DE MÁQUINA',
    'RETRABALHO / LIMPEZA DE PEÇAS',
    'REUNIÃO COM A DIRETORIA',
    'REUNIÃO',
    'TREINAMENTO',
    'TROCA DE TURNO'
  ],
  '📦 Logística': [
    'AGUARDANDO A PROGRAMAÇÃO',
    'FALHA RFID',
    'FALTA DE ABASTECIMENTO DE RACK',
    'FALTA DE EMBALAGEM DA LOGÍSTICA',
    'FALTA DE EMPILHADOR DA LOGÍSTICA ABASTECENDO PEÇAS',
    'FALTA DE MATÉRIA PRIMA (TINTA / VERNIZ)',
    'FALTA DE PEÇAS DO ALMOXARIFADO (REQUISITADO)',
    'FALTA DE PEÇAS INJETADAS',
    'PARADA PROGRAMADA'
  ],
  '🔧 Manutenção': [
    'AGUARDANDO A MANUTENÇÃO',
    'CABINE DESBALANCEADA',
    'CORRENTE QUEBRADA',
    'FALHA NO ELEVADOR',
    'FALTA AR COMPRIMIDO',
    'FALTA DE ENERGIA',
    'MANGUEIRA ENTUPIDA',
    'MANGUEIRA VAZANDO',
    'MANUTENÇÃO CORRETIVA',
    'SKID TRAVADO',
    'MANUTENÇÃO ELÉTRICA',
    'MANUTENÇÃO MECÂNICA',
    'MANUTENÇÃO PREDIAL',
    'MANUTENÇÃO PREVENTIVA',
    'MANUTENÇÃO SERRALHERIA',
    'PROBLEMA NO ROBÔ CAB. FLAMAGEM',
    'PROBLEMA NO ROBÔ CAB. PRIMER',
    'PROBLEMA NO ROBÔ CAB. BASE',
    'PROBLEMA NO ROBÔ CAB. VERNIZ',
    'PROBLEMA NO MAÇARICO',
    'PROBLEMA NO MOTOR / CORREIA',
    'PROBLEMA NO POWER WASH'
  ],
  '🧽 Milclean': [
    'AGUARDANDO OPERADOR PARA LIMPEZA'
  ],
  '🏭 Produção': [
    'FALTA DE OPERADOR',
    'FIM DE EXPEDIENTE',
    'LIMPEZA DE MÁQUINA',
    'PAUSA',
    'TROCA DE PEÇAS',
    'TROCA DE SETUP'
  ],
  '✅ Qualidade': [
    'ESPERANDO LIBERAÇÃO DA QUALIDADE'
  ],
  '⚙️ Setup': [
    'SETUP DE COR',
    'TROCA DE MODELO'
  ],
  '🎨 Pintura': [
    'LIMPEZA DA CABINE',
    'GAP PARA LIMPEZA NA CABINE',
    'LIMPEZA CONJUNTO ECOBELL',
    'GAP NA FLAMAGEM'
  ],
  '🛡️ Segurança': [
    'ACIDENTE / INCIDENTE',
    'INSPEÇÃO DE SEGURANÇA'
  ]
}

const models = [
  'Polo PA DT',
  'Polo PA TR',
  'Polo Track DT',
  'Polo Track TR',
  'Virtus DT',
  'Virtus TR',
  'Tera DT',
  'Tera Polaina LD',
  'Tera Polaina LE',
  'Grade Virtus',
  'Grade Virtus GTS',
  'Aerofólio',
  'Spoiler',
  'Tera Friso DT',
  'Tera Friso TR'
]

const colors = [
  'Primer P&A',
  'Branco',
  'Prata',
  'Preto',
  'Platinum',
  'Vermelho',
  'Azul Biscay',
  'IceBird',
  'ClearWater',
  'HyperNova'
]

export function ProductionEditForm({ recordId, onClose }: ProductionEditFormProps) {
  const { user, token } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingRecord, setLoadingRecord] = useState(true)
  
  // Estados do formulário
  const [selectedTime, setSelectedTime] = useState('')
  const [skidsProduced, setSkidsProduced] = useState('')
  const [emptySkids, setEmptySkids] = useState('')
  const [downtimes, setDowntimes] = useState<Downtime[]>([])
  const [productions, setProductions] = useState<Production[]>([])

  // Carregar dados do registro existente
  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch(`/api/production-records/${recordId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) {
          throw new Error('Erro ao carregar registro')
        }
        
        const record: ProductionRecord = await response.json()
        console.log('Dados do registro carregado:', record)
        
        // Preencher os campos com os dados existentes
        const timeSlot = record.time_slot || record.hora || ''
        console.log('Horário carregado:', timeSlot)
        setSelectedTime(timeSlot)
        setSkidsProduced((record.skids_produced || 0).toString())
        setEmptySkids((record.empty_skids || 0).toString())
        
        // Converter paradas para o formato do formulário
        const paradas = record.paradas || []
        const formattedDowntimes: Downtime[] = paradas.map((parada: any, index: number) => ({
          id: `downtime-${index}`,
          reason: parada.tipo || parada.motivo || '',
          duration: (parada.tempo || 0).toString(),
          description: parada.descricao || ''
        }))
        setDowntimes(formattedDowntimes.length > 0 ? formattedDowntimes : [{
          id: 'downtime-1',
          reason: '',
          duration: '',
          description: ''
        }])
        
        // Converter produção para o formato do formulário
        const producao = record.producao || []
        const formattedProductions: Production[] = producao.map((prod: any, index: number) => ({
          id: `production-${index}`,
          model: prod.modelo || '',
          color: prod.cor || '',
          quantity: (prod.qtd || prod.quantidade || 0).toString(),
          isRepaint: prod.repintura || false
        }))
        setProductions(formattedProductions.length > 0 ? formattedProductions : [{
          id: 'production-1',
          model: '',
          color: '',
          quantity: '',
          isRepaint: false
        }])
        
      } catch (error) {
        console.error('Erro ao carregar registro:', error)
        toast.error('Erro ao carregar dados do registro')
      } finally {
        setLoadingRecord(false)
      }
    }

    fetchRecord()
  }, [recordId])

  // Funções para gerenciar paradas
  const addDowntime = useCallback(() => {
    const newDowntime: Downtime = {
      id: `downtime-${Date.now()}`,
      reason: '',
      duration: '',
      description: ''
    }
    setDowntimes(prev => [...prev, newDowntime])
  }, [])

  const removeDowntime = useCallback((id: string) => {
    setDowntimes(prev => prev.filter(d => d.id !== id))
  }, [])

  const updateDowntime = useCallback((id: string, field: keyof Downtime, value: string) => {
    setDowntimes(prev => prev.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ))
  }, [])

  // Funções para gerenciar produção
  const addProduction = useCallback(() => {
    const newProduction: Production = {
      id: `production-${Date.now()}`,
      model: '',
      color: '',
      quantity: '',
      isRepaint: false
    }
    setProductions(prev => [...prev, newProduction])
  }, [])

  const removeProduction = useCallback((id: string) => {
    setProductions(prev => prev.filter(p => p.id !== id))
  }, [])

  const updateProduction = useCallback((id: string, field: keyof Production, value: string | boolean) => {
    setProductions(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }, [])

  const handleSave = async () => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setLoading(true)

    try {
      // Validar dados básicos
      if (!selectedTime) {
        toast.error('Selecione um horário')
        return
      }

      if (!skidsProduced || parseInt(skidsProduced) < 0) {
        toast.error('Informe a quantidade de skids produzidos')
        return
      }

      if (!emptySkids || parseInt(emptySkids) < 0) {
        toast.error('Informe a quantidade de skids vazios')
        return
      }

      // Preparar dados das paradas
      const paradasData = (downtimes || [])
        .filter(d => d && d.reason && d.duration)
        .map(d => ({
          motivo: 'other', // Usando enum válido do schema
          inicio: new Date().toISOString(),
          duracao: parseInt(d.duration) || 0,
          observacoes: `${d.reason} - ${d.description || ''}`.trim()
        }))

      // Preparar dados da produção
      const producaoData = (productions || [])
        .filter(p => p && p.model && p.color && p.quantity)
        .map(p => ({
          modelo: p.model,
          cor: 'other', // Usando enum válido do schema
          qtd: parseInt(p.quantity) || 0,
          repintura: p.isRepaint,
          observacoes: `Cor original: ${p.color}`
        }))

      if (producaoData.length === 0) {
        toast.error('Adicione pelo menos um item de produção')
        return
      }

      // Preparar dados para envio (formato esperado pela API)
      const recordData = {
        selectedTime: selectedTime,
        shift: getShiftFromTime(selectedTime),
        skidsProduced: parseInt(skidsProduced) || 0,
        emptySkids: parseInt(emptySkids) || 0,
        targetDate: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
        downtimes: (downtimes || []).filter(d => d && d.reason && d.duration).map(d => ({
          reason: d.reason,
          duration: parseInt(d.duration) || 0,
          description: d.description || ''
        })),
        productions: (productions || []).filter(p => p && p.model && p.color && p.quantity).map(p => ({
          model: p.model,
          color: p.color,
          quantity: parseInt(p.quantity) || 0,
          isRepaint: p.isRepaint || false
        }))
      }

      console.log('Dados para envio:', recordData)
      console.log('Shift calculado:', getShiftFromTime(selectedTime))

      // Validação básica antes do envio
      if (!selectedTime) {
        toast.error('Selecione um horário')
        return
      }
      
      if (recordData.productions.length === 0) {
        toast.error('Adicione pelo menos um item de produção')
        return
      }

      // Enviar para API
      const response = await fetch(`/api/production-records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar registro')
      }

      toast.success('Registro atualizado com sucesso!')
      onClose()
      router.push('/dashboard/production')
      
    } catch (error) {
      console.error('Erro ao atualizar registro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar registro')
    } finally {
      setLoading(false)
    }
  }

  if (loadingRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do registro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar Registro de Produção</h1>
          <p className="text-gray-600">Edite as informações do registro de produção</p>
        </div>

        {/* Seleção de Horário */}
        <Card>
          <CardHeader>
            <CardTitle>Horário de Produção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time-slot">Horário</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot} - {getShiftFromTime(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produção de Skids */}
        <Card>
          <CardHeader>
            <CardTitle>Produção de Skids</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="skids-produced">Skids Produzidos</Label>
              <Input
                id="skids-produced"
                type="number"
                value={skidsProduced}
                onChange={(e) => setSkidsProduced(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="empty-skids">Skids Vazios</Label>
              <Input
                id="empty-skids"
                type="number"
                value={emptySkids}
                onChange={(e) => setEmptySkids(e.target.value)}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Motivos de Paradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Motivos de Paradas
              <Button onClick={addDowntime} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Parada
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {downtimes.map((downtime, index) => (
              <div key={downtime.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Parada {index + 1}</h4>
                  {downtimes.length > 1 && (
                    <Button
                      onClick={() => removeDowntime(downtime.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Motivo da Parada</Label>
                    <Select
                      value={downtime.reason}
                      onValueChange={(value) => updateDowntime(downtime.id, 'reason', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(downtimeReasonsByArea).map(([area, reasons]) => (
                          <div key={area}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-gray-900 bg-gray-100">
                              {area}
                            </div>
                            {reasons.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tempo da Parada (minutos)</Label>
                    <Input
                      type="number"
                      value={downtime.duration}
                      onChange={(e) => updateDowntime(downtime.id, 'duration', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label>Descrição (Opcional)</Label>
                  <Textarea
                    value={downtime.description}
                    onChange={(e) => updateDowntime(downtime.id, 'description', e.target.value)}
                    placeholder="Descreva detalhes da parada..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Produção por Modelo e Cor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Produção por Modelo e Cor
              <Button onClick={addProduction} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produção
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {productions.map((production, index) => (
              <div key={production.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Produção {index + 1}</h4>
                  {productions.length > 1 && (
                    <Button
                      onClick={() => removeProduction(production.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Modelo</Label>
                    <Select
                      value={production.model}
                      onValueChange={(value) => updateProduction(production.id, 'model', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Select
                      value={production.color}
                      onValueChange={(value) => updateProduction(production.id, 'color', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cor" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={production.quantity}
                      onChange={(e) => updateProduction(production.id, 'quantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`repaint-${production.id}`}
                    checked={production.isRepaint}
                    onCheckedChange={(checked) => updateProduction(production.id, 'isRepaint', checked as boolean)}
                  />
                  <Label htmlFor={`repaint-${production.id}`}>Repintura</Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Atualizar Registro'}
          </Button>
        </div>
      </div>
    </div>
  )
}