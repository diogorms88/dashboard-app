'use client'

import { useState } from 'react'
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

interface PlanningProjectModalProps {
  onSuccess: () => void
}

export function PlanningProjectModal({ onSuccess }: PlanningProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [newTeamMember, setNewTeamMember] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'projeto',
    priority: 'media',
    start_date: '',
    end_date: '',
    budget: '',
    responsible_person: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.start_date || !formData.end_date || !formData.responsible_person) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Validar datas
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    
    if (endDate <= startDate) {
      toast.error('A data de fim deve ser posterior à data de início')
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        team_members: teamMembers
      }

      await apiRequest('/api/planning-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      onSuccess()
    } catch (error) {
      toast.error('Erro ao criar projeto de planejamento')
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

  // Calcular duração do projeto
  const calculateDuration = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return 0
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas do Projeto</CardTitle>
          <CardDescription>
            Defina as características principais do projeto de planejamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Título do Projeto *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Implementação do Sistema de Qualidade ISO 9001"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição do Projeto</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva os objetivos, escopo e principais entregas do projeto..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="project_type">Tipo de Projeto *</Label>
              <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projeto">Projeto</SelectItem>
                  <SelectItem value="melhoria">Melhoria</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                  <SelectItem value="auditoria">Auditoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
              <Label htmlFor="responsible_person">Responsável Principal *</Label>
              <Input
                id="responsible_person"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                placeholder="Nome do gerente/responsável do projeto"
                required
              />
            </div>

            <div>
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cronograma */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma do Projeto</CardTitle>
          <CardDescription>
            Defina as datas de início e fim do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">Data de Fim *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          
          {formData.start_date && formData.end_date && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Duração do projeto:</strong> {calculateDuration()} dias
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipe */}
      <Card>
        <CardHeader>
          <CardTitle>Equipe do Projeto</CardTitle>
          <CardDescription>
            Adicione os membros da equipe que participarão do projeto
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
          
          <div className="text-sm text-gray-600">
            <p><strong>Dica:</strong> Adicione todos os membros que participarão do projeto, incluindo stakeholders e colaboradores.</p>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {(formData.title || formData.responsible_person || formData.start_date || formData.end_date) && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {formData.title && <p><strong>Título:</strong> {formData.title}</p>}
              {formData.responsible_person && <p><strong>Responsável:</strong> {formData.responsible_person}</p>}
              {formData.project_type && (
                <p><strong>Tipo:</strong> {formData.project_type.charAt(0).toUpperCase() + formData.project_type.slice(1)}</p>
              )}
              {formData.priority && (
                <p><strong>Prioridade:</strong> {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}</p>
              )}
              {formData.start_date && formData.end_date && (
                <p><strong>Período:</strong> {new Date(formData.start_date).toLocaleDateString('pt-BR')} até {new Date(formData.end_date).toLocaleDateString('pt-BR')}</p>
              )}
              {formData.budget && (
                <p><strong>Orçamento:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.budget))}</p>
              )}
              {teamMembers.length > 0 && (
                <p><strong>Equipe:</strong> {teamMembers.length} membros</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Projeto'}
        </Button>
      </div>
    </form>
  )
}