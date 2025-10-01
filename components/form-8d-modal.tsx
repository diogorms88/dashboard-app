'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface User {
  id: number
  nome: string
  username: string
}

interface Form8DModalProps {
  onSuccess: () => void
}

export function Form8DModal({ onSuccess }: Form8DModalProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [newTeamMember, setNewTeamMember] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    problem_description: '',
    problem_date: '',
    detection_date: '',
    customer_impact: '',
    severity_level: 'media',
    assigned_to: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await apiRequest('/users')
      setUsers(response)
    } catch (error) {
      toast.error('Erro ao carregar usuários')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.problem_description || !formData.problem_date) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        ...formData,
        team_members: teamMembers,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null
      }

      await apiRequest('/forms-8d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      onSuccess()
    } catch (error) {
      toast.error('Erro ao criar formulário 8D')
    } finally {
      setLoading(false)
    }
  }

  const addTeamMember = () => {
    if (newTeamMember.trim() && !teamMembers.includes(newTeamMember.trim())) {
      setTeamMembers([...teamMembers, newTeamMember.trim()])
      setNewTeamMember('')
    }
  }

  const removeTeamMember = (member: string) => {
    setTeamMembers(teamMembers.filter(m => m !== member))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTeamMember()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas do Problema</CardTitle>
          <CardDescription>
            Descreva o problema identificado e suas características principais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Título do Problema *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Defeito na pintura do modelo X"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="problem_description">Descrição Detalhada do Problema *</Label>
              <Textarea
                id="problem_description"
                value={formData.problem_description}
                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                placeholder="Descreva o problema de forma detalhada, incluindo sintomas, frequência e impactos observados..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="problem_date">Data do Problema *</Label>
              <Input
                id="problem_date"
                type="date"
                value={formData.problem_date}
                onChange={(e) => setFormData({ ...formData, problem_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="detection_date">Data de Detecção</Label>
              <Input
                id="detection_date"
                type="date"
                value={formData.detection_date}
                onChange={(e) => setFormData({ ...formData, detection_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="severity_level">Nível de Severidade *</Label>
              <Select value={formData.severity_level} onValueChange={(value) => setFormData({ ...formData, severity_level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_to">Responsável Principal</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.nome} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="customer_impact">Impacto no Cliente</Label>
              <Textarea
                id="customer_impact"
                value={formData.customer_impact}
                onChange={(e) => setFormData({ ...formData, customer_impact: e.target.value })}
                placeholder="Descreva como este problema afeta ou pode afetar o cliente..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipe */}
      <Card>
        <CardHeader>
          <CardTitle>Equipe do Projeto 8D</CardTitle>
          <CardDescription>
            Adicione os membros da equipe que participarão da análise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTeamMember}
              onChange={(e) => setNewTeamMember(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nome do membro da equipe"
              className="flex-1"
            />
            <Button type="button" onClick={addTeamMember} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {teamMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((member, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {member}
                  <button
                    type="button"
                    onClick={() => removeTeamMember(member)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Formulário 8D'}
        </Button>
      </div>
    </form>
  )
}