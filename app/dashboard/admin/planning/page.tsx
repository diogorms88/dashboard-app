'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, BarChart3, Clock, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useFilters } from '@/hooks/use-filters'
import { PROJECT_TYPE_COLORS, PRIORITY_COLORS, STATUS_COLORS } from '@/lib/constants'
import { PlanningProjectModal } from '@/components/planning-project-modal'
import { PlanningProjectDetails } from '@/components/planning-project-details'

interface PlanningProject {
  id: number
  title: string
  description?: string
  project_type: 'projeto' | 'melhoria' | 'manutencao' | 'treinamento' | 'auditoria'
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'planejado' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado'
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
  task_count: number
  milestone_count: number
}

// Cores movidas para lib/constants.ts

const statusIcons = {
  planejado: Calendar,
  em_andamento: Clock,
  pausado: AlertTriangle,
  concluido: CheckCircle,
  cancelado: AlertTriangle
}

export default function PlanningPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [projects, setProjects] = useState<PlanningProject[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<PlanningProject | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Hook para operações assíncronas
  const { execute: loadProjects, isLoading: loading } = useAsyncOperation()
  const { execute: deleteProject } = useAsyncOperation()

  // Hook para filtros
  const {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    filteredData: filteredProjects
  } = useFilters(projects, {
    searchFields: ['title', 'description', 'responsible_person'],
    filterFields: ['status', 'priority', 'project_type']
  })

  useEffect(() => {
    if (user && !authLoading) {
      handleLoadProjects()
    }
  }, [filters.status, filters.priority, filters.project_type, user, authLoading])

  const handleLoadProjects = () => {
    loadProjects(async () => {
      const params = new URLSearchParams()
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority)
      if (filters.project_type && filters.project_type !== 'all') params.append('type', filters.project_type)
      
      const response = await apiRequest(`/planning-projects?${params.toString()}`)
      setProjects(response)
      return response
    }, {
      ignoreAuthErrors: true,
      errorMessage: 'Erro ao carregar projetos de planejamento'
    })
  }

  const handleProjectCreated = () => {
    setIsCreateModalOpen(false)
    handleLoadProjects()
    toast.success('Projeto de planejamento criado com sucesso!')
  }

  const handleProjectClick = (project: PlanningProject) => {
    setSelectedProject(project)
    setIsDetailsOpen(true)
  }

  const handleDeleteProject = async (projectId: number, projectTitle: string, event: React.MouseEvent) => {
    event.stopPropagation() // Evitar abrir o modal de detalhes
    
    if (!user || user.papel !== 'admin') {
      toast.error('Apenas administradores podem excluir projetos')
      return
    }

    if (!confirm(`Tem certeza que deseja excluir o projeto "${projectTitle}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    deleteProject(async () => {
      await apiRequest(`/planning-projects/${projectId}`, {
        method: 'DELETE'
      })
      handleLoadProjects()
    }, {
      successMessage: 'Projeto excluído com sucesso!',
      errorMessage: 'Erro ao excluir projeto'
    })
  }

  // Filtros removidos - agora gerenciados pelo hook useFilters

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const isProjectOverdue = (project: PlanningProject) => {
    const today = new Date()
    const endDate = new Date(project.end_date)
    return project.status !== 'concluido' && endDate < today
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Planejamento</h1>
          <p className="text-muted-foreground">
            Gerencie projetos, tarefas e acompanhe o progresso com timeline detalhada
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto de Planejamento</DialogTitle>
              <DialogDescription>
                Defina um novo projeto com cronograma, tarefas e marcos
              </DialogDescription>
            </DialogHeader>
            <PlanningProjectModal onSuccess={handleProjectCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'em_andamento').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'concluido').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {projects.filter(p => isProjectOverdue(p)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por título, descrição ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="planejado">Planejado</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority || ''} onValueChange={(value) => updateFilter('priority', value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.project_type || ''} onValueChange={(value) => updateFilter('project_type', value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="projeto">Projeto</SelectItem>
                <SelectItem value="melhoria">Melhoria</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="treinamento">Treinamento</SelectItem>
                <SelectItem value="auditoria">Auditoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {!user && !authLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-500 text-center mb-4">
              Você precisa estar logado para acessar o sistema de planejamento.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm || filters.status || filters.priority || filters.project_type
                ? 'Tente ajustar os filtros para encontrar projetos.'
                : 'Comece criando seu primeiro projeto de planejamento.'}
            </p>
            {!searchTerm && !filters.status && !filters.priority && !filters.project_type && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Projeto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const StatusIcon = statusIcons[project.status]
            const isOverdue = isProjectOverdue(project)
            
            return (
              <Card
                key={project.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  isOverdue ? 'border-red-200 bg-red-50' : ''
                }`}
                onClick={() => handleProjectClick(project)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                        {project.title}
                        {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <StatusIcon className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={PROJECT_TYPE_COLORS[project.project_type]}>
                        {project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1)}
                      </Badge>
                      <Badge className={PRIORITY_COLORS[project.priority]}>
                        {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                      </Badge>
                      <Badge className={STATUS_COLORS[project.status]}>
                        {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progresso</span>
                        <span className="text-sm text-gray-600">{project.progress_percentage}%</span>
                      </div>
                      <Progress 
                        value={project.progress_percentage} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Responsável: {project.responsible_person}</p>
                      <p>Início: {formatDate(project.start_date)}</p>
                      <p>Fim: {formatDate(project.end_date)}</p>
                      <div className="flex justify-between">
                        <span>Tarefas: {project.task_count}</span>
                        <span>Marcos: {project.milestone_count}</span>
                      </div>
                      {project.budget && (
                        <p>Orçamento: {formatCurrency(project.budget)}</p>
                      )}
                      {project.team_members && project.team_members.length > 0 && (
                        <p>Equipe: {project.team_members.length} membros</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Projeto</DialogTitle>
            </DialogHeader>
            <PlanningProjectDetails
              projectId={selectedProject.id}
              onClose={() => setIsDetailsOpen(false)}
              onUpdate={handleLoadProjects}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}