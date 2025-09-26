"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { MoreHorizontal, Plus, Edit, UserX, RotateCcw, Trash2, Settings } from "lucide-react"
import { userService } from '@/lib/api'
import { AuthWrapper } from '@/components/auth-wrapper'

interface User {
  id: number;
  username: string;
  nome: string;
  papel: 'admin' | 'manager' | 'operator' | 'viewer';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const roleLabels = {
  admin: 'Administrador',
  manager: 'Gerente',
  operator: 'Operador',
  viewer: 'Visualizador'
}

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-purple-100 text-purple-800',
  operator: 'bg-green-100 text-green-800',
  viewer: 'bg-blue-100 text-blue-800'
}

export default function SettingsPage() {
  return (
    <AuthWrapper requiredRoles={["admin", "manager"]}>
      <SettingsContent />
    </AuthWrapper>
  )
}

function SettingsContent() {
  const [users, setUsers] = useState<User[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    nome: '',
    papel: 'viewer' as User['papel'],
    senha: ''
  })
  // Using sonner for toast notifications

  // Carregar usuários da API
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getUsers()
      setUsers(allUsers)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    }
  }

  const handleCreateUser = async () => {
    if (!formData.username || !formData.nome || !formData.senha) {
      toast.error("Todos os campos são obrigatórios")
      return
    }

    try {
      await userService.createUser({
        username: formData.username,
        nome: formData.nome,
        papel: formData.papel,
        senha: formData.senha
      })
      
      setFormData({ username: '', nome: '', papel: 'viewer', senha: '' })
      setIsCreateDialogOpen(false)
      
      // Recarregar lista de usuários
      await loadUsers()
      
      toast.success("Usuário criado com sucesso")
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error('Erro ao criar usuário')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser || !formData.username || !formData.nome) {
      toast.error("Todos os campos são obrigatórios")
      return
    }

    try {
      await userService.updateUser(selectedUser.id, {
        username: formData.username,
        nome: formData.nome,
        papel: formData.papel
      })
      
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      
      // Recarregar lista de usuários
      await loadUsers()
      
      toast.success("Usuário atualizado com sucesso")
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao atualizar usuário')
    }
  }

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return
      
      await userService.updateUser(userId, {
        username: user.username,
        nome: user.nome,
        papel: user.papel,
        ativo: !user.ativo
      })
      
      // Recarregar lista de usuários
      await loadUsers()
      
      toast.success("Status do usuário atualizado")
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status do usuário')
    }
  }

  const handleResetPassword = async (userId: number) => {
    try {
      await userService.resetPassword(userId, '123456')
      toast.success("Senha resetada para: 123456")
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      toast.error('Erro ao resetar senha')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      await userService.deleteUser(userId)
      
      // Recarregar lista de usuários
      await loadUsers()
      
      toast.success("Usuário removido com sucesso")
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast.error('Erro ao remover usuário')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      nome: user.nome,
      papel: user.papel,
      senha: ''
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações
          </h2>
          <p className="text-muted-foreground">
            Gerencie usuários e permissões do sistema
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {/* Formulário de Criação de Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Novo Usuário
            </CardTitle>
            <CardDescription>
              Adicione um novo usuário ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo usuário
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Digite o nome de usuário"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="papel">Papel</Label>
                    <Select value={formData.papel} onValueChange={(value) => setFormData({ ...formData, papel: value as User['papel'] })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                        <SelectItem value="operator">Operador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Digite a senha"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateUser}>
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.nome}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.papel]}>
                        {roleLabels[user.papel]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.ativo ? "default" : "secondary"}>
                        {user.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                            <UserX className="mr-2 h-4 w-4" />
                            {user.ativo ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique os dados do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Nome de Usuário</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Digite o nome de usuário"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome Completo</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-papel">Papel</Label>
              <Select value={formData.papel} onValueChange={(value) => setFormData({ ...formData, papel: value as User['papel'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditUser}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}