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
import { Bell, Package } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications"
import { AnimatedListDemo } from "@/components/animated-list-demo"

export function NotificationsButton() {
  const { user } = useAuth()
  const { 
    notifications, 
    pendingRequests, 
    pendingCount, 
    fetchPendingRequests 
  } = useRealTimeNotifications()
  const [isOpen, setIsOpen] = useState(false)


  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests()
    }
  }, [isOpen, fetchPendingRequests])



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
        
        {pendingRequests.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma solicitação pendente
          </div>
        ) : (
          <div className="px-2">
            <AnimatedListDemo 
              notifications={notifications}
              pendingRequests={pendingRequests}
              className="h-80"
            />
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