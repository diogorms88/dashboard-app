'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Form8DModal } from '@/components/form-8d-modal'
import { useRouter } from 'next/navigation'

interface Form8D {
  id: number
  title: string
  problem_description: string
  severity_level: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'aberto' | 'em_andamento' | 'concluido' | 'cancelado'
  created_at: string
  created_by_name: string
  assigned_to_name?: string
  action_count: number
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

const statusIcons = {
  aberto: FileText,
  em_andamento: Clock,
  concluido: CheckCircle,
  cancelado: AlertTriangle
}

export default function Forms8DPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [forms, setForms] = useState<Form8D[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<Form8D | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user && !authLoading) {
      loadForms()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [statusFilter, severityFilter, user, authLoading])

  const loadForms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (severityFilter && severityFilter !== 'all') params.append('severity', severityFilter)
      
      const response = await apiRequest(`/forms-8d?${params.toString()}`)
      setForms(response)
    } catch (error) {
      // Não mostrar toast de erro se for problema de autenticação
      if (!error.message.includes('Token inválido') && 
          !error.message.includes('Unauthorized') && 
          !error.message.includes('Token de acesso requerido')) {
        toast.error('Erro ao carregar formulários 8D')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFormCreated = () => {
    setIsCreateModalOpen(false)
    loadForms()
    toast.success('Formulário 8D criado com sucesso!')
  }

  const handleFormClick = (form: Form8D) => {
    router.push(`/dashboard/engineering/8d-forms/${form.id}`)
  }

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.problem_description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formulários 8D</h1>
          <p className="text-muted-foreground">
            Sistema robusto para análise de problemas com metodologia 8D
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Formulário 8D
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Formulário 8D</DialogTitle>
              <DialogDescription>
                Inicie uma nova análise de problema usando a metodologia 8D
              </DialogDescription>
            </DialogHeader>
            <Form8DModal onSuccess={handleFormCreated} />
          </DialogContent>
        </Dialog>
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
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as severidades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Forms Grid */}
      {!user && !authLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-500 text-center mb-4">
              Você precisa estar logado para acessar os formulários 8D.
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
      ) : filteredForms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum formulário 8D encontrado
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm || statusFilter || severityFilter
                ? 'Tente ajustar os filtros para encontrar formulários.'
                : 'Comece criando seu primeiro formulário 8D.'}
            </p>
            {!searchTerm && !statusFilter && !severityFilter && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Formulário
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => {
            const StatusIcon = statusIcons[form.status]
            return (
              <Card
                key={form.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleFormClick(form)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {form.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {form.problem_description}
                      </CardDescription>
                    </div>
                    <StatusIcon className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[form.severity_level]}>
                        {form.severity_level.charAt(0).toUpperCase() + form.severity_level.slice(1)}
                      </Badge>
                      <Badge className={statusColors[form.status]}>
                        {form.status.replace('_', ' ').charAt(0).toUpperCase() + form.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Criado por: {form.created_by_name}</p>
                      <p>Data: {formatDate(form.created_at)}</p>
                      {form.assigned_to_name && (
                        <p>Responsável: {form.assigned_to_name}</p>
                      )}
                      <p>Ações: {form.action_count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}


    </div>
  )
}