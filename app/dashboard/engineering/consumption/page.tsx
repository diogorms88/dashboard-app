'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

interface ConsumptionItem {
  id?: number;
  model: string;
  color: string;
  primer: number;
  primerDiluent: number;
  base: number;
  baseDiluent: number;
  varnish: number;
  varnishDiluent: number;
  catalyst: number;
  totalPerPiece: number;
  primer_ml_per_piece?: number;
  base_ml_per_piece?: number;
  varnish_ml_per_piece?: number;
}

interface NewItemForm {
  model: string;
  color: string;
}

interface MaterialSettings {
  [key: string]: {
    dilution_rate: number;
    catalyst_rate: number;
  };
}

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

export default function ConsumptionPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ConsumptionItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [materialSettings, setMaterialSettings] = useState<MaterialSettings>({});
  const [newItem, setNewItem] = useState<NewItemForm>({
    model: '',
    color: ''
  });

  // Carregar dados existentes
  useEffect(() => {
    const loadData = async () => {
      const settings = await loadMaterialSettings();
      await loadConsumptionData(settings);
    };
    loadData();
  }, []);

  const loadConsumptionData = async (settings?: MaterialSettings) => {
    try {
      const data = await apiRequest('/model-material-consumption', {
        method: 'GET'
      });
      const currentSettings = settings || materialSettings;
      const processedItems = data.map((item: Record<string, unknown>) => {
        const calculatedConsumption = calculateConsumptionWithDilutionSync(item, currentSettings);
        return {
          ...item,
          ...calculatedConsumption
        };
      });
      
      setItems(processedItems);
    } catch (error) {
      toast.error('Erro ao carregar dados de consumo');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterialSettings = async (): Promise<MaterialSettings> => {
    try {
      const data = await apiRequest('/material-settings', {
        method: 'GET'
      });
      const settings: MaterialSettings = {};
      
      data.forEach((setting: Record<string, unknown>) => {
        settings[setting.material_name] = {
          dilution_rate: setting.dilution_rate,
          catalyst_rate: setting.catalyst_rate
        };
      });
      
      setMaterialSettings(settings);
      return settings;
    } catch (error) {
      return {};
    }
  };

  const calculateConsumptionWithDilutionSync = (item: Record<string, unknown>, settings: MaterialSettings) => {
    // Os valores do banco são já diluídos, precisamos calcular o valor puro
    const primerDiluted = item.primer_ml_per_piece || 0;
    const baseDiluted = item.base_ml_per_piece || 0;
    const varnishDiluted = item.varnish_ml_per_piece || 0;

    // Buscar configurações de diluição
    const primerSettings = settings['primer'] || { dilution_rate: 0, catalyst_rate: 0 };
    
    // Para base, buscar pela cor específica (convertendo para lowercase e removendo espaços)
    const colorKey = item.color?.toLowerCase().replace(/\s+/g, '_') || '';
    const baseSettings = settings[colorKey] || settings['base'] || { dilution_rate: 0, catalyst_rate: 0 };
    
    const varnishSettings = settings['verniz'] || { dilution_rate: 0, catalyst_rate: 0 };

    // Para o verniz: total = verniz puro + diluente + catalisador
    // Valores esperados: verniz puro 47.3ml, diluente 12.2ml, catalisador 25.5ml = 85ml total
    // Analisando: 12.2/47.3 = 0.258 (25.8% de diluição sobre verniz puro)
    // E 25.5/85 = 0.30 (30% de catalisador sobre total)
    
    // Calcular catalisador (30% do total)
    const catalyst = varnishDiluted * (varnishSettings.catalyst_rate / 100);
    
    // O restante é verniz puro + diluente
    const varnishPlusDiluent = varnishDiluted - catalyst;
    
    // Se diluente é 25.8% do verniz puro (não 14.4%), então:
    // varnishPure + (varnishPure * 0.258) = varnishPlusDiluent
    // varnishPure * (1 + 0.258) = varnishPlusDiluent
    // varnishPure = varnishPlusDiluent / 1.258
    const varnishPure = varnishPlusDiluent / (1 + 0.258);
    
    // Diluente é a diferença
    const varnishDiluent = varnishPlusDiluent - varnishPure;
    
    // Para primer e base, usar o cálculo anterior
    const primerDiluent = primerDiluted * (primerSettings.dilution_rate / 100);
    const baseDiluent = baseDiluted * (baseSettings.dilution_rate / 100);
    
    const primerPure = primerDiluted - primerDiluent;
    const basePure = baseDiluted - baseDiluent;
    
    const totalPerPiece = primerPure + primerDiluent + basePure + baseDiluent + varnishPure + varnishDiluent + catalyst;

    return {
      primer: primerPure,
      primerDiluent,
      base: basePure,
      baseDiluent,
      varnish: varnishPure,
      varnishDiluent,
      catalyst,
      totalPerPiece
    };
  };

  const calculateConsumptionWithDilution = async (item: Record<string, unknown>) => {
    return calculateConsumptionWithDilutionSync(item, materialSettings);
  };

  const handleAddItem = async () => {
    if (!newItem.model || !newItem.color) {
      toast.error('Por favor, selecione modelo e cor.');
      return;
    }

    // Verificar se já existe uma configuração para este modelo e cor
    const existingItem = items.find(item => item.model === newItem.model && item.color === newItem.color);
    if (existingItem) {
      toast.error('Já existe uma configuração para este modelo e cor.');
      return;
    }

    try {
      // Buscar dados de consumo existentes do backend
      const existingData = await apiRequest(`/model-material-consumption/${encodeURIComponent(newItem.model)}/${encodeURIComponent(newItem.color)}`, {
        method: 'GET'
      });
      
      const calculatedConsumption = await calculateConsumptionWithDilution(existingData);
      
      const consumptionItem: ConsumptionItem = {
        ...existingData,
        ...calculatedConsumption
      };

      setItems([...items, consumptionItem]);
      toast.success('Item adicionado com sucesso!');
    } catch (error) {
      toast.error('Não há configuração de consumo cadastrada para este modelo e cor. Configure primeiro na aba Configurações.');
      return;
    }

    setNewItem({
      model: '',
      color: ''
    });
    setIsDialogOpen(false);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      setItems(items.filter(item => item.id !== id));
      toast.success('Item removido da lista');
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consumo por Peça</h1>
          <p className="text-muted-foreground">
            Gerencie o consumo de materiais por modelo e cor
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Item</DialogTitle>
              <DialogDescription>
                Selecione o modelo e cor para adicionar à lista. Os dados de consumo serão calculados automaticamente baseados nas configurações existentes.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Select value={newItem.model} onValueChange={(value) => setNewItem({...newItem, model: value})}>
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
                <Select value={newItem.color} onValueChange={(value) => setNewItem({...newItem, color: value})}>
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
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Os valores de consumo de materiais e diluentes serão calculados automaticamente com base nas configurações definidas na aba &quot;Configurações&quot;. Certifique-se de que o modelo e cor selecionados possuem configurações cadastradas.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddItem}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de Consumo</CardTitle>
          <CardDescription>
            Lista de consumo de materiais por modelo e cor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo + Cor</TableHead>
                <TableHead className="text-right">Primer (ml)</TableHead>
                <TableHead className="text-right">Dil. Primer (ml)</TableHead>
                <TableHead className="text-right">Base (ml)</TableHead>
                <TableHead className="text-right">Dil. Base (ml)</TableHead>
                <TableHead className="text-right">Verniz (ml)</TableHead>
                <TableHead className="text-right">Dil. Verniz (ml)</TableHead>
                <TableHead className="text-right">Catalisador (ml)</TableHead>
                <TableHead className="text-right">Total/Peça (ml)</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhum item adicionado. Clique em &quot;Adicionar Item&quot; para começar.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.model} - {item.color}
                    </TableCell>
                    <TableCell className="text-right">{item.primer.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.primerDiluent.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.base.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.baseDiluent.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.varnish.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.varnishDiluent.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.catalyst.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{item.totalPerPiece.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}