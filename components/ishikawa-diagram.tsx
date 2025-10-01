'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Plus, X, Edit3, Save, Trash2, Target, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface IshikawaItem {
  id: number
  category: string
  cause_description: string
  subcause_description?: string
  impact_level: number
}

interface FiveWhysAnalysis {
  id: number
  problem_statement: string
  why_1?: string
  why_2?: string
  why_3?: string
  why_4?: string
  why_5?: string
  root_cause?: string
}

interface IshikawaDiagramProps {
  formId: number
  ishikawaData: IshikawaItem[]
  problemDescription: string
  fiveWhysData?: FiveWhysAnalysis
  onUpdate: () => void
}

const ishikawaCategories = [
  { value: 'mao_de_obra', label: 'Mão de Obra', color: 'bg-white border-black', titleColor: 'text-black', icon: '👥' },
  { value: 'maquina', label: 'Máquina', color: 'bg-white border-black', titleColor: 'text-black', icon: '⚙️' },
  { value: 'material', label: 'Material', color: 'bg-white border-black', titleColor: 'text-black', icon: '📦' },
  { value: 'metodo', label: 'Método', color: 'bg-white border-black', titleColor: 'text-black', icon: '📋' },
  { value: 'meio_ambiente', label: 'Meio Ambiente', color: 'bg-white border-black', titleColor: 'text-black', icon: '🌿' },
  { value: 'medicao', label: 'Medição', color: 'bg-white border-black', titleColor: 'text-black', icon: '📏' }
]

export function IshikawaDiagram({ formId, ishikawaData, problemDescription, fiveWhysData, onUpdate }: IshikawaDiagramProps) {
  const [isAddingCause, setIsAddingCause] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [newCause, setNewCause] = useState({
    category: '',
    cause_description: '',
    subcause_description: '',
    impact_level: 3
  })
  const [editingCause, setEditingCause] = useState<IshikawaItem | null>(null)
  const [showIshikawa, setShowIshikawa] = useState(true)
  const [activeTab, setActiveTab] = useState('ishikawa')
  
  // 5 Whys states
  const [fiveWhys, setFiveWhys] = useState<Partial<FiveWhysAnalysis>>({
    problem_statement: fiveWhysData?.problem_statement || '',
    why_1: fiveWhysData?.why_1 || '',
    why_2: fiveWhysData?.why_2 || '',
    why_3: fiveWhysData?.why_3 || '',
    why_4: fiveWhysData?.why_4 || '',
    why_5: fiveWhysData?.why_5 || '',
    root_cause: fiveWhysData?.root_cause || ''
  })

  const addCause = async () => {
    if (!newCause.category || !newCause.cause_description) {
      toast.error('Preencha categoria e descrição da causa')
      return
    }

    try {
      await apiRequest(`/forms-8d/${formId}/ishikawa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCause)
      })
      
      setNewCause({
        category: '',
        cause_description: '',
        subcause_description: '',
        impact_level: 3
      })
      setIsAddingCause(false)
      setSelectedCategory('')
      
      onUpdate()
      toast.success('Causa adicionada ao diagrama Ishikawa')
    } catch (error) {

      toast.error('Erro ao adicionar causa')
    }
  }

  const updateCause = async () => {
    if (!editingCause) return

    try {
      await apiRequest(`/ishikawa/${editingCause.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cause_description: editingCause.cause_description,
          subcause_description: editingCause.subcause_description,
          impact_level: editingCause.impact_level
        })
      })
      
      setEditingCause(null)
      onUpdate()
      toast.success('Causa atualizada com sucesso')
    } catch (error) {

      toast.error('Erro ao atualizar causa')
    }
  }

  const deleteCause = async (causeId: number) => {
    if (!confirm('Tem certeza que deseja remover esta causa?')) return

    try {
      await apiRequest(`/ishikawa/${causeId}`, { method: 'DELETE' })
      onUpdate()
      toast.success('Causa removida do diagrama')
    } catch (error) {

      toast.error('Erro ao remover causa')
    }
  }

  const getCausesByCategory = (category: string) => {
    return ishikawaData.filter(item => item.category === category)
  }

  const getCategoryInfo = (categoryValue: string) => {
    return ishikawaCategories.find(cat => cat.value === categoryValue)
  }

  const openAddCauseModal = (category: string) => {
    setSelectedCategory(category)
    setNewCause({ ...newCause, category })
    setIsAddingCause(true)
  }

  const startEditingCause = (cause: IshikawaItem) => {
    setEditingCause({ ...cause })
  }

  const saveFiveWhys = async () => {
    if (!fiveWhys.problem_statement) {
      toast.error('Preencha a declaração do problema')
      return
    }

    try {
      await apiRequest(`/forms-8d/${formId}/five-whys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fiveWhys)
      })
      
      onUpdate()
      toast.success('Análise 5 Porquês salva com sucesso')
    } catch (error) {

      toast.error('Erro ao salvar análise 5 Porquês')
    }
  }

  return (
    <div className="space-y-6">
      {/* Análise de Causa Raiz - Tabs */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center">
              <Target className="h-6 w-6 mr-3 text-slate-600" />
              Análise de Causa Raiz - D4
            </div>
          </CardTitle>
          <CardDescription className="text-base">
            Use as ferramentas de análise para identificar a causa raiz do problema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ishikawa">Diagrama Ishikawa</TabsTrigger>
              <TabsTrigger value="five-whys">5 Porquês</TabsTrigger>
            </TabsList>

            <TabsContent value="ishikawa" className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Diagrama de Ishikawa - Análise dos 6M</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIshikawa(!showIshikawa)}
                  className="flex items-center gap-2"
                >
                  {showIshikawa ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showIshikawa ? 'Ocultar Diagrama' : 'Mostrar Diagrama'}
                </Button>
              </div>

              {showIshikawa && (
                <div className="p-4 bg-white border rounded-lg">
          {/* Container da Espinha de Peixe - Layout Horizontal Compacto */}
          <div className="relative w-full h-[680px] overflow-hidden">
            {/* Espinha Principal HORIZONTAL */}
            <div className="absolute top-1/2 left-8 right-64 h-1 bg-slate-800 transform -translate-y-1/2"></div>
            
            {/* Cabeça do Peixe - PROBLEMA do lado direito */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center">
              <div className="w-0 h-0 border-l-[30px] border-l-slate-800 border-t-[25px] border-t-transparent border-b-[25px] border-b-transparent"></div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg shadow-md w-[200px] ml-2">
                <h3 className="font-bold text-sm mb-1">PROBLEMA</h3>
                <p className="text-xs leading-tight opacity-90 line-clamp-2">{problemDescription}</p>
              </div>
            </div>

            {/* Categorias SUPERIORES (3 em cima) */}
            <div className="absolute top-4 left-8 right-72">
              {ishikawaCategories.slice(0, 3).map((category, index) => {
                const causes = getCausesByCategory(category.value)
                const leftPosition = (index * 32) + 8 // Distribuição: 8%, 40%, 72%
                
                return (
                  <div key={category.value} className="absolute" style={{ left: `${leftPosition}%` }}>
                    {/* Linha diagonal SUPERIOR - apontando PARA a espinha */}
                    <div 
                      className="absolute bottom-0 left-1/2 w-0.5 h-16 bg-slate-600 origin-top transform -translate-x-1/2"
                      style={{ transform: 'translateX(-50%) rotate(-45deg)' }}
                    ></div>
                    
                    {/* Card da categoria */}
                    <Card className={`w-56 ${category.color} border-2 shadow-md hover:shadow-lg transition-all duration-200`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{category.icon}</span>
                            <span className={`font-bold ${category.titleColor}`}>{category.label}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAddCauseModal(category.value)}
                            className="h-6 w-6 p-0 hover:bg-white/50"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-1 max-h-20 overflow-y-auto">
                        {causes.length > 0 ? (
                          causes.map((cause) => (
                            <div key={cause.id} className="bg-white/70 p-2 rounded border text-xs hover:bg-white/90 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-1">
                                  <p className="font-medium leading-tight">{cause.cause_description}</p>
                                  {cause.subcause_description && (
                                    <p className="text-xs text-gray-600 mt-1">→ {cause.subcause_description}</p>
                                  )}
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs mt-1 ${
                                      cause.impact_level >= 4 ? 'border-red-300 text-red-700' : 
                                      cause.impact_level >= 3 ? 'border-yellow-300 text-yellow-700' : 
                                      'border-green-300 text-green-700'
                                    }`}
                                  >
                                    {cause.impact_level}/5
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingCause(cause)}
                                    className="h-5 w-5 p-0 hover:bg-blue-100"
                                  >
                                    <Edit3 className="h-2.5 w-2.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteCause(cause.id)}
                                    className="h-5 w-5 p-0 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-2 text-gray-500 text-xs">
                            <p>Nenhuma causa</p>
                            <p>Clique + para adicionar</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            {/* Categorias INFERIORES (3 embaixo) */}
            <div className="absolute bottom-48 left-8 right-72">
              {ishikawaCategories.slice(3, 6).map((category, index) => {
                const causes = getCausesByCategory(category.value)
                const leftPosition = (index * 32) + 8 // Distribuição: 8%, 40%, 72%
                
                return (
                  <div key={category.value} className="absolute" style={{ left: `${leftPosition}%` }}>
                    {/* Linha diagonal INFERIOR - apontando PARA a espinha */}
                    <div 
                      className="absolute top-0 left-1/2 w-0.5 h-16 bg-slate-600 origin-bottom transform -translate-x-1/2"
                      style={{ transform: 'translateX(-50%) rotate(45deg)' }}
                    ></div>
                    
                    {/* Card da categoria */}
                    <Card className={`w-56 ${category.color} border-2 shadow-md hover:shadow-lg transition-all duration-200`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{category.icon}</span>
                            <span className={`font-bold ${category.titleColor}`}>{category.label}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAddCauseModal(category.value)}
                            className="h-6 w-6 p-0 hover:bg-white/50"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-1 max-h-20 overflow-y-auto">
                        {causes.length > 0 ? (
                          causes.map((cause) => (
                            <div key={cause.id} className="bg-white/70 p-2 rounded border text-xs hover:bg-white/90 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-1">
                                  <p className="font-medium leading-tight">{cause.cause_description}</p>
                                  {cause.subcause_description && (
                                    <p className="text-xs text-gray-600 mt-1">→ {cause.subcause_description}</p>
                                  )}
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs mt-1 ${
                                      cause.impact_level >= 4 ? 'border-red-300 text-red-700' : 
                                      cause.impact_level >= 3 ? 'border-yellow-300 text-yellow-700' : 
                                      'border-green-300 text-green-700'
                                    }`}
                                  >
                                    {cause.impact_level}/5
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingCause(cause)}
                                    className="h-5 w-5 p-0 hover:bg-blue-100"
                                  >
                                    <Edit3 className="h-2.5 w-2.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteCause(cause.id)}
                                    className="h-5 w-5 p-0 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-2 text-gray-500 text-xs">
                            <p>Nenhuma causa</p>
                            <p>Clique + para adicionar</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumo da Análise */}
          <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800">Resumo da Análise</h4>
                <p className="text-sm text-slate-600">
                  {ishikawaData.length} causa(s) identificada(s) em {ishikawaCategories.filter(cat => getCausesByCategory(cat.value).length > 0).length} categoria(s)
                </p>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span>Alto: {ishikawaData.filter(c => c.impact_level >= 4).length}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span>Médio: {ishikawaData.filter(c => c.impact_level === 3).length}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span>Baixo: {ishikawaData.filter(c => c.impact_level <= 2).length}</span>
                </div>
              </div>
            </div>
                </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="five-whys" className="p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="problem_statement" className="text-sm font-medium">
                    Declaração do Problema <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="problem_statement"
                    value={fiveWhys.problem_statement || ''}
                    onChange={(e) => setFiveWhys({...fiveWhys, problem_statement: e.target.value})}
                    placeholder="Descreva claramente o problema a ser analisado..."
                    rows={3}
                  />
                </div>
                
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num}>
                    <Label htmlFor={`why_${num}`} className="text-sm font-medium">
                      Por que {num}?
                    </Label>
                    <Textarea
                      id={`why_${num}`}
                      value={fiveWhys[`why_${num}` as keyof FiveWhysAnalysis] as string || ''}
                      onChange={(e) => setFiveWhys({...fiveWhys, [`why_${num}`]: e.target.value})}
                      placeholder={`Responda ao ${num}º porquê...`}
                      rows={2}
                    />
                  </div>
                ))}
                
                <div>
                  <Label htmlFor="root_cause" className="text-sm font-medium">
                    Causa Raiz Identificada
                  </Label>
                  <Textarea
                    id="root_cause"
                    value={fiveWhys.root_cause || ''}
                    onChange={(e) => setFiveWhys({...fiveWhys, root_cause: e.target.value})}
                    placeholder="Com base na análise, qual é a causa raiz do problema?"
                    rows={3}
                  />
                </div>
                
                <Button onClick={saveFiveWhys} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Análise 5 Porquês
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal para Adicionar Causa */}
      <Dialog open={isAddingCause} onOpenChange={setIsAddingCause}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mr-3">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              Adicionar Causa - {getCategoryInfo(selectedCategory)?.label}
            </DialogTitle>
            <DialogDescription className="text-base">
              Identifique uma possível causa relacionada à categoria <strong>{getCategoryInfo(selectedCategory)?.label}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-1">
              <Label htmlFor="cause_description" className="text-sm font-medium">
                Descrição da Causa <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="cause_description"
                value={newCause.cause_description}
                onChange={(e) => setNewCause({ ...newCause, cause_description: e.target.value })}
                placeholder="Descreva claramente a possível causa do problema..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subcause_description" className="text-sm font-medium">
                Subcausa ou Detalhamento <span className="text-gray-400">(Opcional)</span>
              </Label>
              <Input
                id="subcause_description"
                value={newCause.subcause_description}
                onChange={(e) => setNewCause({ ...newCause, subcause_description: e.target.value })}
                placeholder="Adicione detalhes ou uma subcausa..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="impact_level" className="text-sm font-medium">
                Nível de Impacto
              </Label>
              <Select value={newCause.impact_level.toString()} onValueChange={(value) => setNewCause({ ...newCause, impact_level: parseInt(value) })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                      1 - Muito Baixo
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-300 rounded-full mr-2"></div>
                      2 - Baixo
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                      3 - Médio
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                      4 - Alto
                    </div>
                  </SelectItem>
                  <SelectItem value="5">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                      5 - Muito Alto
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddingCause(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={addCause} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Adicionar Causa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Causa */}
      <Dialog open={!!editingCause} onOpenChange={() => setEditingCause(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mr-3">
                <Edit3 className="h-5 w-5 text-orange-600" />
              </div>
              Editar Causa - {editingCause && getCategoryInfo(editingCause.category)?.label}
            </DialogTitle>
            <DialogDescription className="text-base">
              Modifique os detalhes da causa identificada
            </DialogDescription>
          </DialogHeader>
          {editingCause && (
            <div className="space-y-6 py-4">
              <div className="space-y-1">
                <Label htmlFor="edit_cause_description" className="text-sm font-medium">
                  Descrição da Causa <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="edit_cause_description"
                  value={editingCause.cause_description}
                  onChange={(e) => setEditingCause({ ...editingCause, cause_description: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_subcause_description" className="text-sm font-medium">
                  Subcausa ou Detalhamento <span className="text-gray-400">(Opcional)</span>
                </Label>
                <Input
                  id="edit_subcause_description"
                  value={editingCause.subcause_description || ''}
                  onChange={(e) => setEditingCause({ ...editingCause, subcause_description: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_impact_level" className="text-sm font-medium">
                  Nível de Impacto
                </Label>
                <Select value={editingCause.impact_level.toString()} onValueChange={(value) => setEditingCause({ ...editingCause, impact_level: parseInt(value) })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                        1 - Muito Baixo
                      </div>
                    </SelectItem>
                    <SelectItem value="2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-300 rounded-full mr-2"></div>
                        2 - Baixo
                      </div>
                    </SelectItem>
                    <SelectItem value="3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                        3 - Médio
                      </div>
                    </SelectItem>
                    <SelectItem value="4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                        4 - Alto
                      </div>
                    </SelectItem>
                    <SelectItem value="5">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                        5 - Muito Alto
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingCause(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={updateCause} className="bg-orange-600 hover:bg-orange-700">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
