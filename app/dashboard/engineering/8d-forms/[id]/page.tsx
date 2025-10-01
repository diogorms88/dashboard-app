'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Save, X, CheckCircle, AlertTriangle, Users, Target, Search, Lightbulb, Shield, BarChart3, Trash2, Clock } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { IshikawaDiagram } from '@/components/ishikawa-diagram'

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
  disciplines?: Discipline8D[]
}

interface Discipline8D {
  id: number
  form_8d_id: number
  discipline_id: string
  status: 'pendente' | 'em_andamento' | 'concluida'
  content?: string
  responsible_person?: string
  completion_date?: string
  comments?: string
  created_at: string
  updated_at: string
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

const severityColors = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800'
}

const statusColors = {
  aberto: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800'
}

const disciplineIcons = {
  D1: Users,
  D2: AlertTriangle,
  D3: Shield,
  D4: Search,
  D5: Lightbulb,
  D6: Target,
  D7: Shield,
  D8: BarChart3
}

const disciplineTemplates = [
  { id: 'D1', title: 'D1 - Formar Equipe', description: 'Estabelecer uma equipe multidisciplinar' },
  { id: 'D2', title: 'D2 - Descrever Problema', description: 'Definir e quantificar o problema' },
  { id: 'D3', title: 'D3 - Ação Imediata', description: 'Implementar ações de contenção' },
  { id: 'D4', title: 'D4 - Causa Raiz', description: 'Identificar e verificar a causa raiz' },
  { id: 'D5', title: 'D5 - Ação Corretiva', description: 'Escolher e verificar ações corretivas' },
  { id: 'D6', title: 'D6 - Implementar', description: 'Implementar ações corretivas permanentes' },
  { id: 'D7', title: 'D7 - Prevenir', description: 'Prevenir recorrência do problema' },
  { id: 'D8', title: 'D8 - Reconhecer', description: 'Reconhecer a equipe e capturar lições' }
]

export default function Form8DDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState<Form8DData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [disciplines, setDisciplines] = useState<Discipline8D[]>([])
  const [editingDiscipline, setEditingDiscipline] = useState<string | null>(null)
  const [disciplineForm, setDisciplineForm] = useState({
    content: '',
    responsible_person: '',
    completion_date: '',
    comments: ''
  })

  // Função para obter data local correta
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formId = parseInt(params.id as string)

  useEffect(() => {
    if (formId) {
      loadFormData()
    }
  }, [formId])

  const loadFormData = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/forms-8d/${formId}`)
      setFormData(response)
      await loadDisciplines()
    } catch (error) {
      toast.error('Erro ao carregar dados do formulário')
    } finally {
      setLoading(false)
    }
  }

  const loadDisciplines = async () => {
    try {
      const response = await apiRequest(`/forms-8d/${formId}/disciplines`)
      setDisciplines(response)
    } catch (error) {
      // Silent error handling for disciplines loading
    }
  }

  const updateDiscipline = async (disciplineId: string, status: string, data?: Record<string, unknown>) => {
    try {
      await apiRequest(`/forms-8d/${formId}/disciplines/${disciplineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...data
        })
      })
      
      await loadDisciplines()
      toast.success(`Disciplina ${disciplineId} atualizada com sucesso`)
      setEditingDiscipline(null)
      setDisciplineForm({
        content: '',
        responsible_person: '',
        completion_date: '',
        comments: ''
      })
    } catch (error) {
      toast.error('Erro ao atualizar disciplina')
    }
  }

  const getDisciplineStatus = (disciplineId: string) => {
    // D1 e D2 são automaticamente concluídas se o formulário existe
    if (disciplineId === 'D1' || disciplineId === 'D2') {
      return formData ? 'concluida' : 'pendente'
    }
    
    // D4 é concluída automaticamente apenas se há análises completas
    if (disciplineId === 'D4') {
      const hasCompleteAnalysis = (formData?.ishikawa_analysis?.length > 0 && formData?.five_whys_analysis?.root_cause)
      if (hasCompleteAnalysis) return 'concluida'
      // Se há análises parciais, manter em andamento
      if (formData?.ishikawa_analysis?.length > 0 || formData?.five_whys_analysis) {
        return 'em_andamento'
      }
    }
    
    const discipline = disciplines.find(d => d.discipline_id === disciplineId)
    if (!discipline) return 'pendente'
    
    // Se já está concluída, manter como concluída
    if (discipline.status === 'concluida') return 'concluida'
    
    // Para disciplinas com data de conclusão definida, verificar status baseado na data
    if (discipline.completion_date && discipline.status === 'em_andamento') {
      const today = new Date()
      const dueDate = new Date(discipline.completion_date)
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      
      if (today > dueDate) {
        return 'atrasada'
      }
      // Se a data é futura ou hoje, manter como em_andamento (amarelo)
      return 'em_andamento'
    }
    
    return discipline.status || 'pendente'
  }

  const getDisciplineData = (disciplineId: string) => {
    return disciplines.find(d => d.discipline_id === disciplineId)
  }

  const startEditingDiscipline = (disciplineId: string) => {
    const discipline = getDisciplineData(disciplineId)
    if (discipline) {
      setDisciplineForm({
        content: discipline.content || '',
        responsible_person: discipline.responsible_person || '',
        completion_date: discipline.completion_date || '',
        comments: discipline.comments || ''
      })
    }
    setEditingDiscipline(disciplineId)
  }

  const updateStatus = async (newStatus: string) => {
    try {
      await apiRequest(`/forms-8d/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      loadFormData()
      toast.success(`Status atualizado para ${newStatus}`)
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const deleteForm = async () => {
    if (!confirm('Tem certeza que deseja excluir este formulário 8D? Esta ação não pode ser desfeita.')) {
      return
    }
    
    try {
      await apiRequest(`/forms-8d/${formId}`, {
        method: 'DELETE'
      })
      
      toast.success('Formulário 8D excluído com sucesso')
      router.push('/dashboard/engineering/8d-forms')
    } catch (error) {
      toast.error('Erro ao excluir formulário')
    }
  }

  const formatDate = (dateString: string) => {
    // Para datas no formato YYYY-MM-DD, usar horário local
    if (dateString.includes('-') && dateString.length === 10) {
      const [year, month, day] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('pt-BR')
    }
    // Para timestamps ISO (com horário), extrair apenas a parte da data
    if (dateString.includes('T') || dateString.includes('Z')) {
      const datePart = dateString.split('T')[0] // Pega apenas YYYY-MM-DD
      const [year, month, day] = datePart.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('pt-BR')
    }
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Formulário não encontrado</h1>
        <p className="text-gray-500 mb-4">O formulário 8D solicitado não foi encontrado.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{formData.title}</h1>
            <p className="text-gray-500">Formulário 8D #{formData.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={severityColors[formData.severity_level as keyof typeof severityColors]}>
            {formData.severity_level.toUpperCase()}
          </Badge>
          <Badge className={statusColors[formData.status as keyof typeof statusColors]}>
            {formData.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {formData.status !== 'concluido' && (
            <Button 
              onClick={() => updateStatus('concluido')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar 8D
            </Button>
          )}
          {user?.papel === 'admin' && (
            <Button 
              onClick={deleteForm}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir 8D
            </Button>
          )}
        </div>
      </div>

      {/* 8D Disciplines Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Disciplinas 8D - Progresso
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso através das 8 disciplinas do método 8D
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {disciplineTemplates.map((discipline) => {
              const Icon = disciplineIcons[discipline.id as keyof typeof disciplineIcons]
              const status = getDisciplineStatus(discipline.id)
              const isCompleted = status === 'concluida'
              const isInProgress = status === 'em_andamento'
              const isOverdue = status === 'atrasada'
              const disciplineData = getDisciplineData(discipline.id)
              
              return (
                <div 
                  key={discipline.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                    isCompleted 
                      ? 'border-green-200 bg-green-50' 
                      : isOverdue
                      ? 'border-red-200 bg-red-50'
                      : isInProgress
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-200'
                  }`}
                  onClick={() => setActiveTab(discipline.id.toLowerCase())}
                >
                  <div className="flex items-center mb-2">
                    <Icon className={`h-5 w-5 mr-2 ${
                      isCompleted ? 'text-green-600' : isOverdue ? 'text-red-600' : isInProgress ? 'text-yellow-600' : 'text-gray-400'
                    }`} />
                    <span className="font-semibold text-sm">{discipline.id}</span>
                    {isCompleted && (
                      <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                    )}
                    {isOverdue && (
                      <AlertTriangle className="h-4 w-4 ml-auto text-red-600" />
                    )}
                    {isInProgress && (
                      <Clock className="h-4 w-4 ml-auto text-yellow-600" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm mb-1">{discipline.title}</h4>
                  <p className="text-xs text-gray-600 mb-2">{discipline.description}</p>
                  
                  {disciplineData && (
                    <div className="text-xs text-gray-500">
                      {disciplineData.responsible_person && (
                        <p>Responsável: {disciplineData.responsible_person}</p>
                      )}
                      {disciplineData.completion_date && (
                        <p>Concluído: {formatDate(disciplineData.completion_date)}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2">
                    {/* Informações específicas para D1 e D2 */}
                    {['D1', 'D2'].includes(discipline.id) && status === 'concluida' && formData && (
                      <div className="text-xs text-gray-600">
                        <p>Responsável: {formData.assigned_to_name || formData.created_by_name}</p>
                        <p>Concluído: {formatDate(formData.created_at)}</p>
                      </div>
                    )}
                    {/* Badge para D4 */}
                    {discipline.id === 'D4' && status === 'concluida' && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Automático
                      </Badge>
                    )}
                    {/* Informações para D3, D5-D8 */}
                     {['D3', 'D5', 'D6', 'D7', 'D8'].includes(discipline.id) && (
                       <div className="text-xs">
                         {status === 'pendente' && (
                           <p className="text-gray-500">Clique na aba {discipline.id} para iniciar</p>
                         )}
                         {status === 'em_andamento' && (
                           <p className="text-yellow-600">Em andamento</p>
                         )}
                         {status === 'atrasada' && (
                           <p className="text-red-600">Atrasada - Prazo vencido</p>
                         )}
                         {status === 'concluida' && (
                           <p className="text-green-600">Concluída</p>
                         )}
                       </div>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8 text-xs">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="d3">D3 - Contenção</TabsTrigger>
          <TabsTrigger value="d4">D4 - Causa Raiz</TabsTrigger>
          <TabsTrigger value="d5">D5 - Corretivas</TabsTrigger>
          <TabsTrigger value="d6">D6 - Implementar</TabsTrigger>
          <TabsTrigger value="d7">D7 - Prevenir</TabsTrigger>
          <TabsTrigger value="d8">D8 - Reconhecer</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrição do Problema</Label>
                  <p className="mt-1">{formData.problem_description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data do Problema</Label>
                    <p className="mt-1">{formatDate(formData.problem_date)}</p>
                  </div>
                  {formData.detection_date && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data de Detecção</Label>
                      <p className="mt-1">{formatDate(formData.detection_date)}</p>
                    </div>
                  )}
                </div>
                {formData.customer_impact && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Impacto no Cliente</Label>
                    <p className="mt-1">{formData.customer_impact}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipe e Responsabilidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado por</Label>
                  <p className="mt-1">{formData.created_by_name}</p>
                </div>
                {formData.assigned_to_name && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                    <p className="mt-1">{formData.assigned_to_name}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Membros da Equipe</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.team_members.map((member, index) => (
                      <Badge key={index} variant="secondary">{member}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="mt-1">{formatDate(formData.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="d3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                D3 - Ações Imediatas de Contenção
              </CardTitle>
              <CardDescription>
                Implementar ações imediatas para conter o problema e proteger o cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingDiscipline === 'D3' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Ações de Contenção Implementadas</Label>
                    <Textarea 
                      value={disciplineForm.content}
                      onChange={(e) => setDisciplineForm({...disciplineForm, content: e.target.value})}
                      placeholder="Descreva as ações imediatas implementadas para conter o problema..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Responsável</Label>
                      <Input 
                        value={disciplineForm.responsible_person}
                        onChange={(e) => setDisciplineForm({...disciplineForm, responsible_person: e.target.value})}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div>
                      <Label>Data de Implementação</Label>
                      <Input 
                        type="date"
                        value={disciplineForm.completion_date}
                        onChange={(e) => setDisciplineForm({...disciplineForm, completion_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Comentários Adicionais</Label>
                    <Textarea 
                      value={disciplineForm.comments}
                      onChange={(e) => setDisciplineForm({...disciplineForm, comments: e.target.value})}
                      placeholder="Observações sobre a eficácia das ações..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateDiscipline('D3', 'em_andamento', disciplineForm)}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingDiscipline(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getDisciplineData('D3') ? (
                    <div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium mb-2">Ações Implementadas:</h4>
                        <p className="mb-4">{getDisciplineData('D3')?.content}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Responsável:</Label>
                            <p>{getDisciplineData('D3')?.responsible_person}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Data de Implementação:</Label>
                            <p>{getDisciplineData('D3')?.completion_date ? formatDate(getDisciplineData('D3')!.completion_date!) : 'Não informado'}</p>
                          </div>
                        </div>
                        {getDisciplineData('D3')?.comments && (
                          <div className="mt-4">
                            <Label className="text-gray-500">Comentários:</Label>
                            <p className="text-sm">{getDisciplineData('D3')?.comments}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => startEditingDiscipline('D3')}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar D3
                        </Button>
                        {getDisciplineStatus('D3') === 'em_andamento' && (
                          <Button 
                            onClick={() => updateDiscipline('D3', 'concluida', { completion_date: getTodayDate() })}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Concluir Ação
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">D3 ainda não foi iniciado</p>
                      <Button onClick={() => updateDiscipline('D3', 'em_andamento')} className="mt-4">
                        <Shield className="h-4 w-4 mr-2" />
                        Iniciar D3 - Ações de Contenção
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="d4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  D4 - Identificar e Verificar Causa Raiz
                </CardTitle>
                <CardDescription>
                  Análise sistemática para identificar a verdadeira causa raiz do problema
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Diagrama Ishikawa Interativo */}
            <IshikawaDiagram 
              formId={formId} 
              ishikawaData={formData.ishikawa_analysis}
              problemDescription={formData.problem_description}
              fiveWhysData={formData.five_whys_analysis}
              onUpdate={loadFormData}
            />

            {/* 5 Whys Analysis */}
            {formData.five_whys_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise dos 5 Porquês</CardTitle>
                  <CardDescription>
                    Investigação profunda para identificar a causa raiz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium">Declaração do Problema</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded">{formData.five_whys_analysis.problem_statement}</p>
                    </div>
                    
                    {[1, 2, 3, 4, 5].map((num) => {
                      const whyKey = `why_${num}` as keyof FiveWhysAnalysis
                      const whyValue = formData.five_whys_analysis?.[whyKey] as string
                      
                      return whyValue ? (
                        <div key={num}>
                          <Label className="font-medium">Por que {num}?</Label>
                          <p className="mt-1 p-3 bg-blue-50 rounded">{whyValue}</p>
                        </div>
                      ) : null
                    })}
                    
                    {formData.five_whys_analysis.root_cause && (
                      <div>
                        <Label className="font-medium text-red-600">Causa Raiz Identificada</Label>
                        <p className="mt-1 p-3 bg-red-50 border border-red-200 rounded font-medium">
                          {formData.five_whys_analysis.root_cause}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* D4 Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-blue-900">Status da Disciplina D4</h4>
                    <p className="text-sm text-blue-700">
                      {formData.ishikawa_analysis.length > 0 
                        ? `${formData.ishikawa_analysis.length} causa(s) identificada(s) no diagrama Ishikawa` 
                        : 'Inicie a análise adicionando causas no diagrama Ishikawa'
                      }
                    </p>
                  </div>
                  <Badge className={getDisciplineStatus('D4') === 'concluida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {getDisciplineStatus('D4')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="d5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                D5 - Escolher e Verificar Ações Corretivas
              </CardTitle>
              <CardDescription>
                Definir ações corretivas permanentes para eliminar a causa raiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingDiscipline === 'D5' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Ações Corretivas Propostas</Label>
                    <Textarea 
                      value={disciplineForm.content}
                      onChange={(e) => setDisciplineForm({...disciplineForm, content: e.target.value})}
                      placeholder="Descreva as ações corretivas permanentes para eliminar a causa raiz..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Responsável pela Implementação</Label>
                      <Input 
                        value={disciplineForm.responsible_person}
                        onChange={(e) => setDisciplineForm({...disciplineForm, responsible_person: e.target.value})}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div>
                      <Label>Data Prevista</Label>
                      <Input 
                        type="date"
                        value={disciplineForm.completion_date}
                        onChange={(e) => setDisciplineForm({...disciplineForm, completion_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Método de Verificação</Label>
                    <Textarea 
                      value={disciplineForm.comments}
                      onChange={(e) => setDisciplineForm({...disciplineForm, comments: e.target.value})}
                      placeholder="Como será verificada a eficácia das ações corretivas?"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateDiscipline('D5', 'em_andamento', disciplineForm)}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingDiscipline(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getDisciplineData('D5') ? (
                    <div>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium mb-2">Ações Corretivas Definidas:</h4>
                        <p className="mb-4">{getDisciplineData('D5')?.content}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Responsável:</Label>
                            <p>{getDisciplineData('D5')?.responsible_person}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Data Prevista:</Label>
                            <p>{getDisciplineData('D5')?.completion_date ? formatDate(getDisciplineData('D5')!.completion_date!) : 'Não informado'}</p>
                          </div>
                        </div>
                        {getDisciplineData('D5')?.comments && (
                          <div className="mt-4">
                            <Label className="text-gray-500">Método de Verificação:</Label>
                            <p className="text-sm">{getDisciplineData('D5')?.comments}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                         <Button onClick={() => startEditingDiscipline('D5')}>
                           <Edit className="h-4 w-4 mr-2" />
                           Editar D5
                         </Button>
                         {getDisciplineStatus('D5') === 'em_andamento' && (
                           <Button 
                             onClick={() => updateDiscipline('D5', 'concluida', { completion_date: getTodayDate() })}
                             className="bg-green-600 hover:bg-green-700 text-white"
                           >
                             <CheckCircle className="h-4 w-4 mr-2" />
                             Concluir Ação
                           </Button>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">D5 ainda não foi iniciado</p>
                      <Button onClick={() => updateDiscipline('D5', 'em_andamento')} className="mt-4">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Iniciar D5 - Ações Corretivas
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="space-y-6">
            {/* Ishikawa Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>D4 - Análise de Causa Raiz (Ishikawa)</CardTitle>
                <CardDescription>
                  Identificação sistemática das possíveis causas do problema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.ishikawa_analysis.length > 0 ? (
                  <div className="space-y-4">
                    {formData.ishikawa_analysis.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{item.category}</Badge>
                          <span className="text-sm text-gray-500">Impacto: {item.impact_level}/5</span>
                        </div>
                        <p className="font-medium">{item.cause_description}</p>
                        {item.subcause_description && (
                          <p className="text-sm text-gray-600 mt-1">{item.subcause_description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhuma análise Ishikawa registrada</p>
                )}
              </CardContent>
            </Card>

            {/* 5 Whys Analysis */}
            {formData.five_whys_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>D4 - Análise dos 5 Porquês</CardTitle>
                  <CardDescription>
                    Investigação profunda para identificar a causa raiz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium">Declaração do Problema</Label>
                      <p className="mt-1 p-3 bg-gray-50 rounded">{formData.five_whys_analysis.problem_statement}</p>
                    </div>
                    
                    {[1, 2, 3, 4, 5].map((num) => {
                      const whyKey = `why_${num}` as keyof FiveWhysAnalysis
                      const whyValue = formData.five_whys_analysis?.[whyKey] as string
                      
                      return whyValue ? (
                        <div key={num}>
                          <Label className="font-medium">Por que {num}?</Label>
                          <p className="mt-1 p-3 bg-blue-50 rounded">{whyValue}</p>
                        </div>
                      ) : null
                    })}
                    
                    {formData.five_whys_analysis.root_cause && (
                      <div>
                        <Label className="font-medium text-red-600">Causa Raiz Identificada</Label>
                        <p className="mt-1 p-3 bg-red-50 border border-red-200 rounded font-medium">
                          {formData.five_whys_analysis.root_cause}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="d6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                D6 - Implementar e Validar Ações Corretivas
              </CardTitle>
              <CardDescription>
                Implementar as ações corretivas permanentes e validar sua eficácia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingDiscipline === 'D6' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Status da Implementação</Label>
                    <Textarea 
                      value={disciplineForm.content}
                      onChange={(e) => setDisciplineForm({...disciplineForm, content: e.target.value})}
                      placeholder="Descreva o progresso da implementação das ações corretivas..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Responsável pela Validação</Label>
                      <Input 
                        value={disciplineForm.responsible_person}
                        onChange={(e) => setDisciplineForm({...disciplineForm, responsible_person: e.target.value})}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div>
                      <Label>Data de Conclusão</Label>
                      <Input 
                        type="date"
                        value={disciplineForm.completion_date}
                        onChange={(e) => setDisciplineForm({...disciplineForm, completion_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Resultados da Validação</Label>
                    <Textarea 
                      value={disciplineForm.comments}
                      onChange={(e) => setDisciplineForm({...disciplineForm, comments: e.target.value})}
                      placeholder="Resultados dos testes e validações realizadas..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateDiscipline('D6', 'em_andamento', disciplineForm)}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingDiscipline(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getDisciplineData('D6') ? (
                    <div>
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium mb-2">Implementação Realizada:</h4>
                        <p className="mb-4">{getDisciplineData('D6')?.content}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Responsável:</Label>
                            <p>{getDisciplineData('D6')?.responsible_person}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Data de Conclusão:</Label>
                            <p>{getDisciplineData('D6')?.completion_date ? formatDate(getDisciplineData('D6')!.completion_date!) : 'Não informado'}</p>
                          </div>
                        </div>
                        {getDisciplineData('D6')?.comments && (
                          <div className="mt-4">
                            <Label className="text-gray-500">Resultados da Validação:</Label>
                            <p className="text-sm">{getDisciplineData('D6')?.comments}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                         <Button onClick={() => startEditingDiscipline('D6')}>
                           <Edit className="h-4 w-4 mr-2" />
                           Editar D6
                         </Button>
                         {getDisciplineStatus('D6') === 'em_andamento' && (
                           <Button 
                             onClick={() => updateDiscipline('D6', 'concluida', { completion_date: getTodayDate() })}
                             className="bg-green-600 hover:bg-green-700 text-white"
                           >
                             <CheckCircle className="h-4 w-4 mr-2" />
                             Concluir Ação
                           </Button>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">D6 ainda não foi iniciado</p>
                      <Button onClick={() => updateDiscipline('D6', 'em_andamento')} className="mt-4">
                        <Target className="h-4 w-4 mr-2" />
                        Iniciar D6 - Implementação
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="d7">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                D7 - Prevenir Recorrência
              </CardTitle>
              <CardDescription>
                Implementar medidas para prevenir a recorrência do problema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingDiscipline === 'D7' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Medidas Preventivas</Label>
                    <Textarea 
                      value={disciplineForm.content}
                      onChange={(e) => setDisciplineForm({...disciplineForm, content: e.target.value})}
                      placeholder="Descreva as medidas implementadas para prevenir a recorrência..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Responsável pelas Medidas</Label>
                      <Input 
                        value={disciplineForm.responsible_person}
                        onChange={(e) => setDisciplineForm({...disciplineForm, responsible_person: e.target.value})}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div>
                      <Label>Data de Implementação</Label>
                      <Input 
                        type="date"
                        value={disciplineForm.completion_date}
                        onChange={(e) => setDisciplineForm({...disciplineForm, completion_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Sistemas de Monitoramento</Label>
                    <Textarea 
                      value={disciplineForm.comments}
                      onChange={(e) => setDisciplineForm({...disciplineForm, comments: e.target.value})}
                      placeholder="Como será monitorada a eficácia das medidas preventivas?"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateDiscipline('D7', 'em_andamento', disciplineForm)}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingDiscipline(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getDisciplineData('D7') ? (
                    <div>
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h4 className="font-medium mb-2">Medidas Preventivas:</h4>
                        <p className="mb-4">{getDisciplineData('D7')?.content}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Responsável:</Label>
                            <p>{getDisciplineData('D7')?.responsible_person}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Data de Implementação:</Label>
                            <p>{getDisciplineData('D7')?.completion_date ? formatDate(getDisciplineData('D7')!.completion_date!) : 'Não informado'}</p>
                          </div>
                        </div>
                        {getDisciplineData('D7')?.comments && (
                          <div className="mt-4">
                            <Label className="text-gray-500">Sistemas de Monitoramento:</Label>
                            <p className="text-sm">{getDisciplineData('D7')?.comments}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                         <Button onClick={() => startEditingDiscipline('D7')}>
                           <Edit className="h-4 w-4 mr-2" />
                           Editar D7
                         </Button>
                         {getDisciplineStatus('D7') === 'em_andamento' && (
                           <Button 
                             onClick={() => updateDiscipline('D7', 'concluida', { completion_date: getTodayDate() })}
                             className="bg-green-600 hover:bg-green-700 text-white"
                           >
                             <CheckCircle className="h-4 w-4 mr-2" />
                             Concluir Ação
                           </Button>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">D7 ainda não foi iniciado</p>
                      <Button onClick={() => updateDiscipline('D7', 'em_andamento')} className="mt-4">
                        <Shield className="h-4 w-4 mr-2" />
                        Iniciar D7 - Prevenção
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="d8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                D8 - Reconhecer a Equipe e Capturar Lições
              </CardTitle>
              <CardDescription>
                Reconhecer o trabalho da equipe e documentar lições aprendidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingDiscipline === 'D8' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Lições Aprendidas</Label>
                    <Textarea 
                      value={disciplineForm.content}
                      onChange={(e) => setDisciplineForm({...disciplineForm, content: e.target.value})}
                      placeholder="Documente as principais lições aprendidas durante o processo 8D..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Responsável pela Documentação</Label>
                      <Input 
                        value={disciplineForm.responsible_person}
                        onChange={(e) => setDisciplineForm({...disciplineForm, responsible_person: e.target.value})}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div>
                      <Label>Data de Conclusão</Label>
                      <Input 
                        type="date"
                        value={disciplineForm.completion_date}
                        onChange={(e) => setDisciplineForm({...disciplineForm, completion_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Reconhecimento da Equipe</Label>
                    <Textarea 
                      value={disciplineForm.comments}
                      onChange={(e) => setDisciplineForm({...disciplineForm, comments: e.target.value})}
                      placeholder="Como a equipe foi reconhecida pelo trabalho realizado?"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => updateDiscipline('D8', 'em_andamento', disciplineForm)}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingDiscipline(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getDisciplineData('D8') ? (
                    <div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium mb-2">Lições Aprendidas:</h4>
                        <p className="mb-4">{getDisciplineData('D8')?.content}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Responsável:</Label>
                            <p>{getDisciplineData('D8')?.responsible_person}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Data de Conclusão:</Label>
                            <p>{getDisciplineData('D8')?.completion_date ? formatDate(getDisciplineData('D8')!.completion_date!) : 'Não informado'}</p>
                          </div>
                        </div>
                        {getDisciplineData('D8')?.comments && (
                          <div className="mt-4">
                            <Label className="text-gray-500">Reconhecimento da Equipe:</Label>
                            <p className="text-sm">{getDisciplineData('D8')?.comments}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                         <Button onClick={() => startEditingDiscipline('D8')}>
                           <Edit className="h-4 w-4 mr-2" />
                           Editar D8
                         </Button>
                         {getDisciplineStatus('D8') === 'em_andamento' && (
                           <Button 
                             onClick={() => updateDiscipline('D8', 'concluida', { completion_date: getTodayDate() })}
                             className="bg-green-600 hover:bg-green-700 text-white"
                           >
                             <CheckCircle className="h-4 w-4 mr-2" />
                             Concluir Ação
                           </Button>
                         )}
                       </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">D8 ainda não foi iniciado</p>
                      <Button onClick={() => updateDiscipline('D8', 'em_andamento')} className="mt-4">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Iniciar D8 - Reconhecimento
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>D5/D6 - Planos de Ação</CardTitle>
              <CardDescription>
                Ações corretivas e preventivas para resolver o problema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formData.action_plans.length > 0 ? (
                <div className="space-y-4">
                  {formData.action_plans.map((plan) => (
                    <div key={plan.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{plan.action_type}</Badge>
                          <Badge className={plan.status === 'concluida' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {plan.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">Prazo: {formatDate(plan.due_date)}</span>
                      </div>
                      
                      <h4 className="font-medium mb-2">{plan.action_description}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-500">Responsável</Label>
                          <p>{plan.responsible_person}</p>
                        </div>
                        {plan.completion_date && (
                          <div>
                            <Label className="text-gray-500">Data de Conclusão</Label>
                            <p>{formatDate(plan.completion_date)}</p>
                          </div>
                        )}
                      </div>
                      
                      {plan.verification_method && (
                        <div className="mt-3">
                          <Label className="text-gray-500">Método de Verificação</Label>
                          <p className="text-sm">{plan.verification_method}</p>
                        </div>
                      )}
                      
                      {plan.comments && (
                        <div className="mt-3">
                          <Label className="text-gray-500">Comentários</Label>
                          <p className="text-sm">{plan.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum plano de ação registrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>D8 - Timeline do Processo 8D</CardTitle>
              <CardDescription>
                Histórico e progresso através das disciplinas 8D
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">D1 - Equipe Formada</p>
                    <p className="text-sm text-gray-600">Equipe multidisciplinar estabelecida</p>
                    <p className="text-xs text-gray-500">{formatDate(formData.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">D2 - Problema Descrito</p>
                    <p className="text-sm text-gray-600">Problema definido e quantificado</p>
                    <p className="text-xs text-gray-500">{formatDate(formData.created_at)}</p>
                  </div>
                </div>
                
                {formData.ishikawa_analysis.length > 0 && (
                  <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">D4 - Análise de Causa Raiz</p>
                      <p className="text-sm text-gray-600">Análise Ishikawa realizada</p>
                    </div>
                  </div>
                )}
                
                {formData.action_plans.length > 0 && (
                  <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">D5/D6 - Ações Definidas</p>
                      <p className="text-sm text-gray-600">{formData.action_plans.length} plano(s) de ação criado(s)</p>
                    </div>
                  </div>
                )}
                
                {formData.status === 'concluido' && (
                  <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">D8 - Processo Concluído</p>
                      <p className="text-sm text-gray-600">Formulário 8D finalizado com sucesso</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}