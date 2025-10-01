import { z } from 'zod'

// Schemas básicos
export const UserRoleSchema = z.enum(['admin', 'manager', 'operator', 'viewer'])
export const ProductionStatusSchema = z.enum(['active', 'paused', 'completed', 'cancelled'])
export const ShiftSchema = z.enum(['morning', 'afternoon', 'night'])
export const ProductionAreaSchema = z.enum(['painting', 'assembly', 'quality', 'packaging'])
export const ColorSchema = z.enum(['white', 'black', 'red', 'blue', 'green', 'yellow', 'silver', 'gray', 'other'])
export const MeasurementUnitSchema = z.enum(['kg', 'g', 'l', 'ml', 'pcs', 'm', 'cm', 'mm'])

export const DowntimeReasonSchema = z.enum([
  'mechanical_failure',
  'electrical_failure', 
  'material_shortage',
  'quality_issue',
  'maintenance',
  'setup_change',
  'break',
  'other'
])

// Schema para entidade base
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

// Schema para Parada
export const ParadaSchema = z.object({
  id: z.string().uuid().optional(),
  motivo: DowntimeReasonSchema,
  inicio: z.string().datetime(),
  fim: z.string().datetime().optional(),
  duracao: z.number().positive().optional(),
  observacoes: z.string().optional()
})

// Schema para ProducaoItem
export const ProducaoItemSchema = z.object({
  id: z.string().uuid().optional(),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  cor: ColorSchema,
  qtd: z.number().positive('Quantidade deve ser positiva'),
  repintura: z.boolean().optional(),
  observacoes: z.string().optional()
})

// Schema para ProductionRecord
export const ProductionRecordSchema = BaseEntitySchema.extend({
  time_slot: z.string().min(1, 'Horário é obrigatório'),
  shift: ShiftSchema,
  skids_produced: z.number().nonnegative('Skids produzidos deve ser não negativo'),
  empty_skids: z.number().nonnegative('Skids vazios deve ser não negativo'),
  created_by_name: z.string().min(1, 'Nome do criador é obrigatório'),
  paradas: z.array(ParadaSchema).optional(),
  producao: z.array(ProducaoItemSchema).optional()
})

// Schema para Material
export const MaterialSchema = BaseEntitySchema.extend({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.string().min(1, 'Código é obrigatório'),
  unidade: MeasurementUnitSchema,
  preco: z.number().positive('Preço deve ser positivo'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  ativo: z.boolean(),
  estoque_minimo: z.number().nonnegative().optional(),
  estoque_atual: z.number().nonnegative().optional()
})

// Schema para ConfiguracaoConsumo
export const ConfiguracaoConsumoSchema = BaseEntitySchema.extend({
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  cor: ColorSchema,
  material_id: z.string().uuid('ID do material deve ser um UUID válido'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  unidade: MeasurementUnitSchema,
  observacoes: z.string().optional()
})

// Schema para ItemRequest
export const ItemRequestSchema = BaseEntitySchema.extend({
  material_id: z.string().uuid('ID do material deve ser um UUID válido'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
  status: z.enum(['pendente', 'aprovada', 'rejeitada', 'entregue']),
  solicitante: z.string().min(1, 'Solicitante é obrigatório'),
  observacoes: z.string().optional(),
  data_necessaria: z.string().datetime().optional()
})

// Schemas para formulários (versões parciais para criação/edição)
export const CreateProductionRecordSchema = ProductionRecordSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const UpdateProductionRecordSchema = CreateProductionRecordSchema.partial()

export const CreateMaterialSchema = MaterialSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const UpdateMaterialSchema = CreateMaterialSchema.partial()

export const CreateItemRequestSchema = ItemRequestSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

export const UpdateItemRequestSchema = CreateItemRequestSchema.partial()

// Tipos inferidos dos schemas
export type UserRole = z.infer<typeof UserRoleSchema>
export type ProductionStatus = z.infer<typeof ProductionStatusSchema>
export type Shift = z.infer<typeof ShiftSchema>
export type ProductionArea = z.infer<typeof ProductionAreaSchema>
export type Color = z.infer<typeof ColorSchema>
export type MeasurementUnit = z.infer<typeof MeasurementUnitSchema>
export type DowntimeReason = z.infer<typeof DowntimeReasonSchema>
export type BaseEntity = z.infer<typeof BaseEntitySchema>
export type Parada = z.infer<typeof ParadaSchema>
export type ProducaoItem = z.infer<typeof ProducaoItemSchema>
export type ProductionRecord = z.infer<typeof ProductionRecordSchema>
export type Material = z.infer<typeof MaterialSchema>
export type ConfiguracaoConsumo = z.infer<typeof ConfiguracaoConsumoSchema>
export type ItemRequest = z.infer<typeof ItemRequestSchema>

// Tipos para formulários
export type CreateProductionRecord = z.infer<typeof CreateProductionRecordSchema>
export type UpdateProductionRecord = z.infer<typeof UpdateProductionRecordSchema>
export type CreateMaterial = z.infer<typeof CreateMaterialSchema>
export type UpdateMaterial = z.infer<typeof UpdateMaterialSchema>
export type CreateItemRequest = z.infer<typeof CreateItemRequestSchema>
export type UpdateItemRequest = z.infer<typeof UpdateItemRequestSchema>