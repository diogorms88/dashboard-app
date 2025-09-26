"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell, Package, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { apiRequest } from "@/lib/api"

interface ItemRequest {
  id: number
  item_name: string
  quantity: number
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  requested_by: number
  assigned_to?: number
  requested_by_name: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
}

export function NotificationsButton() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ItemRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const fetchRequests = async () => {
    try {
      const data = await apiRequest('/item-requests?status=pending')
      setRequests(data)
      setPendingCount(data.length)
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error)
    }
  }

  const fetchPendingCount = async () => {
    try {
      const data = await apiRequest('/item-requests/count/pending')
      setPendingCount(data.count)
    } catch (error) {
      console.error('Erro ao buscar contagem:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPendingCount()
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchPendingCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (isOpen) {
      fetchRequests()
    }
  }, [isOpen])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-3 w-3" />
      case 'medium':
        return <Clock className="h-3 w-3" />
      case 'low':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {requests.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma solicitação pendente
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {requests.map((request) => (
              <DropdownMenuItem key={request.id} className="flex flex-col items-start p-3 cursor-pointer">
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-medium text-sm">{request.item_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(request.priority)}`}
                    >
                      {getPriorityIcon(request.priority)}
                      {request.priority === 'high' ? 'Alta' : 
                       request.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground w-full">
                  <div className="flex justify-between items-center">
                    <span>Qtd: {request.quantity}</span>
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  <div className="mt-1">
                    Solicitado por: {request.requested_by_name}
                  </div>
                  {request.description && (
                    <div className="mt-1 text-xs">
                      {request.description}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm font-medium" asChild>
          <a href={user.papel === 'admin' || user.papel === 'manager' ? '/dashboard/admin/requests' : '/dashboard/requests'}>
            Ver todas as solicitações
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}