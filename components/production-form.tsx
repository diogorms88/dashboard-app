'use client'

import { useState } from 'react'
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

interface ProductionFormProps {
  onClose: () => void
  targetDate?: string
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

const timeSlots = [
  '00:00 - 01:00', '01:00 - 02:00', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00', '05:00 - 06:00',
  '06:00 - 07:00', '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00',
  '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00', '23:00 - 23:59'
]

const getShiftFromTime = (timeSlot: string): string => {
  const hour = parseInt(timeSlot.split(':')[0])
  if (hour >= 0 && hour < 6) return '3º Turno'
  if (hour >= 6 && hour < 15) return '1º Turno'
  return '2º Turno'
}

// Função para mapear motivos de parada para critérios
const getAreaFromReason = (reason: string): string => {
  // Encontrar a área baseada no motivo de parada
  for (const [area, reasons] of Object.entries(downtimeReasonsByArea)) {
    if (reasons.includes(reason)) {
      // Remover emoji e converter para formato do critério
      const cleanArea = area.replace(/^[^\w\s]+\s*/, '').toUpperCase()
      
      // Mapeamento específico para os critérios esperados
      switch (cleanArea) {
        case 'ENGENHARIA':
          return 'ENGENHARIA'
        case 'GESTÃO':
          return 'GESTÃO'
        case 'LOGÍSTICA':
          return 'LOGÍSTICA'
        case 'MANUTENÇÃO':
          return 'MANUTENÇÃO'
        case 'MILCLEAN':
          return 'MILCLEAN'
        case 'PRODUÇÃO':
          return 'PRODUÇÃO'
        case 'QUALIDADE':
          return 'QUALIDADE'
        case 'SETUP':
          return 'SETUP'
        case 'PINTURA':
          return 'PINTURA'
        case 'SEGURANÇA':
          return 'SEGURANÇA'
        default:
          return 'OUTROS'
      }
    }
  }
  
  // Se não encontrar, retornar OUTROS
  return 'OUTROS'
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

export function ProductionForm({ onClose, targetDate }: ProductionFormProps) {
  const { token } = useAuth()
  const [selectedTime, setSelectedTime] = useState('')
  const [skidsProduced, setSkidsProduced] = useState('')
  const [emptySkids, setEmptySkids] = useState('')
  const [downtimes, setDowntimes] = useState<Downtime[]>([{
    id: '1',
    reason: '',
    duration: '',
    description: ''
  }])
  const [productions, setProductions] = useState<Production[]>([{
    id: '1',
    model: '',
    color: '',
    quantity: '',
    isRepaint: false
  }])

  const addDowntime = () => {
    const newDowntime: Downtime = {
      id: Date.now().toString(),
      reason: '',
      duration: '',
      description: ''
    }
    setDowntimes([...downtimes, newDowntime])
  }

  const removeDowntime = (id: string) => {
    if (downtimes.length > 1) {
      setDowntimes(downtimes.filter(d => d.id !== id))
    }
  }

  const updateDowntime = (id: string, field: keyof Downtime, value: string) => {
    setDowntimes(downtimes.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ))
  }

  const addProduction = () => {
    const newProduction: Production = {
      id: Date.now().toString(),
      model: '',
      color: '',
      quantity: '',
      isRepaint: false
    }
    setProductions([...productions, newProduction])
  }

  const removeProduction = (id: string) => {
    if (productions.length > 1) {
      setProductions(productions.filter(p => p.id !== id))
    }
  }

  const updateProduction = (id: string, field: keyof Production, value: string | boolean) => {
    setProductions(productions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const handleSave = async () => {
    try {
      // Verificar se os campos obrigatórios estão preenchidos
      if (!selectedTime) {
        alert('Por favor, selecione um horário');
        return;
      }
      
      if (!skidsProduced) {
        alert('Por favor, informe a quantidade de skids produzidos');
        return;
      }
      
      // Verificar se há pelo menos um registro de produção por modelo/cor
      const validProductions = productions.filter(p => p.model && p.color && p.quantity);
      if (validProductions.length === 0) {
        alert('Por favor, adicione pelo menos um registro de produção por modelo/cor');
        return;
      }
      
      // Preparar os dados para envio
      const productionData = {
        selectedTime,
        shift: getShiftFromTime(selectedTime),
        skidsProduced: parseInt(skidsProduced),
        emptySkids: parseInt(emptySkids || '0'),
        targetDate,
        downtimes: downtimes
          .filter(d => d.reason && d.duration)
          .map(d => ({
            reason: d.reason,
            duration: parseInt(d.duration),
            description: d.description
          })),
        productions: validProductions.map(p => ({
          model: p.model,
          color: p.color,
          quantity: parseInt(p.quantity),
          isRepaint: p.isRepaint
        }))
      };
      
      // Enviar os dados para a API
      if (!token) {
        alert('Você precisa estar logado para salvar registros');
        return;
      }
      
      const response = await fetch('/api/production-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Verificar se é erro de horário duplicado
        if (response.status === 409) {
          alert(`⚠️ ${errorData.error}\n\n${errorData.message || 'Este horário já possui um registro de produção.'}`);
          return;
        }
        
        throw new Error(errorData.error || 'Erro ao salvar o registro de produção');
      }
      
      const result = await response.json();
      alert('✅ Registro de produção salvo com sucesso!');
      
      // Disparar evento personalizado para atualizar o dashboard
      window.dispatchEvent(new CustomEvent('productionRecordCreated', {
        detail: result
      }));
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      alert(`❌ Erro ao salvar o registro: ${error.message}`);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Lançamento de Registro</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Horário e Turno */}
        <Card>
          <CardHeader>
            <CardTitle>Horário e Turno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            {selectedTime && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Turno: {getShiftFromTime(selectedTime)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skids */}
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
            Voltar ao Dashboard
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Registro
          </Button>
        </div>
      </div>
    </div>
  )
}