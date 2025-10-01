'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Edit, Save, X, AlertTriangle } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface Form8DData {
  id: number
  title: string
  problem_description: string
  team_members: string[]
  problem_date: string
  detection_date?: string
  customer_impact?: string
  severity_level: string
  status: string
  created_by_name: string
  assigned_to_name?: string
  created_at: string
  ishikawa_analysis: IshikawaItem[]
  five_whys_analysis?: FiveWhysAnalysis
  action_plans: ActionPlan[]
}

interface IshikawaItem {
  id: number
  category: string
  cause_description: string
  subcause_description?: string
  impact_level: number
}

interface FiveWhysAnalysis {
  id: number
  problem_statement: string
  why_1?: string
  why_2?: string
  why_3?: string
  why_4?: string
  why_5?: string
  root_cause?: string
}

interface ActionPlan {
  id: number
  action_type: string
  action_description: string
  responsible_person: string
  due_date: string
  status: string
  completion_date?: string
  verification_method?: string
  effectiveness_check?: string
  comments?: string
}

interface Form8DDetailsProps {
  formId: number
  onClose: () => void
  onUpdate: () => void
}

const ishikawaCategories = [
  { value: 'mao_de_obra', label: 'Mão de Obra' },
  { value: 'maquina', label: 'Máquina' },
  { value: 'material', label: 'Material' },
  { value: 'metodo', label: 'Método' },
  { value: 'meio_ambiente', label: 'Meio Ambiente' },
  { value: 'medicao', label: 'Medição' }
]

const actionTypes = [
  { value: 'imediata', label: 'Ação Imediata' },
  { value: 'corretiva', label: 'Ação Corretiva' },
  { value: 'preventiva', label: 'Ação Preventiva' }
]

const actionStatuses = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'atrasada', label: 'Atrasada' }
]

export function Form8DDetails({ formId, onClose, onUpdate }: Form8DDetailsProps) {
  const [formData, setFormData] = useState<Form8DData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Ishikawa states
  const [newIshikawa, setNewIshikawa] = useState({
    category: '',
    cause_description: '',
    subcause_description: '',
    impact_level: 3
  })
  
  // 5 Whys states
  const [fiveWhys, setFiveWhys] = useState<Partial<FiveWhysAnalysis>>({
    problem_statement: '',
    why_1: '',
    why_2: '',
    why_3: '',
    why_4: '',
    why_5: '',
    root_cause: ''
  })
  
  // Action Plan states
  const [newActionPlan, setNewActionPlan] = useState({
    action_type: '',
    action_description: '',
    responsible_person: '',
    due_date: '',
    verification_method: '',
    comments: ''
  })

  useEffect(() => {
    loadFormData()
  }, [formId])

  const loadFormData = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/forms-8d/${formId}`)
      setFormData(response)
      
      // Initialize 5 Whys if exists
      if (response.five_whys_analysis) {
        setFiveWhys(response.five_whys_analysis)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do formulário')
    } finally {
      setLoading(false)
    }
  }

  const addIshikawaItem = async () => {
    if (!newIshikawa.category || !newIshikawa.cause_description) {
      toast.error('Preencha categoria e descrição da causa')
      return
    }

    try {
      await apiRequest(`/forms-8d/${formId}/ishikawa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIshikawa)
      })
      
      setNewIshikawa({
        category: '',
        cause_description: '',
        subcause_description: '',
        impact_level: 3
      })
      
      loadFormData()
      toast.success('Item adicionado ao diagrama Ishikawa')
    } catch (error) {
      toast.error('Erro ao adicionar item Ishikawa')
    }
  }

  const deleteIshikawaItem = async (itemId: number) => {
    try {
      await apiRequest(`/ishikawa/${itemId}`, { method: 'DELETE' })
      loadFormData()
      toast.success('Item removido do diagrama Ishikawa')
    } catch (error) {
      toast.error('Erro ao remover item Ishikawa')
    }
  }

  const saveFiveWhys = async () => {
    if (!fiveWhys.problem_statement) {
      toast.error('Preencha a declaração do problema')
      return
    }

    try {
      await apiRequest(`/forms-8d/${formId}/five-whys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fiveWhys)
      })
      
      loadFormData()
      toast.success('Análise 5 Porquês salva com sucesso')
    } catch (error) {
      toast.error('Erro ao salvar análise 5 Porquês')
    }
  }

  const addActionPlan = async () => {
    if (!newActionPlan.action_type || !newActionPlan.action_description || 
        !newActionPlan.responsible_person || !newActionPlan.due_date) {
      toast.error('Preencha todos os campos obrigatórios do plano de ação')
      return
    }

    try {
      await apiRequest(`/forms-8d/${formId}/action-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActionPlan)
      })
      
      setNewActionPlan({
        action_type: '',
        action_description: '',
        responsible_person: '',
        due_date: '',
        verification_method: '',
        comments: ''
      })
      
      loadFormData()
      toast.success('Plano de ação adicionado com sucesso')
    } catch (error) {
      toast.error('Erro ao adicionar plano de ação')
    }
  }

  const updateActionPlan = async (planId: number, updates: Partial<ActionPlan>) => {
    try {
      await apiRequest(`/action-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      loadFormData()
      toast.success('Plano de ação atualizado com sucesso')
    } catch (error) {
      toast.error('Erro ao atualizar plano de ação')
    }
  }

  const deleteActionPlan = async (planId: number) => {
    try {
      await apiRequest(`/action-plans/${planId}`, { method: 'DELETE' })
      loadFormData()
      toast.success('Plano de ação removido com sucesso')
    } catch (error) {
      toast.error('Erro ao remover plano de ação')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getCategoryLabel = (category: string) => {
    return ishikawaCategories.find(c => c.value === category)?.label || category
  }

  const getActionTypeLabel = (type: string) => {
    return actionTypes.find(t => t.value === type)?.label || type
  }

  const getActionStatusLabel = (status: string) => {
    return actionStatuses.find(s => s.value === status)?.label || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Formulário não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{formData.title}</h2>
          <p className="text-gray-600">Formulário 8D #{formData.id}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="ishikawa">Ishikawa</TabsTrigger>
          <TabsTrigger value="five-whys">5 Porquês</TabsTrigger>
          <TabsTrigger value="action-plans">Planos de Ação</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Problema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Descrição do Problema</Label>
                  <p className="text-sm text-gray-700 mt-1">{formData.problem_description}</p>
                </div>
                <div>
                  <Label>Impacto no Cliente</Label>
                  <p className="text-sm text-gray-700 mt-1">{formData.customer_impact || 'Não informado'}</p>
                </div>
                <div>
                  <Label>Data do Problema</Label>
                  <p className="text-sm text-gray-700 mt-1">{formatDate(formData.problem_date)}</p>
                </div>
                <div>
                  <Label>Data de Detecção</Label>
                  <p className="text-sm text-gray-700 mt-1">
                    {formData.detection_date ? formatDate(formData.detection_date) : 'Não informado'}
                  </p>
                </div>
                <div>
                  <Label>Severidade</Label>
                  <Badge className="mt-1">{formData.severity_level}</Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className="mt-1">{formData.status}</Badge>
                </div>
              </div>
              
              {formData.team_members && formData.team_members.length > 0 && (
                <div>
                  <Label>Equipe do Projeto</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.team_members.map((member, index) => (
                      <Badge key={index} variant="secondary">{member}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ishikawa Tab */}
        <TabsContent value="ishikawa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagrama de Ishikawa (Espinha de Peixe)</CardTitle>
              <CardDescription>
                Identifique as possíveis causas do problema organizadas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new Ishikawa item */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                <Select value={newIshikawa.category} onValueChange={(value) => setNewIshikawa({...newIshikawa, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {ishikawaCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Descrição da causa"
                  value={newIshikawa.cause_description}
                  onChange={(e) => setNewIshikawa({...newIshikawa, cause_description: e.target.value})}
                />
                
                <Input
                  placeholder="Subcausa (opcional)"
                  value={newIshikawa.subcause_description}
                  onChange={(e) => setNewIshikawa({...newIshikawa, subcause_description: e.target.value})}
                />
                
                <div className="flex gap-2">
                  <Select value={newIshikawa.impact_level.toString()} onValueChange={(value) => setNewIshikawa({...newIshikawa, impact_level: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Impacto 1</SelectItem>
                      <SelectItem value="2">Impacto 2</SelectItem>
                      <SelectItem value="3">Impacto 3</SelectItem>
                      <SelectItem value="4">Impacto 4</SelectItem>
                      <SelectItem value="5">Impacto 5</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addIshikawaItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Ishikawa items by category */}
              {ishikawaCategories.map((category) => {
                const items = formData.ishikawa_analysis.filter(item => item.category === category.value)
                if (items.length === 0) return null
                
                return (
                  <div key={category.value}>
                    <h4 className="font-semibold text-lg mb-2">{category.label}</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.cause_description}</p>
                            {item.subcause_description && (
                              <p className="text-sm text-gray-600">{item.subcause_description}</p>
                            )}
                            <Badge variant="outline" className="mt-1">
                              Impacto: {item.impact_level}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteIshikawaItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Five Whys Tab */}
        <TabsContent value="five-whys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise dos 5 Porquês</CardTitle>
              <CardDescription>
                Identifique a causa raiz através da técnica dos 5 porquês
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="problem_statement">Declaração do Problema</Label>
                <Textarea
                  id="problem_statement"
                  value={fiveWhys.problem_statement || ''}
                  onChange={(e) => setFiveWhys({...fiveWhys, problem_statement: e.target.value})}
                  placeholder="Descreva claramente o problema a ser analisado..."
                />
              </div>
              
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num}>
                  <Label htmlFor={`why_${num}`}>Por que {num}?</Label>
                  <Textarea
                    id={`why_${num}`}
                    value={fiveWhys[`why_${num}` as keyof FiveWhysAnalysis] as string || ''}
                    onChange={(e) => setFiveWhys({...fiveWhys, [`why_${num}`]: e.target.value})}
                    placeholder={`Responda ao ${num}º porquê...`}
                  />
                </div>
              ))}
              
              <div>
                <Label htmlFor="root_cause">Causa Raiz Identificada</Label>
                <Textarea
                  id="root_cause"
                  value={fiveWhys.root_cause || ''}
                  onChange={(e) => setFiveWhys({...fiveWhys, root_cause: e.target.value})}
                  placeholder="Com base na análise, qual é a causa raiz do problema?"
                />
              </div>
              
              <Button onClick={saveFiveWhys}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Análise 5 Porquês
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Plans Tab */}
        <TabsContent value="action-plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Ação</CardTitle>
              <CardDescription>
                Defina ações imediatas, corretivas e preventivas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new action plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <Select value={newActionPlan.action_type} onValueChange={(value) => setNewActionPlan({...newActionPlan, action_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Responsável"
                  value={newActionPlan.responsible_person}
                  onChange={(e) => setNewActionPlan({...newActionPlan, responsible_person: e.target.value})}
                />
                
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição da ação"
                    value={newActionPlan.action_description}
                    onChange={(e) => setNewActionPlan({...newActionPlan, action_description: e.target.value})}
                  />
                </div>
                
                <Input
                  type="date"
                  value={newActionPlan.due_date}
                  onChange={(e) => setNewActionPlan({...newActionPlan, due_date: e.target.value})}
                />
                
                <Input
                  placeholder="Método de verificação"
                  value={newActionPlan.verification_method}
                  onChange={(e) => setNewActionPlan({...newActionPlan, verification_method: e.target.value})}
                />
                
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={addActionPlan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Plano de Ação
                  </Button>
                </div>
              </div>

              {/* Action plans list */}
              <div className="space-y-4">
                {formData.action_plans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge className="mb-2">{getActionTypeLabel(plan.action_type)}</Badge>
                        <h4 className="font-medium">{plan.action_description}</h4>
                        <p className="text-sm text-gray-600">Responsável: {plan.responsible_person}</p>
                        <p className="text-sm text-gray-600">Prazo: {formatDate(plan.due_date)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={plan.status}
                          onValueChange={(value) => updateActionPlan(plan.id, { status: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {actionStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteActionPlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {plan.verification_method && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Verificação:</strong> {plan.verification_method}
                      </p>
                    )}
                    
                    {plan.comments && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Comentários:</strong> {plan.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}