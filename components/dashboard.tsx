"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User } from "lucide-react"
import { NotificationsButton } from "@/components/notifications-button"

export function Dashboard() {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  const getRoleColor = (papel: string) => {
    switch (papel) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-purple-100 text-purple-800'
      case 'operator':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (papel: string) => {
    switch (papel) {
      case 'admin': return 'Administrador'
      case 'manager': return 'Gerente'
      case 'operator': return 'Operador'
      case 'viewer': return 'Visualizador'
      default: return papel
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="font-medium">{user.nome}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.papel)}`}>
                {getRoleLabel(user.papel)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsButton />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo!</CardTitle>
                <CardDescription>
                  Você está logado como {getRoleLabel(user.papel)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Nome:</strong> {user.nome}</p>
                  <p><strong>Papel:</strong> {getRoleLabel(user.papel)}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>
                  Informações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>Sistema funcionando normalmente</p>
                  <p>Última atualização: {new Date().toLocaleString('pt-BR')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Funcionalidades disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.papel === 'admin' && (
                    <p>✓ Acesso total ao sistema</p>
                  )}
                  {(user.papel === 'admin' || user.papel === 'manager') && (
                    <p>✓ Gerenciar usuários</p>
                  )}
                  {(user.papel === 'admin' || user.papel === 'manager' || user.papel === 'operator') && (
                    <p>✓ Operar sistema</p>
                  )}
                  <p>✓ Visualizar dados</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div className="p-4">
              <h2 className="text-2xl font-bold mb-4">Área Principal</h2>
              <p className="text-muted-foreground">
                Esta é a área principal do dashboard. Aqui você pode adicionar o conteúdo específico da sua aplicação.
              </p>
            </div>
          </div>
        </div>
    </div>
  )
}