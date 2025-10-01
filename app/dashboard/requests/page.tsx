"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Package, Plus, Clock, CheckCircle, AlertCircle, X } from "lucide-react"
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

export default function RequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ItemRequest[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  // Hook para operações assíncronas
  const { loading: isLoading, execute: executeAsync } = useAsyncOperation({
    errorMessage: 'Erro ao carregar solicitações',
    showErrorToast: true
  })

  // Hook para filtros (mesmo sem filtros ativos, prepara para futuras funcionalidades)
  const { filteredData: filteredRequests } = useFilters(requests, {
    searchFields: ['item_name', 'description'],
    initialFilters: {}
  })

  const fetchRequests = async () => {
    await executeAsync(async () => {
      const data = await apiRequest(`/item-requests?user_id=${user?.id}`)
      setRequests(data)
    })
  }

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  const { execute: executeSubmit } = useAsyncOperation({
    errorMessage: 'Erro ao criar solicitação',
    showErrorToast: true,
    onSuccess: () => {
      toast.success('Solicitação criada com sucesso!')
      setIsDialogOpen(false)
      setFormData({
        item_name: '',
        quantity: '',
        description: '',
        priority: 'medium'
      })
      fetchRequests()
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.item_name || !formData.quantity) {
      toast.error('Nome do item e quantidade são obrigatórios')
      return
    }

    await executeSubmit(async () => {
      await apiRequest('/item-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_name: formData.item_name,
          quantity: parseInt(formData.quantity),
          description: formData.description,
          priority: formData.priority // Enviar diretamente em inglês
        })
      })
    })
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

  if (!user) return null

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Itens</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas solicitações de materiais e equipamentos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nova Solicitação</DialogTitle>
              <DialogDescription>
                Preencha os dados do item que você precisa solicitar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="item_name">Nome do Item *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="Ex: Tinta branca, Parafusos M6..."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Ex: 5"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Informações adicionais sobre o item..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Solicitação
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Carregando solicitações...</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <CardTitle className="mb-2">Nenhuma solicitação encontrada</CardTitle>
            <CardDescription className="text-center mb-4">
              Você ainda não fez nenhuma solicitação de item.
              Clique em &quot;Nova Solicitação&quot; para começar.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{request.item_name}</CardTitle>
                      <CardDescription>
                        Quantidade: {request.quantity} • Solicitado em {formatDate(request.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(request.priority)}>
                      {getPriorityIcon(request.priority)}
                      {getPriorityLabel(request.priority)}
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {request.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Descrição:</strong> {request.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  <p>Solicitado por: {request.requested_by_name}</p>
                  {request.assigned_to_name && (
                    <p>Atribuído a: {request.assigned_to_name}</p>
                  )}
                  {request.updated_at !== request.created_at && (
                    <p>Última atualização: {formatDate(request.updated_at)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}