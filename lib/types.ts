// Tipos comuns para melhor tipagem do sistema

// Tipos para valores de formulário
export type FormFieldValue = string | number | boolean

// Tipos para campos de material
export type MaterialField = 'nome' | 'codigo' | 'unidade' | 'preco' | 'categoria'

// Tipos para roles de usuário
export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer'

// Tipos para status de produção
export type ProductionStatus = 'active' | 'paused' | 'completed' | 'cancelled'

// Tipos para turnos
export type Shift = 'morning' | 'afternoon' | 'night'

// Tipos para áreas de produção
export type ProductionArea = 'painting' | 'assembly' | 'quality' | 'packaging'

// Tipos para motivos de parada
export type DowntimeReason = 
  | 'mechanical_failure'
  | 'electrical_failure'
  | 'material_shortage'
  | 'quality_issue'
  | 'maintenance'
  | 'setup_change'
  | 'break'
  | 'other'

// Tipos para cores
export type Color = 
  | 'white'
  | 'black'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'silver'
  | 'gray'
  | 'other'

// Tipos para modelos de produto
export type ProductModel = string // Pode ser refinado conforme necessário

// Tipos para unidades de medida
export type MeasurementUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'm' | 'cm' | 'mm'

// Interface base para entidades com timestamps
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Interface para filtros genéricos
export interface FilterConfig {
  [key: string]: FormFieldValue | undefined
}

// Tipos para operações CRUD
export type CrudOperation = 'create' | 'read' | 'update' | 'delete'

// Tipos para status de requisições
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

// Interfaces para domínio de produção
export interface Parada {
  id?: string
  motivo: DowntimeReason
  inicio: string
  fim?: string
  duracao?: number
  observacoes?: string
}

export interface ProducaoItem {
  id?: string
  modelo: ProductModel
  cor: Color
  qtd: number
  repintura?: boolean
  observacoes?: string
}

export interface ProductionRecord extends BaseEntity {
  time_slot: string
  shift: Shift
  skids_produced: number
  empty_skids: number
  created_by_name: string
  paradas?: Parada[]
  producao?: ProducaoItem[]
}

// Interface para Material
export interface Material extends BaseEntity {
  nome: string
  codigo: string
  unidade: MeasurementUnit
  preco: number
  categoria: string
  ativo: boolean
  estoque_minimo?: number
  estoque_atual?: number
}

// Interface para configuração de consumo
export interface ConfiguracaoConsumo extends BaseEntity {
  modelo: ProductModel
  cor: Color
  material_id: string
  quantidade: number
  unidade: MeasurementUnit
  observacoes?: string
}

// Interface para solicitação de item
export interface ItemRequest extends BaseEntity {
  material_id: string
  quantidade: number
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'entregue'
  solicitante: string
  observacoes?: string
  data_necessaria?: string
}