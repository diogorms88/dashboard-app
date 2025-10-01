// Motivos de parada por área - centralizados
export const DOWNTIME_REASONS_BY_AREA = {
  '🧪 Engenharia': [
    'TESTE DE ENGENHARIA',
    'LIMITE DE EIXO'
  ],
  '👥 Gestão': [
    'FALTA DE FERRAMENTAS',
    'FALTA DE OPERADOR NA CARGA',
    'FALTA DE PEÇAS DA PREPARAÇÃO',
    'OPERADOR BUSCANDO PEÇA NO ALMOXARIFADO',
    'OPERADOR NA ENFERMARIA',
    'ORGANIZAÇÃO GERAL NO SETOR',
    'PARADA NA CABINE',
    'PARADA NA CARGA - ABASTECENDO A LINHA',
    'PARADA NA DESCARGA - DESCARREGANDO PEÇAS',
    'PARADA EXTERNA',
    'REFEIÇÃO',
    'REGULAGEM DE MÁQUINA',
    'RETRABALHO / LIMPEZA DE PEÇAS',
    'REUNIÃO COM A DIRETORIA',
    'REUNIÃO',
    'TREINAMENTO',
    'TROCA DE TURNO'
  ],
  '📦 Logística': [
    'AGUARDANDO A PROGRAMAÇÃO',
    'FALHA RFID',
    'FALTA DE ABASTECIMENTO DE RACK',
    'FALTA DE EMBALAGEM DA LOGÍSTICA',
    'FALTA DE EMPILHADOR DA LOGÍSTICA ABASTECENDO PEÇAS',
    'FALTA DE MATÉRIA PRIMA (TINTA / VERNIZ)',
    'FALTA DE PEÇAS DO ALMOXARIFADO (REQUISITADO)',
    'FALTA DE PEÇAS INJETADAS',
    'PARADA PROGRAMADA'
  ],
  '🔧 Manutenção': [
    'AGUARDANDO A MANUTENÇÃO',
    'CABINE DESBALANCEADA',
    'CORRENTE QUEBRADA',
    'FALHA NO ELEVADOR',
    'FALTA AR COMPRIMIDO',
    'FALTA DE ENERGIA',
    'MANGUEIRA ENTUPIDA',
    'MANGUEIRA VAZANDO',
    'MANUTENÇÃO CORRETIVA',
    'SKID TRAVADO',
    'MANUTENÇÃO ELÉTRICA',
    'MANUTENÇÃO MECÂNICA',
    'MANUTENÇÃO PREDIAL',
    'MANUTENÇÃO PREVENTIVA',
    'MANUTENÇÃO SERRALHERIA',
    'PROBLEMA NO ROBÔ CAB. FLAMAGEM',
    'PROBLEMA NO ROBÔ CAB. PRIMER',
    'PROBLEMA NO ROBÔ CAB. BASE',
    'PROBLEMA NO ROBÔ CAB. VERNIZ',
    'PROBLEMA NO MAÇARICO',
    'PROBLEMA NO MOTOR / CORREIA',
    'PROBLEMA NO POWER WASH'
  ],
  'MILCLEAN': [
    'AGUARDANDO OPERADOR PARA LIMPEZA'
  ],
  'PRODUÇÃO': [
    'FALTA DE OPERADOR',
    'FIM DE EXPEDIENTE',
    'LIMPEZA DE MÁQUINA',
    'PAUSA',
    'TROCA DE PEÇAS',
    'TROCA DE SETUP'
  ],
  'QUALIDADE': [
    'ESPERANDO LIBERAÇÃO DA QUALIDADE'
  ],
  'SETUP': [
    'SETUP DE COR',
    'TROCA DE MODELO'
  ],
  'PINTURA': [
    'LIMPEZA DA CABINE',
    'GAP PARA LIMPEZA NA CABINE',
    'LIMPEZA CONJUNTO ECOBELL',
    'GAP NA FLAMAGEM'
  ],
  'SEGURANÇA': [
    'ACIDENTE / INCIDENTE',
    'INSPEÇÃO DE SEGURANÇA'
  ]
} as const



// Cores para badges de severidade
export const SEVERITY_COLORS = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800'
} as const

// Cores para badges de status
export const STATUS_COLORS = {
  // Status para formulários 8D
  aberto: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-800',
  
  // Status para solicitações
  pending: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  
  // Status para projetos de planejamento
  planejado: 'bg-blue-100 text-blue-800',
  pausado: 'bg-gray-100 text-gray-800'
} as const

// Cores para badges de prioridade
export const PRIORITY_COLORS = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
  
  // Prioridades em inglês
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800'
} as const

// Cores para badges de tipo de projeto
export const PROJECT_TYPE_COLORS = {
  projeto: 'bg-blue-100 text-blue-800',
  melhoria: 'bg-green-100 text-green-800',
  manutencao: 'bg-orange-100 text-orange-800',
  treinamento: 'bg-purple-100 text-purple-800',
  auditoria: 'bg-red-100 text-red-800'
} as const

// Tipos de parada que devem ser excluídos do Pareto
export const EXCLUDED_DOWNTIME_TYPES = [
  'LIMPEZA DA CABINE',
  'REFEIÇÃO',
  'REFEICAO'
] as const

// Configurações padrão
export const DEFAULT_CONFIG = {
  TARGET_HOURLY_RATE: 50, // Meta de 50 skids/hora
  MAX_PARETO_ITEMS: 10, // TOP 10 para análise Pareto
  TOKEN_EXPIRY_HOURS: 24 // Token expira em 24 horas
} as const