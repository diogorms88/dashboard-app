'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { showGlobalNotification } from '@/components/global-notifications'
import { Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

export default function TestNotificationsPage() {
  const testNotifications = [
    {
      title: 'Nova Solicitação',
      message: 'João Silva criou uma solicitação para Parafusos M8',
      type: 'info' as const,
      data: { priority: 'alta', quantity: 50 }
    },
    {
      title: 'Solicitação Aprovada',
      message: 'Sua solicitação de materiais foi aprovada',
      type: 'success' as const,
      data: { priority: 'média', quantity: 25 }
    },
    {
      title: 'Atenção Necessária',
      message: 'Estoque baixo de Parafusos M6 - apenas 10 unidades restantes',
      type: 'warning' as const,
      data: { priority: 'alta', quantity: 10 }
    },
    {
      title: 'Solicitação Rejeitada',
      message: 'Solicitação #1234 foi rejeitada - documentação insuficiente',
      type: 'error' as const,
      data: { priority: 'baixa' }
    }
  ]

  const handleTestNotification = (notification: typeof testNotifications[0]) => {
    showGlobalNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data
    })
  }

  const handleMultipleNotifications = () => {
    testNotifications.forEach((notification, index) => {
      setTimeout(() => {
        showGlobalNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data
        })
      }, index * 1000) // Espaçar as notificações por 1 segundo
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Teste de Notificações Globais</h1>
          <p className="text-muted-foreground">
            Teste o sistema de notificações que aparece em qualquer página do dashboard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Notificação de Informação
            </CardTitle>
            <CardDescription>
              Notificação padrão para informações gerais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleTestNotification(testNotifications[0])}
              className="w-full"
              variant="outline"
            >
              Testar Notificação Info
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Notificação de Sucesso
            </CardTitle>
            <CardDescription>
              Notificação para ações bem-sucedidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleTestNotification(testNotifications[1])}
              className="w-full"
              variant="outline"
            >
              Testar Notificação Sucesso
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Notificação de Aviso
            </CardTitle>
            <CardDescription>
              Notificação para situações que requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleTestNotification(testNotifications[2])}
              className="w-full"
              variant="outline"
            >
              Testar Notificação Aviso
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Notificação de Erro
            </CardTitle>
            <CardDescription>
              Notificação para erros e problemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleTestNotification(testNotifications[3])}
              className="w-full"
              variant="outline"
            >
              Testar Notificação Erro
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teste em Sequência</CardTitle>
          <CardDescription>
            Teste múltiplas notificações em sequência para ver como elas se comportam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleMultipleNotifications}
            className="w-full"
            size="lg"
          >
            Testar Múltiplas Notificações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
            <p>Clique em qualquer botão acima para disparar uma notificação global</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
            <p>A notificação aparecerá no canto superior direito da tela</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
            <p>A notificação desaparecerá automaticamente após 5 segundos</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">4</div>
            <p>Você pode fechar manualmente clicando no X</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">5</div>
            <p>Navegue para outras páginas - as notificações aparecerão em qualquer lugar do dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}