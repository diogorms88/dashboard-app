"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Clock, CheckCircle, AlertCircle, X, Eye, Edit } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAsyncOperation } from "@/hooks/use-async-operation"
import { useFilters } from "@/hooks/use-filters"
import { apiRequest } from "@/lib/api"
import { toast } from "sonner"
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants"

interface ItemRequest {
  id: number
  item_name: string
  quantity: number
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  requested_by: string
  assigned_to?: string
  requested_by_name: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  username: string
  nome: string
  papel: string
}

export default function AdminRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ItemRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ItemRequest | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [activeTab, setActiveTab] = useState('all')

  // Hook para operações assíncronas
  const { loading: isLoading, execute: executeAsync } = useAsyncOperation({
    errorMessage: 'Erro ao carregar dados',
    showErrorToast: true
  })

  // Hook para filtros por status
  const { filteredData: filteredRequests, updateFilter } = useFilters(requests, {
    searchFields: ['item_name', 'description', 'requested_by_name'],
    initialFilters: { status: 'all' }
  })

  const fetchRequests = async () => {
    await executeAsync(async () => {
      const data = await apiRequest('/item-requests')
      setRequests(data)
    })
  }

  const fetchUsers = async () => {
    await executeAsync(async () => {
      const data = await apiRequest('/users')
      setUsers(data.filter((u: User) => u.papel === 'admin' || u.papel === 'manager'))
    })
  }

  useEffect(() => {
    if (user && (user.papel === 'admin' || user.papel === 'manager')) {
      fetchRequests()
      fetchUsers()
    }
  }, [user])

  const { execute: executeUpdate } = useAsyncOperation({
    errorMessage: 'Erro ao atualizar solicitação',
    showErrorToast: true,
    onSuccess: () => {
      toast.success('Solicitação atualizada com sucesso!')
      setIsDialogOpen(false)
      setSelectedRequest(null)
      setNewStatus('')
      setAssignedTo('none')
      fetchRequests()
    }
  })

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return
    
    if (!newStatus || newStatus === '') {
      toast.error('Por favor, selecione um status válido')
      return
    }

    // Validar se o status é um dos valores válidos
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
      toast.error('Status selecionado é inválido')
      return
    }

    await executeUpdate(async () => {
      await apiRequest(`/item-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          assigned_to: assignedTo && assignedTo !== 'none' ? assignedTo : undefined
        })
      })
    })
  }

  const { execute: executeClear } = useAsyncOperation({
    errorMessage: 'Erro ao limpar solicitações',
    showErrorToast: true,
    onSuccess: (data) => {
      toast.success(`Todas as solicitações foram removidas com sucesso! (${data.deletedCount} itens removidos)`)
      fetchRequests()
    }
  })

  const handleClearAllRequests = async () => {
    if (!confirm('Tem certeza que deseja limpar TODAS as solicitações? Esta ação não pode ser desfeita.')) {
      return
    }

    await executeClear(async () => {
      return await apiRequest('/item-requests/clear-all', {
        method: 'DELETE'
      })
    })
  }

  const openEditDialog = (request: ItemRequest) => {
    setSelectedRequest(request)
    setNewStatus(request.status)
    setAssignedTo(request.assigned_to || 'none')
    setIsDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'in_progress': return 'Em Andamento'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.default
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />
      case 'medium':
        return <Clock className="h-4 w-4" />
      case 'low':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return priority
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const filterRequestsByStatus = (status: string) => {
    if (status === 'all') return requests
    if (status === 'no_action') return requests.filter(request => !request.assigned_to)
    return requests.filter(request => request.status === status)
  }

  const getTabCount = (status: string) => {
    return filterRequestsByStatus(status).length
  }

  // Atualizar filtro quando a aba muda
  useEffect(() => {
    updateFilter('status', activeTab)
  }, [activeTab, updateFilter])

  if (!user || (user.papel !== 'admin' && user.papel !== 'manager')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <X className="h-12 w-12 mb-4 text-red-500" />
            <CardTitle className="mb-2">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Solicitações</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todas as solicitações de itens
          </p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleClearAllRequests}
          disabled={requests.length === 0}
        >
          Limpar Todas as Solicitações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({getTabCount('all')})
          </TabsTrigger>
          <TabsTrigger value="no_action">
            Sem Ação ({getTabCount('no_action')})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({getTabCount('pending')})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Em Andamento ({getTabCount('in_progress')})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({getTabCount('completed')})
          </TabsTrigger>
        </TabsList>

        {['all', 'no_action', 'pending', 'in_progress', 'completed'].map((status) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {status === 'all' ? 'Todas as Solicitações' :
                   status === 'no_action' ? 'Solicitações Sem Ação' :
                   status === 'pending' ? 'Solicitações Pendentes' :
                   status === 'in_progress' ? 'Solicitações em Andamento' :
                   'Solicitações Concluídas'}
                </CardTitle>
                <CardDescription>
                  {filterRequestsByStatus(status).length} solicitação(ões) encontrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">Carregando solicitações...</p>
                    </div>
                  </div>
                ) : filterRequestsByStatus(status).length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <CardTitle className="mb-2">Nenhuma solicitação encontrada</CardTitle>
                      <CardDescription>
                        Não há solicitações nesta categoria.
                      </CardDescription>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterRequestsByStatus(status).map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <div>
                                <div>{request.item_name}</div>
                                {request.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{request.quantity}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(request.priority)}>
                              {getPriorityIcon(request.priority)}
                              {getPriorityLabel(request.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusLabel(request.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{request.requested_by_name}</TableCell>
                          <TableCell>
                            {request.assigned_to_name || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(request.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(request)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atualizar Solicitação</DialogTitle>
            <DialogDescription>
              Atualize o status e responsável da solicitação.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">{selectedRequest.item_name}</h4>
                <p className="text-sm text-muted-foreground">
                  Quantidade: {selectedRequest.quantity}
                </p>
                {selectedRequest.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.description}
                  </p>
                )}
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Responsável</label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.nome} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRequest}>
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}