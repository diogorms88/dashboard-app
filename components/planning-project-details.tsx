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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Edit, Save, X, Calendar, Clock, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface ProjectData {
  id: number
  title: string
  description?: string
  project_type: string
  priority: string
  status: string
  start_date: string
  end_date: string
  actual_start_date?: string
  actual_end_date?: string
  progress_percentage: number
  budget?: number
  actual_cost?: number
  responsible_person: string
  team_members: string[]
  created_by_name: string
  created_at: string
  tasks: Task[]
  milestones: Milestone[]
  timeline: TimelineEvent[]
}

interface Task {
  id: number
  task_name: string
  description?: string
  assigned_to: string
  priority: string
  status: string
  start_date: string
  end_date: string
  actual_start_date?: string
  actual_end_date?: string
  progress_percentage: number
  dependencies: number[]
  estimated_hours?: number
  actual_hours?: number
}

interface Milestone {
  id: number
  milestone_name: string
  description?: string
  target_date: string
  actual_date?: string
  status: string
  completion_criteria?: string
}

interface TimelineEvent {
  id: number
  event_type: string
  event_title: string
  event_description?: string
  event_date: string
  progress_before?: number
  progress_after?: number
  created_by_name: string
  attachments: string[]
}

interface PlanningProjectDetailsProps {
  projectId: number
  onClose: () => void
  onUpdate: () => void
}

const taskStatuses = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'bloqueada', label: 'Bloqueada' }
]

const milestoneStatuses = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'atrasado', label: 'Atrasado' }
]

const eventTypes = [
  { value: 'comentario', label: 'Comentário' },
  { value: 'progresso', label: 'Atualização de Progresso' },
  { value: 'marco', label: 'Marco Atingido' },
  { value: 'inicio', label: 'Início de Atividade' },
  { value: 'conclusao', label: 'Conclusão' },
  { value: 'pausa', label: 'Pausa' }
]

const eventIcons = {
  criacao: Calendar,
  inicio: Clock,
  progresso: CheckCircle,
  marco: CheckCircle,
  conclusao: CheckCircle,
  pausa: AlertTriangle,
  cancelamento: AlertTriangle,
  comentario: MessageSquare
}

export function PlanningProjectDetails({ projectId, onClose, onUpdate }: PlanningProjectDetailsProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Task states
  const [newTask, setNewTask] = useState({
    task_name: '',
    description: '',
    assigned_to: '',
    priority: 'media',
    start_date: '',
    end_date: '',
    estimated_hours: ''
  })
  
  // Milestone states
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    description: '',
    target_date: '',
    completion_criteria: ''
  })
  
  // Timeline event states
  const [newTimelineEvent, setNewTimelineEvent] = useState({
    event_type: 'comentario',
    event_title: '',
    event_description: ''
  })

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/planning-projects/${projectId}`)
      setProjectData(response)
    } catch (error) {

      toast.error('Erro ao carregar dados do projeto')
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!newTask.task_name || !newTask.assigned_to || !newTask.start_date || !newTask.end_date) {
      toast.error('Preencha todos os campos obrigatórios da tarefa')
      return
    }

    try {
      await apiRequest(`/planning-projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null
        })
      })
      
      setNewTask({
        task_name: '',
        description: '',
        assigned_to: '',
        priority: 'media',
        start_date: '',
        end_date: '',
        estimated_hours: ''
      })
      
      loadProjectData()
      toast.success('Tarefa adicionada com sucesso')
    } catch (error) {

      toast.error('Erro ao adicionar tarefa')
    }
  }

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      await apiRequest(`/planning-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      loadProjectData()
      toast.success('Tarefa atualizada com sucesso')
    } catch (error) {

      toast.error('Erro ao atualizar tarefa')
    }
  }

  const deleteTask = async (taskId: number) => {
    try {
      await apiRequest(`/planning-tasks/${taskId}`, { method: 'DELETE' })
      loadProjectData()
      toast.success('Tarefa removida com sucesso')
    } catch (error) {

      toast.error('Erro ao remover tarefa')
    }
  }

  const addMilestone = async () => {
    if (!newMilestone.milestone_name || !newMilestone.target_date) {
      toast.error('Preencha nome e data alvo do marco')
      return
    }

    try {
      await apiRequest(`/planning-projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone)
      })
      
      setNewMilestone({
        milestone_name: '',
        description: '',
        target_date: '',
        completion_criteria: ''
      })
      
      loadProjectData()
      toast.success('Marco adicionado com sucesso')
    } catch (error) {

      toast.error('Erro ao adicionar marco')
    }
  }

  const updateMilestone = async (milestoneId: number, updates: Partial<Milestone>) => {
    try {
      await apiRequest(`/api/planning-milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      loadProjectData()
      toast.success('Marco atualizado com sucesso')
    } catch (error) {

      toast.error('Erro ao atualizar marco')
    }
  }

  const addTimelineEvent = async () => {
    if (!newTimelineEvent.event_title) {
      toast.error('Preencha o título do evento')
      return
    }

    try {
      await apiRequest(`/api/planning-projects/${projectId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTimelineEvent)
      })
      
      setNewTimelineEvent({
        event_type: 'comentario',
        event_title: '',
        event_description: ''
      })
      
      loadProjectData()
      toast.success('Evento adicionado à timeline')
    } catch (error) {

      toast.error('Erro ao adicionar evento à timeline')
    }
  }

  const updateProjectProgress = async (newProgress: number) => {
    if (!projectData) return
    
    try {
      await apiRequest(`/api/planning-projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          progress_percentage: newProgress
        })
      })
      
      loadProjectData()
      onUpdate()
      toast.success('Progresso atualizado com sucesso')
    } catch (error) {

      toast.error('Erro ao atualizar progresso')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pendente: 'bg-gray-100 text-gray-800',
      em_andamento: 'bg-yellow-100 text-yellow-800',
      concluida: 'bg-green-100 text-green-800',
      concluido: 'bg-green-100 text-green-800',
      bloqueada: 'bg-red-100 text-red-800',
      atrasado: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      baixa: 'bg-gray-100 text-gray-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Projeto não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{projectData.title}</h2>
          <p className="text-gray-600">Projeto #{projectData.id} • {projectData.responsible_person}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Progresso do Projeto
            <span className="text-lg font-bold">{projectData.progress_percentage}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={projectData.progress_percentage} className="h-3" />
            <div className="flex gap-2">
              {[0, 25, 50, 75, 100].map((value) => (
                <Button
                  key={value}
                  variant={projectData.progress_percentage === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateProjectProgress(value)}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="milestones">Marcos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm text-gray-700 mt-1">{projectData.description || 'Sem descrição'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Badge className="mt-1">{projectData.project_type}</Badge>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Badge className={`mt-1 ${getPriorityColor(projectData.priority)}`}>
                      {projectData.priority}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Início</Label>
                    <p className="text-sm text-gray-700 mt-1">{formatDate(projectData.start_date)}</p>
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <p className="text-sm text-gray-700 mt-1">{formatDate(projectData.end_date)}</p>
                  </div>
                </div>
                {projectData.budget && (
                  <div>
                    <Label>Orçamento</Label>
                    <p className="text-sm text-gray-700 mt-1">{formatCurrency(projectData.budget)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{projectData.tasks.length}</p>
                    <p className="text-sm text-gray-600">Tarefas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{projectData.milestones.length}</p>
                    <p className="text-sm text-gray-600">Marcos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {projectData.tasks.filter(t => t.status === 'concluida').length}
                    </p>
                    <p className="text-sm text-gray-600">Concluídas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{projectData.timeline.length}</p>
                    <p className="text-sm text-gray-600">Eventos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {projectData.team_members && projectData.team_members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Equipe do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {projectData.team_members.map((member, index) => (
                    <Badge key={index} variant="secondary">{member}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Tarefa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Nome da tarefa"
                  value={newTask.task_name}
                  onChange={(e) => setNewTask({...newTask, task_name: e.target.value})}
                />
                <Input
                  placeholder="Responsável"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                />
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição da tarefa"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <Input
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
                />
                <Input
                  type="date"
                  value={newTask.end_date}
                  onChange={(e) => setNewTask({...newTask, end_date: e.target.value})}
                />
                <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Horas estimadas"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({...newTask, estimated_hours: e.target.value})}
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={addTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {projectData.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">{task.task_name}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <p className="text-sm text-gray-600">Responsável: {task.assigned_to}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(task.start_date)} - {formatDate(task.end_date)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <Select
                        value={task.status}
                        onValueChange={(value) => updateTask(task.id, { status: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{task.progress_percentage}%</span>
                    </div>
                    <Progress value={task.progress_percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Marco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Nome do marco"
                  value={newMilestone.milestone_name}
                  onChange={(e) => setNewMilestone({...newMilestone, milestone_name: e.target.value})}
                />
                <Input
                  type="date"
                  value={newMilestone.target_date}
                  onChange={(e) => setNewMilestone({...newMilestone, target_date: e.target.value})}
                />
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição do marco"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Critérios de conclusão"
                    value={newMilestone.completion_criteria}
                    onChange={(e) => setNewMilestone({...newMilestone, completion_criteria: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={addMilestone}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Marco
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {projectData.milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{milestone.milestone_name}</h4>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                      <p className="text-sm text-gray-600">Data alvo: {formatDate(milestone.target_date)}</p>
                      {milestone.actual_date && (
                        <p className="text-sm text-gray-600">Concluído em: {formatDate(milestone.actual_date)}</p>
                      )}
                      {milestone.completion_criteria && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Critérios:</strong> {milestone.completion_criteria}
                        </p>
                      )}
                    </div>
                    <Select
                      value={milestone.status}
                      onValueChange={(value) => updateMilestone(milestone.id, { 
                        status: value,
                        actual_date: value === 'concluido' ? new Date().toISOString().split('T')[0] : undefined
                      })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {milestoneStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Evento à Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={newTimelineEvent.event_type} onValueChange={(value) => setNewTimelineEvent({...newTimelineEvent, event_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Título do evento"
                  value={newTimelineEvent.event_title}
                  onChange={(e) => setNewTimelineEvent({...newTimelineEvent, event_title: e.target.value})}
                />
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Descrição do evento"
                    value={newTimelineEvent.event_description}
                    onChange={(e) => setNewTimelineEvent({...newTimelineEvent, event_description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={addTimelineEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Evento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectData.timeline.map((event, index) => {
                  const EventIcon = eventIcons[event.event_type as keyof typeof eventIcons] || MessageSquare
                  return (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <EventIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        {index < projectData.timeline.length - 1 && (
                          <div className="w-px h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{event.event_title}</h4>
                          <span className="text-sm text-gray-500">{formatDateTime(event.event_date)}</span>
                        </div>
                        {event.event_description && (
                          <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
                        )}
                        {event.progress_before !== undefined && event.progress_after !== undefined && (
                          <p className="text-sm text-blue-600 mt-1">
                            Progresso: {event.progress_before}% → {event.progress_after}%
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Por: {event.created_by_name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}