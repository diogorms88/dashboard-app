'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, RotateCcw, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/api';
import { FormFieldValue } from '@/lib/types';

interface MaterialSetting {
  id: number;
  material_name: string;
  dilution_rate: number;
  diluent_type: string;
  catalyst_rate: number;
  created_at: string;
  updated_at: string;
}

interface ModelMaterialConsumption {
  id?: number;
  model: string;
  color: string;
  primer_ml_per_piece: number;
  base_ml_per_piece: number;
  varnish_ml_per_piece: number;
  created_at?: string;
  updated_at?: string;
}

interface MaterialSettingsModalProps {
  children?: React.ReactNode;
}

const DILUENT_TYPES = [
  { value: 'diluente_primer', label: 'Diluente do Primer' },
  { value: 'diluente_base', label: 'Diluente da Base' },
  { value: 'diluente_verniz', label: 'Diluente do Verniz' }
];

const MATERIAL_LABELS: { [key: string]: string } = {
  primer: 'Primer',
  branco: 'Branco',
  preto: 'Preto',
  platinum: 'Platinum',
  prata_sirius: 'Prata Sirius',
  hypernova: 'Hypernova',
  clearwater: 'Clearwater',
  icebird: 'Icebird',
  azul_biscay: 'Azul Biscay',
  verniz: 'Verniz'
};

const MODELS = [
  'Polo PA DT',
  'Polo PA TR',
  'Polo Track DT',
  'Polo Track TR',
  'Virtus DT',
  'Virtus TR',
  'Tera DT',
  'Tera Polaina LD',
  'Tera Polaina LE',
  'Grade Virtus',
  'Grade Virtus GTS',
  'Aerofólio',
  'Spoiler',
  'Tera Friso DT',
  'Tera Friso TR'
];

const COLORS = [
  'Primer P&A',
  'Branco',
  'Prata',
  'Preto',
  'Platinum',
  'Vermelho',
  'Azul Biscay',
  'IceBird',
  'ClearWater',
  'HyperNova'
];

export function MaterialSettingsModal({ children }: MaterialSettingsModalProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState<MaterialSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // Estados para consumo por modelo
  const [modelConsumptions, setModelConsumptions] = useState<ModelMaterialConsumption[]>([]);
  const [loadingConsumptions, setLoadingConsumptions] = useState(false);
  const [newConsumption, setNewConsumption] = useState<Partial<ModelMaterialConsumption>>({
    model: '',
    color: '',
    primer_ml_per_piece: 0,
    base_ml_per_piece: 0,
    varnish_ml_per_piece: 0
  });

  // Carregar configurações de materiais
  const loadMaterialSettings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/material-settings', {
        method: 'GET'
      });
      setMaterials(data);
    } catch (error) {
      toast.error('Erro ao carregar configurações de materiais');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configuração de um material
  const saveMaterialSetting = async (material: MaterialSetting) => {
    setSaving(true);
    try {
      await apiRequest(`/material-settings/${material.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          dilution_rate: material.dilution_rate,
          diluent_type: material.diluent_type,
          catalyst_rate: material.catalyst_rate
        })
      });

      toast.success('Configuração salva com sucesso!');
      await loadMaterialSettings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  // Resetar todas as configurações
  const resetAllSettings = async () => {
    setResetting(true);
    try {
      await apiRequest('/material-settings/reset', {
        method: 'POST'
      });

      toast.success('Configurações resetadas com sucesso!');
      await loadMaterialSettings();
    } catch (error) {
      toast.error('Erro ao resetar configurações');
    } finally {
      setResetting(false);
    }
  };

  // Carregar configurações de consumo por modelo
  const loadModelConsumptions = async () => {
    setLoadingConsumptions(true);
    try {
      const data = await apiRequest('/model-material-consumption', {
        method: 'GET'
      });
      setModelConsumptions(data);
    } catch (error) {
      toast.error('Erro ao carregar configurações de consumo');
    } finally {
      setLoadingConsumptions(false);
    }
  };

  // Salvar nova configuração de consumo
  const saveModelConsumption = async () => {
    if (!newConsumption.model || !newConsumption.color) {
      toast.error('Modelo e cor são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/model-material-consumption', {
        method: 'POST',
        body: JSON.stringify(newConsumption)
      });

      toast.success('Configuração salva com sucesso');
      setNewConsumption({
        model: '',
        color: '',
        primer_ml_per_piece: 0,
        base_ml_per_piece: 0,
        varnish_ml_per_piece: 0
      });
      await loadModelConsumptions();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  // Deletar configuração de consumo
  const deleteModelConsumption = async (id: number) => {
    try {
      await apiRequest(`/model-material-consumption/${id}`, {
        method: 'DELETE'
      });

      toast.success('Configuração deletada com sucesso');
      await loadModelConsumptions();
    } catch (error) {
      toast.error('Erro ao deletar configuração');
    }
  };

  // Atualizar material local
  const updateMaterial = (id: number, field: keyof MaterialSetting, value: FormFieldValue) => {
    setMaterials(prev => prev.map(material => 
      material.id === id ? { ...material, [field]: value } : material
    ));
  };

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open) {
      loadMaterialSettings();
      loadModelConsumptions();
    }
  }, [open]);

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
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Materiais
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials">Configurações de Materiais</TabsTrigger>
            <TabsTrigger value="consumption">Consumo por Modelo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="materials" className="space-y-4">
            {/* Botões de ação */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={resetAllSettings}
                disabled={resetting || loading}
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Resetar Padrão
              </Button>
            </div>

          {/* Lista de materiais */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {MATERIAL_LABELS[material.material_name] || material.material_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`grid grid-cols-1 gap-4 ${material.material_name === 'verniz' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                      {/* Taxa de Diluição */}
                      <div className="space-y-2">
                        <Label htmlFor={`dilution-${material.id}`}>
                          Taxa de Diluição (%)
                        </Label>
                        <Input
                          id={`dilution-${material.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={material.dilution_rate}
                          onChange={(e) => updateMaterial(material.id, 'dilution_rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      {/* Tipo de Diluente */}
                      <div className="space-y-2">
                        <Label htmlFor={`diluent-${material.id}`}>
                          Tipo de Diluente
                        </Label>
                        <Select
                          value={material.diluent_type}
                          onValueChange={(value) => updateMaterial(material.id, 'diluent_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DILUENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Taxa de Catalisador - apenas para verniz */}
                      {material.material_name === 'verniz' && (
                        <div className="space-y-2">
                          <Label htmlFor={`catalyst-${material.id}`}>
                            Taxa de Catalisador (%)
                          </Label>
                          <Input
                            id={`catalyst-${material.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={material.catalyst_rate}
                            onChange={(e) => updateMaterial(material.id, 'catalyst_rate', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => saveMaterialSetting(material)}
                        disabled={saving}
                        size="sm"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </TabsContent>
          
          <TabsContent value="consumption" className="space-y-4">
            {/* Formulário para nova configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nova Configuração de Consumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Select 
                      value={newConsumption.model} 
                      onValueChange={(value) => setNewConsumption(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map((model) => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Select 
                      value={newConsumption.color} 
                      onValueChange={(value) => setNewConsumption(prev => ({ ...prev, color: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cor" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map((color) => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primer">Primer (ml/peça)</Label>
                    <Input
                      id="primer"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newConsumption.primer_ml_per_piece}
                      onChange={(e) => setNewConsumption(prev => ({ 
                        ...prev, 
                        primer_ml_per_piece: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="base">Base (ml/peça)</Label>
                    <Input
                      id="base"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newConsumption.base_ml_per_piece}
                      onChange={(e) => setNewConsumption(prev => ({ 
                        ...prev, 
                        base_ml_per_piece: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="varnish">Verniz (ml/peça)</Label>
                    <Input
                      id="varnish"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newConsumption.varnish_ml_per_piece}
                      onChange={(e) => setNewConsumption(prev => ({ 
                        ...prev, 
                        varnish_ml_per_piece: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={saveModelConsumption}
                    disabled={saving || !newConsumption.model || !newConsumption.color}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Adicionar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Lista de configurações existentes */}
            {loadingConsumptions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações Existentes</h3>
                {modelConsumptions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma configuração de consumo cadastrada
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {modelConsumptions.map((consumption) => (
                      <Card key={consumption.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {consumption.model} - {consumption.color}
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => consumption.id && deleteModelConsumption(consumption.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Primer:</span>
                              <p className="text-muted-foreground">{consumption.primer_ml_per_piece} ml/peça</p>
                            </div>
                            <div>
                              <span className="font-medium">Base:</span>
                              <p className="text-muted-foreground">{consumption.base_ml_per_piece} ml/peça</p>
                            </div>
                            <div>
                              <span className="font-medium">Verniz:</span>
                              <p className="text-muted-foreground">{consumption.varnish_ml_per_piece} ml/peça</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}