'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Save, RotateCcw, Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useConfiguracaoConsumo, type ConfiguracaoConsumo, type EspecificaItem } from '@/hooks/use-configuracao-consumo';

interface ConfiguracaoConsumoModalProps {
  children?: React.ReactNode;
}

const MODELS = [
  'Polo PA DT', 'Polo PA TR', 'Polo Track DT', 'Polo Track TR',
  'Virtus DT', 'Virtus TR', 'Tera DT', 'Tera Polaina LD', 'Tera Polaina LE',
  'Grade Virtus', 'Grade Virtus GTS', 'Aerofólio', 'Spoiler',
  'Tera Friso DT', 'Tera Friso TR'
];

const COLORS = [
  'Branco', 'Prata', 'Preto', 'Platinum', 'Vermelho',
  'Azul Biscay', 'IceBird', 'ClearWater', 'HyperNova'
];

export function ConfiguracaoConsumoModal({ children }: ConfiguracaoConsumoModalProps) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EspecificaItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<EspecificaItem>>({
    modelo: '',
    cor: '',
    primer: '',
    base: '',
    verniz: ''
  });

  const {
    configuracao,
    loading,
    error,
    loadConfiguracao,
    updateConfiguracao,
    resetConfiguracao
  } = useConfiguracaoConsumo();

  // Carregar configuração quando o modal abre
  useEffect(() => {
    if (open) {
      loadConfiguracao();
    }
  }, [open, loadConfiguracao]);

  // Salvar alterações na configuração
  const handleSaveConfiguracao = async () => {
    if (!configuracao) return;

    try {
      await updateConfiguracao(configuracao.id!, configuracao.configuracao);
      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    }
  };

  // Resetar configuração para padrão
  const handleResetConfiguracao = async () => {
    try {
      await resetConfiguracao();
      toast.success('Configuração resetada para padrão!');
    } catch (error) {
      toast.error('Erro ao resetar configuração');
    }
  };

  // Adicionar nova configuração específica
  const handleAddEspecifica = () => {
    if (!configuracao || !newItem.modelo || !newItem.cor) {
      toast.error('Modelo e cor são obrigatórios');
      return;
    }

    const novaEspecifica: EspecificaItem = {
      modelo: newItem.modelo,
      cor: newItem.cor,
      primer: newItem.primer || '0',
      base: newItem.base || '0',
      verniz: newItem.verniz || '0'
    };

    const novaConfiguracao: ConfiguracaoConsumo = {
      ...configuracao.configuracao,
      especificas: [...configuracao.configuracao.especificas, novaEspecifica]
    };

    updateConfiguracao(configuracao.id!, novaConfiguracao);
    setNewItem({ modelo: '', cor: '', primer: '', base: '', verniz: '' });
    toast.success('Configuração específica adicionada!');
  };

  // Remover configuração específica
  const handleRemoveEspecifica = (index: number) => {
    if (!configuracao) return;

    const novaConfiguracao: ConfiguracaoConsumo = {
      ...configuracao.configuracao,
      especificas: configuracao.configuracao.especificas.filter((_, i) => i !== index)
    };

    updateConfiguracao(configuracao.id!, novaConfiguracao);
    toast.success('Configuração específica removida!');
  };

  // Editar configuração específica
  const handleEditEspecifica = (item: EspecificaItem, index: number) => {
    if (!configuracao) return;

    const novaConfiguracao: ConfiguracaoConsumo = {
      ...configuracao.configuracao,
      especificas: configuracao.configuracao.especificas.map((spec, i) => 
        i === index ? item : spec
      )
    };

    updateConfiguracao(configuracao.id!, novaConfiguracao);
    setEditingItem(null);
    toast.success('Configuração específica atualizada!');
  };

  // Atualizar configuração geral
  const handleUpdateGeral = (material: 'primer' | 'base' | 'verniz', field: string, value: string | number) => {
    if (!configuracao) return;

    const novaConfiguracao: ConfiguracaoConsumo = {
      ...configuracao.configuracao,
      geral: {
        ...configuracao.configuracao.geral,
        [material]: {
          ...configuracao.configuracao.geral[material],
          [field]: value
        }
      }
    };

    updateConfiguracao(configuracao.id!, novaConfiguracao);
  };

  // Atualizar configuração de base por cor
  const handleUpdateBase = (cor: string, field: string, value: string | number) => {
    if (!configuracao) return;

    const novaConfiguracao: ConfiguracaoConsumo = {
      ...configuracao.configuracao,
      bases: {
        ...configuracao.configuracao.bases,
        [cor]: {
          ...configuracao.configuracao.bases[cor],
          [field]: value
        }
      }
    };

    updateConfiguracao(configuracao.id!, novaConfiguracao);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando configurações...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações de Consumo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações de Consumo de Materiais</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="text-red-500 text-sm mb-4">
            Erro: {error}
          </div>
        )}

        <Tabs defaultValue="especificas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="especificas">Configurações Específicas</TabsTrigger>
            <TabsTrigger value="geral">Configurações Gerais</TabsTrigger>
            <TabsTrigger value="bases">Configurações por Cor</TabsTrigger>
          </TabsList>

          {/* Tab de Configurações Específicas */}
          <TabsContent value="especificas" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Consumo Específico por Modelo/Cor</h3>
              <div className="space-x-2">
                <Button onClick={handleSaveConfiguracao} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={handleResetConfiguracao} disabled={loading}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </div>
            </div>

            {/* Formulário para adicionar nova configuração */}
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Nova Configuração</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Modelo</Label>
                    <Select value={newItem.modelo} onValueChange={(value) => setNewItem({...newItem, modelo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Select value={newItem.cor} onValueChange={(value) => setNewItem({...newItem, cor: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map(color => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Primer (ml)</Label>
                    <Input 
                      type="number" 
                      value={newItem.primer} 
                      onChange={(e) => setNewItem({...newItem, primer: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Base (ml)</Label>
                    <Input 
                      type="number" 
                      value={newItem.base} 
                      onChange={(e) => setNewItem({...newItem, base: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Verniz (ml)</Label>
                    <Input 
                      type="number" 
                      value={newItem.verniz} 
                      onChange={(e) => setNewItem({...newItem, verniz: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <Button onClick={handleAddEspecifica} className="mt-4" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>

            {/* Tabela de configurações específicas */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações Existentes ({configuracao?.configuracao.especificas.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead>Primer (ml)</TableHead>
                        <TableHead>Base (ml)</TableHead>
                        <TableHead>Verniz (ml)</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configuracao?.configuracao.especificas.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.modelo}</TableCell>
                          <TableCell>{item.cor}</TableCell>
                          <TableCell>
                            {editingItem && editingItem === item ? (
                              <Input 
                                type="number" 
                                value={editingItem.primer}
                                onChange={(e) => setEditingItem({...editingItem, primer: e.target.value})}
                                className="w-20"
                              />
                            ) : (
                              item.primer
                            )}
                          </TableCell>
                          <TableCell>
                            {editingItem && editingItem === item ? (
                              <Input 
                                type="number" 
                                value={editingItem.base}
                                onChange={(e) => setEditingItem({...editingItem, base: e.target.value})}
                                className="w-20"
                              />
                            ) : (
                              item.base
                            )}
                          </TableCell>
                          <TableCell>
                            {editingItem && editingItem === item ? (
                              <Input 
                                type="number" 
                                value={editingItem.verniz}
                                onChange={(e) => setEditingItem({...editingItem, verniz: e.target.value})}
                                className="w-20"
                              />
                            ) : (
                              item.verniz
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              {editingItem && editingItem === item ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleEditEspecifica(editingItem, index)}
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingItem(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingItem(item)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleRemoveEspecifica(index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Configurações Gerais */}
          <TabsContent value="geral" className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações Gerais de Materiais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Primer */}
              <Card>
                <CardHeader>
                  <CardTitle>Primer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Diluente</Label>
                    <Input 
                      value={configuracao?.configuracao.geral.primer.diluente || ''}
                      onChange={(e) => handleUpdateGeral('primer', 'diluente', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Taxa de Diluição (%)</Label>
                    <Input 
                      type="number"
                      value={configuracao?.configuracao.geral.primer.taxa_diluicao || 0}
                      onChange={(e) => handleUpdateGeral('primer', 'taxa_diluicao', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Taxa de Catalisador (%)</Label>
                    <Input 
                      type="number"
                      value={configuracao?.configuracao.geral.primer.taxa_catalisador || 0}
                      onChange={(e) => handleUpdateGeral('primer', 'taxa_catalisador', parseFloat(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Base */}
              <Card>
                <CardHeader>
                  <CardTitle>Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Diluente</Label>
                    <Input 
                      value={configuracao?.configuracao.geral.base.diluente || ''}
                      onChange={(e) => handleUpdateGeral('base', 'diluente', e.target.value)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded">
                    ℹ️ A taxa de diluição para bases é configurada individualmente por cor na aba &quot;Configurações por Cor&quot;
                  </div>
                  <div>
                    <Label>Taxa de Catalisador (%)</Label>
                    <Input 
                      type="number"
                      value={configuracao?.configuracao.geral.base.taxa_catalisador || 0}
                      onChange={(e) => handleUpdateGeral('base', 'taxa_catalisador', parseFloat(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Verniz */}
              <Card>
                <CardHeader>
                  <CardTitle>Verniz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Diluente</Label>
                    <Input 
                      value={configuracao?.configuracao.geral.verniz.diluente || ''}
                      onChange={(e) => handleUpdateGeral('verniz', 'diluente', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Taxa de Diluição (%)</Label>
                    <Input 
                      type="number"
                      value={configuracao?.configuracao.geral.verniz.taxa_diluicao || 0}
                      onChange={(e) => handleUpdateGeral('verniz', 'taxa_diluicao', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Taxa de Catalisador (%)</Label>
                    <Input 
                      type="number"
                      value={configuracao?.configuracao.geral.verniz.taxa_catalisador || 0}
                      onChange={(e) => handleUpdateGeral('verniz', 'taxa_catalisador', parseFloat(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Configurações por Cor */}
          <TabsContent value="bases" className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações Específicas por Cor</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(configuracao?.configuracao.bases || {}).map(([cor, config]) => (
                <Card key={cor}>
                  <CardHeader>
                    <CardTitle>{cor}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Diluente</Label>
                      <Input 
                        value={config.diluente}
                        onChange={(e) => handleUpdateBase(cor, 'diluente', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Taxa de Diluição (%)</Label>
                      <Input 
                        type="number"
                        value={config.taxa_diluicao}
                        onChange={(e) => handleUpdateBase(cor, 'taxa_diluicao', parseFloat(e.target.value))}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
