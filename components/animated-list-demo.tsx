"use client"

import { cn } from "@/lib/utils"
import { AnimatedList } from "@/components/magicui/animated-list"

interface NotificationItem {
  id: string
  name: string
  description: string
  icon: string
  color: string
  time: string
  type: 'request' | 'assignment' | 'completion' | 'update'
}

const Notification = ({ name, description, icon, color, time }: NotificationItem) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  )
}

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

export function AnimatedListDemo({
  className,
  notifications = [],
  pendingRequests = []
}: {
  className?: string
  notifications?: NotificationItem[]
  pendingRequests?: ItemRequest[]
}) {
  // Função para converter solicitações em notificações
  const convertRequestsToNotifications = (requests: ItemRequest[]): NotificationItem[] => {
    return requests.map((request) => {
      const createdAt = new Date(request.created_at)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000)
      
      let timeAgo = 'Agora'
      if (diffInSeconds >= 60) {
        const minutes = Math.floor(diffInSeconds / 60)
        if (minutes >= 60) {
          const hours = Math.floor(minutes / 60)
          if (hours >= 24) {
            const days = Math.floor(hours / 24)
            timeAgo = `${days}d atrás`
          } else {
            timeAgo = `${hours}h atrás`
          }
        } else {
          timeAgo = `${minutes}min atrás`
        }
      }

      const getPriorityColor = (priority: string) => {
        switch (priority) {
          case 'high': return '#ef4444' // red-500
          case 'medium': return '#f59e0b' // amber-500
          case 'low': return '#10b981' // emerald-500
          default: return '#6b7280' // gray-500
        }
      }

      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'pending': return '📋'
          case 'in_progress': return '🔄'
          case 'completed': return '✅'
          case 'cancelled': return '❌'
          default: return '📋'
        }
      }

      return {
        id: request.id.toString(),
        name: request.item_name,
        description: `${request.requested_by_name} solicitou ${request.quantity}x - ${request.description || 'Sem descrição'}`,
        time: timeAgo,
        icon: getStatusIcon(request.status),
        color: getPriorityColor(request.priority),
        type: 'request' as const
      }
    })
  }

  // Usar notificações fornecidas ou converter solicitações pendentes
  const displayNotifications = notifications.length > 0 
    ? notifications 
    : convertRequestsToNotifications(pendingRequests)

  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full flex-col overflow-hidden p-2",
        className
      )}
    >
      <AnimatedList>
        {displayNotifications.map((item) => (
          <Notification {...item} key={item.id} />
        ))}
      </AnimatedList>

      <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t"></div>
    </div>
  )
}

export type { NotificationItem }