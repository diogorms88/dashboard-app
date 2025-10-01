"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedListDemo } from "@/components/animated-list-demo"
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, RefreshCw } from "lucide-react"

export default function NotificationsDemoPage() {
  const { 
    notifications, 
    pendingCount, 
    addNotification, 
    clearNotifications,
    checkForNewRequests 
  } = useRealTimeNotifications()
  
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleAddTestNotification = () => {
    const testNotifications = [
      {
        id: `test-${Date.now()}-1`,
        name: "Nova Solicitação",
        description: "João Silva criou uma solicitação para Parafusos M8",
        icon: "📋",
        color: "#00C9A7",
        time: "Agora",
        type: "request" as const
      },
      {
        id: `test-${Date.now()}-2`,
        name: "Solicitação Atribuída",
        description: "Maria Santos foi designada para Porcas M6",
        icon: "👤",
        color: "#FFB800",
        time: "1m atrás",
        type: "assignment" as const
      },
      {
        id: `test-${Date.now()}-3`,
        name: "Solicitação Concluída",
        description: "Arruelas de aço foram entregues",
        icon: "✅",
        color: "#00C9A7",
        time: "3m atrás",
        type: "completion" as const
      }
    ]
    
    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)]
    addNotification(randomNotification)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await checkForNewRequests()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demo de Notificações</h1>
          <p className="text-muted-foreground">
            Demonstração do sistema de notificações em tempo real com AnimatedList
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Controles de Teste
            </CardTitle>
            <CardDescription>
              Use os botões abaixo para testar o sistema de notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleAddTestNotification}
              className="w-full"
              variant="default"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Notificação de Teste
            </Button>
            
            <Button 
              onClick={handleRefresh}
              className="w-full"
              variant="outline"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Verificando...' : 'Verificar Novas Solicitações'}
            </Button>
            
            <Button 
              onClick={clearNotifications}
              className="w-full"
              variant="destructive"
              disabled={notifications.length === 0}
            >
              Limpar Todas as Notificações
            </Button>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Estatísticas:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Total de notificações: {notifications.length}</div>
                <div>Solicitações pendentes: {pendingCount}</div>
                <div>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista Animada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✨ Lista Animada de Notificações
            </CardTitle>
            <CardDescription>
              As notificações aparecem automaticamente quando novas solicitações são criadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">
                  Nenhuma notificação ainda.<br />
                  Crie uma solicitação ou use o botão de teste acima.
                </p>
              </div>
            ) : (
              <AnimatedListDemo 
                notifications={notifications}
                className="h-96"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🔄 Notificações Automáticas</h4>
              <p className="text-sm text-muted-foreground">
                O sistema verifica automaticamente por novas solicitações a cada 15 segundos. 
                Quando uma nova solicitação é criada, uma notificação aparece instantaneamente.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">✨ Animações Suaves</h4>
              <p className="text-sm text-muted-foreground">
                As notificações aparecem com animações suaves usando Framer Motion, 
                proporcionando uma experiência visual agradável.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔔 Integração Completa</h4>
              <p className="text-sm text-muted-foreground">
                O botão de notificações no header também foi atualizado para incluir 
                a opção de visualizar as notificações em formato animado.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📱 Responsivo</h4>
              <p className="text-sm text-muted-foreground">
                O sistema funciona perfeitamente em dispositivos móveis e desktop, 
                adaptando-se automaticamente ao tamanho da tela.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}