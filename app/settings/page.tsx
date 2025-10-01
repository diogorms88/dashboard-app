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

  // Carregar usuÃ¡rios da API
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getUsers()
      setUsers(allUsers)
    } catch (error) {
      toast.error('Erro ao carregar usuÃ¡rios')
    }
  }

  const handleCreateUser = async () => {
    if (!formData.username || !formData.nome || !formData.senha) {
      toast.error("Todos os campos sÃ£o obrigatÃ³rios")
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
      
      // Recarregar lista de usuÃ¡rios
      await loadUsers()
      
      toast.success("UsuÃ¡rio criado com sucesso")
    } catch (error) {
      toast.error('Erro ao criar usuÃ¡rio')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser || !formData.username || !formData.nome) {
      toast.error("Todos os campos sÃ£o obrigatÃ³rios")
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
      
      // Recarregar lista de usuÃ¡rios
      await loadUsers()
      
      toast.success("UsuÃ¡rio atualizado com sucesso")
    } catch (error) {
      toast.error('Erro ao atualizar usuÃ¡rio')
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
      
      // Recarregar lista de usuÃ¡rios
      await loadUsers()
      
      toast.success("Status do usuÃ¡rio atualizado")
    } catch (error) {
      toast.error('Erro ao atualizar status do usuÃ¡rio');
    }
  }

  const handleResetPassword = async (userId: number) => {
    try {
      await userService.resetPassword(userId, '123456')
      toast.success("Senha resetada para: 123456")
    } catch (error) {
      toast.error('Erro ao resetar senha')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      await userService.deleteUser(userId)
      
      // Recarregar lista de usuÃ¡rios
      await loadUsers()
      
      toast.success("UsuÃ¡rio removido com sucesso")
    } catch (error) {
      toast.error('Erro ao remover usuÃ¡rio')
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
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6" role="main">
      <header className="flex items-center justify-between space-y-2">
        <div>
          <h1 id="settings-title" className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" aria-hidden="true" />
            ConfiguraÃ§Ãµes
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuÃ¡rios e permissÃµes do sistema
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-1">
        {/* FormulÃ¡rio de CriaÃ§Ã£o de UsuÃ¡rio */}
        <section aria-labelledby="create-user-title">
          <Card role="region" aria-labelledby="create-user-title">
            <CardHeader>
              <CardTitle id="create-user-title" className="flex items-center gap-2">
                <Plus className="h-5 w-5" aria-hidden="true" />
                Criar Novo UsuÃ¡rio
              </CardTitle>
              <CardDescription>
                Adicione um novo usuÃ¡rio ao sistema
              </CardDescription>
            </CardHeader>
          <CardContent>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button aria-label="Abrir formulÃ¡rio para adicionar novo usuÃ¡rio">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Adicionar UsuÃ¡rio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" role="dialog" aria-labelledby="create-dialog-title" aria-describedby="create-dialog-description">
                <DialogHeader>
                  <DialogTitle id="create-dialog-title">Criar Novo UsuÃ¡rio</DialogTitle>
                  <DialogDescription id="create-dialog-description">
                    Preencha os dados do novo usuÃ¡rio
                  </DialogDescription>
                </DialogHeader>
                <form role="form" aria-label="FormulÃ¡rio de criaÃ§Ã£o de usuÃ¡rio" onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}>
                  <fieldset className="grid gap-4 py-4">
                    <legend className="sr-only">Dados do novo usuÃ¡rio</legend>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Nome de UsuÃ¡rio</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Digite o nome de usuÃ¡rio"
                        required
                        aria-required="true"
                        aria-describedby="username-help"
                      />
                      <div id="username-help" className="sr-only">
                        Nome Ãºnico para identificar o usuÃ¡rio no sistema
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Digite o nome completo"
                        required
                        aria-required="true"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="papel">Papel</Label>
                      <Select value={formData.papel} onValueChange={(value) => setFormData({ ...formData, papel: value as User['papel'] })}>
                        <SelectTrigger id="papel" aria-label="Selecionar papel do usuÃ¡rio" role="listbox">
                          <SelectValue placeholder="Selecione o papel" />
                        </SelectTrigger>
                        <SelectContent role="listbox" aria-label="OpÃ§Ãµes de papel">
                          <SelectItem value="viewer" role="option">Visualizador</SelectItem>
                          <SelectItem value="operator" role="option">Operador</SelectItem>
                          <SelectItem value="manager" role="option">Gerente</SelectItem>
                          <SelectItem value="admin" role="option">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="senha">Senha</Label>
                      <Input
                        id="senha"
                        name="senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        placeholder="Digite a senha"
                        required
                        aria-required="true"
                        aria-describedby="senha-help"
                      />
                      <div id="senha-help" className="sr-only">
                        Senha para acesso do usuÃ¡rio ao sistema
                      </div>
                    </div>
                  </fieldset>
                  <DialogFooter>
                    <Button type="submit" aria-label="Criar novo usuÃ¡rio com os dados informados">
                      Criar UsuÃ¡rio
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
          </Card>
        </section>

        {/* Tabela de UsuÃ¡rios */}
        <section aria-labelledby="users-table-title">
          <Card role="region" aria-labelledby="users-table-title">
            <CardHeader>
              <CardTitle id="users-table-title">UsuÃ¡rios Cadastrados</CardTitle>
              <CardDescription>
                Lista de todos os usuÃ¡rios do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto" role="region" aria-label="Tabela de usuÃ¡rios" tabIndex={0}>
                <Table role="table" aria-label="Lista de usuÃ¡rios cadastrados no sistema">
                  <TableHeader role="rowgroup">
                    <TableRow role="row">
                      <TableHead role="columnheader" scope="col">ID</TableHead>
                      <TableHead role="columnheader" scope="col">UsuÃ¡rio</TableHead>
                      <TableHead role="columnheader" scope="col">Nome</TableHead>
                      <TableHead role="columnheader" scope="col">Papel</TableHead>
                      <TableHead role="columnheader" scope="col">Status</TableHead>
                      <TableHead role="columnheader" scope="col">Criado em</TableHead>
                      <TableHead role="columnheader" scope="col" className="text-right">AÃ§Ãµes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody role="rowgroup">
                    {users.map((user) => (
                      <TableRow key={user.id} role="row">
                        <TableCell role="cell" scope="row" className="font-medium" aria-label={`ID do usuÃ¡rio: ${user.id}`}>{user.id}</TableCell>
                        <TableCell role="cell" aria-label={`Nome de usuÃ¡rio: ${user.username}`}>{user.username}</TableCell>
                        <TableCell role="cell" aria-label={`Nome completo: ${user.nome}`}>{user.nome}</TableCell>
                        <TableCell role="cell">
                          <Badge className={roleColors[user.papel]} aria-label={`Papel: ${roleLabels[user.papel]}`}>
                            {roleLabels[user.papel]}
                          </Badge>
                        </TableCell>
                        <TableCell role="cell">
                          <Badge variant={user.ativo ? "default" : "secondary"} aria-label={`Status: ${user.ativo ? "Ativo" : "Inativo"}`}>
                            {user.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell role="cell" aria-label={`Criado em: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`}>
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell role="cell" className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                aria-label={`AÃ§Ãµes para usuÃ¡rio ${user.nome}`}
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                <span className="sr-only">Abrir menu de aÃ§Ãµes para {user.nome}</span>
                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" role="menu" aria-label={`Menu de aÃ§Ãµes para ${user.nome}`}>
                              <DropdownMenuItem role="menuitem" onClick={() => openEditDialog(user)} aria-label={`Editar usuÃ¡rio ${user.nome}`}>
                                <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem role="menuitem" onClick={() => handleToggleUserStatus(user.id)} aria-label={`${user.ativo ? 'Desativar' : 'Ativar'} usuÃ¡rio ${user.nome}`}>
                                <UserX className="mr-2 h-4 w-4" aria-hidden="true" />
                                {user.ativo ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem role="menuitem" onClick={() => handleResetPassword(user.id)} aria-label={`Resetar senha do usuÃ¡rio ${user.nome}`}>
                                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                                Resetar Senha
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                role="menuitem"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600"
                                aria-label={`Apagar usuÃ¡rio ${user.nome}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                Apagar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
          </Card>
        </section>
      </div>

      {/* Dialog de EdiÃ§Ã£o */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" role="dialog" aria-labelledby="edit-dialog-title" aria-describedby="edit-dialog-description">
          <DialogHeader>
            <DialogTitle id="edit-dialog-title">Editar UsuÃ¡rio</DialogTitle>
            <DialogDescription id="edit-dialog-description">
              Modifique os dados do usuÃ¡rio
            </DialogDescription>
          </DialogHeader>
          <form role="form" aria-label="FormulÃ¡rio de ediÃ§Ã£o de usuÃ¡rio" onSubmit={(e) => { e.preventDefault(); handleEditUser(); }}>
            <fieldset className="grid gap-4 py-4">
              <legend className="sr-only">Dados do usuÃ¡rio para ediÃ§Ã£o</legend>
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Nome de UsuÃ¡rio</Label>
                <Input
                  id="edit-username"
                  name="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Digite o nome de usuÃ¡rio"
                  required
                  aria-required="true"
                  aria-describedby="edit-username-help"
                />
                <div id="edit-username-help" className="sr-only">
                  Nome Ãºnico para identificar o usuÃ¡rio no sistema
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nome">Nome Completo</Label>
                <Input
                  id="edit-nome"
                  name="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Digite o nome completo"
                  required
                  aria-required="true"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-papel">Papel</Label>
                <Select value={formData.papel} onValueChange={(value) => setFormData({ ...formData, papel: value as User['papel'] })}>
                  <SelectTrigger id="edit-papel" aria-label="Selecionar papel do usuÃ¡rio" role="listbox">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent role="listbox" aria-label="OpÃ§Ãµes de papel">
                    <SelectItem value="viewer" role="option">Visualizador</SelectItem>
                    <SelectItem value="operator" role="option">Operador</SelectItem>
                    <SelectItem value="manager" role="option">Gerente</SelectItem>
                    <SelectItem value="admin" role="option">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </fieldset>
            <DialogFooter>
              <Button type="submit" aria-label="Salvar alteraÃ§Ãµes do usuÃ¡rio">
                Salvar AlteraÃ§Ãµes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}

