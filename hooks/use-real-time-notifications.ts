"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { showGlobalNotification } from "@/components/global-notifications"

export interface NotificationItem {
  id: string
  name: string
  description: string
  icon: string
  color: string
  time: string
  type: 'request' | 'assignment' | 'completion' | 'update'
  requestId?: number
  userId?: string
  userName?: string
}

export interface ItemRequest {
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

export function useRealTimeNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [pendingRequests, setPendingRequests] = useState<ItemRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const lastCheckTimeRef = useRef<Date>(new Date())
  const notifiedRequestsRef = useRef<Set<number>>(new Set())

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Agora'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}min atrás`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h atrás`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d atrás`
    }
  }

  const createNotificationFromRequest = (request: ItemRequest, type: NotificationItem['type']): NotificationItem => {
    const createdAt = new Date(request.created_at)
    
    return {
      id: `${request.id}-${type}-${Date.now()}`,
      name: request.item_name,
      description: `${request.requested_by_name} solicitou ${request.quantity}x ${request.item_name}`,
      icon: type === 'request' ? '📋' : type === 'assignment' ? '👤' : type === 'completion' ? '✅' : '🔄',
      color: request.priority === 'high' ? 'red' : request.priority === 'medium' ? 'yellow' : 'green',
      time: formatTimeAgo(createdAt),
      type,
      requestId: request.id,
      userId: request.requested_by,
      userName: request.requested_by_name
    }
  }

  const fetchPendingRequests = useCallback(async () => {
    try {
      const data = await apiRequest('/item-requests?status=pending')
      setPendingRequests(data)
      setPendingCount(data.length)
      return data
    } catch (error) {
      console.error('Erro ao buscar solicitações pendentes:', error)
      setPendingRequests([])
      setPendingCount(0)
      return []
    }
  }, [])

  const fetchPendingCount = useCallback(async () => {
    try {
      const data = await apiRequest('/item-requests/count/pending')
      setPendingCount(data.count)
      return data.count
    } catch (error) {
      console.error('Erro ao buscar contagem de pendentes:', error)
      setPendingCount(0)
      return 0
    }
  }, [])

  const checkForNewRequests = useCallback(async () => {
    try {
      // Apenas admin e manager devem receber notificações globais
      if (!user || (user.papel !== 'admin' && user.papel !== 'manager')) {
        return
      }

      const currentTime = new Date()
      // Garantir que lastCheckTimeRef.current existe, senão usar 24h atrás como fallback
      const timeFilter = lastCheckTimeRef.current?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      // Buscar solicitações criadas desde a última verificação
      const newRequests = await apiRequest(`/item-requests/recent?created_after=${timeFilter}`)
      
      if (newRequests && newRequests.length > 0) {
        // Filtrar apenas solicitações que ainda não foram notificadas
        const trulyNewRequests = newRequests.filter((request: ItemRequest) => 
          !notifiedRequestsRef.current.has(request.id)
        )
        
        if (trulyNewRequests.length > 0) {
          const newNotifications = trulyNewRequests.map((request: ItemRequest) => 
            createNotificationFromRequest(request, 'request')
          )
          
          // Adicionar às notificações locais
          setNotifications(prev => {
            const combined = [...newNotifications, ...prev]
            // Manter apenas as últimas 50 notificações
            return combined.slice(0, 50)
          })
          
          // Mostrar notificações globais apenas para admin e manager
          trulyNewRequests.forEach(request => {
            // Marcar como notificado
            notifiedRequestsRef.current.add(request.id)
            
            const notification = newNotifications.find(n => n.requestId === request.id)
            if (notification) {
              showGlobalNotification({
                title: notification.name,
                message: notification.description,
                type: 'info',
                data: {
                  priority: request.priority,
                  quantity: request.quantity
                }
              })
            }
          })
        }
      }
      
      // Atualizar o tempo da última verificação
      lastCheckTimeRef.current = currentTime
    } catch (error) {
      console.error('Erro ao verificar novas solicitações:', error)
    }
  }, [user])

  const addNotification = useCallback((notification: NotificationItem) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev]
      return newNotifications.slice(0, 50) // Manter apenas as últimas 50
    })
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Efeito para buscar dados iniciais
  useEffect(() => {
    if (user) {
      fetchPendingCount()
      fetchPendingRequests()
    }
  }, [user, fetchPendingCount, fetchPendingRequests])

  // Efeito para verificar novas solicitações periodicamente (apenas para admin e manager)
  useEffect(() => {
    if (user && (user.papel === 'admin' || user.papel === 'manager')) {
      // Verificar imediatamente
      checkForNewRequests()
      
      // Configurar intervalo para verificações periódicas (a cada 15 segundos)
      const interval = setInterval(checkForNewRequests, 15000)
      
      return () => clearInterval(interval)
    }
  }, [user, checkForNewRequests])

  // Efeito para atualizar contagem de pendentes periodicamente
  useEffect(() => {
    if (user) {
      const interval = setInterval(fetchPendingCount, 30000) // A cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [user, fetchPendingCount])

  return {
    notifications,
    pendingRequests,
    pendingCount,
    addNotification,
    clearNotifications,
    fetchPendingRequests,
    fetchPendingCount,
    checkForNewRequests
  }
}