'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, User, Calendar, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface GlobalNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  autoClose?: boolean
  duration?: number
  data?: any
}

interface GlobalNotificationsProps {
  notifications: GlobalNotification[]
  onDismiss: (id: string) => void
}

// Removido typeStyles - agora usando estilo Magic UI

const typeIcons = {
  info: Bell,
  success: Package,
  warning: Calendar,
  error: X
}

export function GlobalNotifications({ notifications, onDismiss }: GlobalNotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<GlobalNotification[]>([])

  useEffect(() => {
    setVisibleNotifications(notifications)
  }, [notifications])

  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.autoClose !== false) {
        const duration = notification.duration || 5000
        const timer = setTimeout(() => {
          onDismiss(notification.id)
        }, duration)

        return () => clearTimeout(timer)
      }
    })
  }, [notifications, onDismiss])

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {visibleNotifications.map((notification) => {
          const Icon = typeIcons[notification.type]
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <figure
                className={
                  "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4 " +
                  "transition-all duration-200 ease-in-out hover:scale-[103%] " +
                  "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] " +
                  "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
                }
              >
                <div className="flex flex-row items-center gap-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: notification.type === 'success' ? '#00C9A7' : 
                                     notification.type === 'warning' ? '#FFB800' : 
                                     notification.type === 'error' ? '#FF6B6B' : '#1E86FF'
                    }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col overflow-hidden flex-1">
                    <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
                      <span className="text-sm sm:text-lg truncate">{notification.title}</span>
                      <span className="mx-1">·</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatTime(notification.timestamp)}</span>
                    </figcaption>
                    <p className="text-sm font-normal dark:text-white/60 mt-1">
                      {notification.message}
                    </p>
                    {notification.data && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {notification.data.priority && (
                          <Badge 
                            variant={notification.data.priority === 'alta' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {notification.data.priority}
                          </Badge>
                        )}
                        {notification.data.quantity && (
                          <Badge variant="outline" className="text-xs">
                            Qtd: {notification.data.quantity}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100 ml-2 flex-shrink-0"
                    onClick={() => onDismiss(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </figure>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Hook para gerenciar notificações globais
let globalNotificationHandlers: ((notification: GlobalNotification) => void)[] = []

export function useGlobalNotifications() {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([])

  const addNotification = (notification: Omit<GlobalNotification, 'id' | 'timestamp'>) => {
    const newNotification: GlobalNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Notificar outros componentes
    globalNotificationHandlers.forEach(handler => handler(newNotification))
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Registrar handler global
  useEffect(() => {
    const handler = (notification: GlobalNotification) => {
      setNotifications(prev => {
        // Evitar duplicatas
        if (prev.some(n => n.id === notification.id)) {
          return prev
        }
        return [...prev, notification]
      })
    }
    
    globalNotificationHandlers.push(handler)
    
    return () => {
      globalNotificationHandlers = globalNotificationHandlers.filter(h => h !== handler)
    }
  }, [])

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications
  }
}

// Função global para adicionar notificações de qualquer lugar
export function showGlobalNotification(notification: Omit<GlobalNotification, 'id' | 'timestamp'>) {
  const newNotification: GlobalNotification = {
    ...notification,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date()
  }
  
  globalNotificationHandlers.forEach(handler => handler(newNotification))
}