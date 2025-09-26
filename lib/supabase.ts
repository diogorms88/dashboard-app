import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cliente lazy - criado apenas quando necessário
let _supabaseClient: SupabaseClient | null = null

// Função para obter o cliente Supabase com carregamento lazy
function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    // URLs e chaves com fallback garantido
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alrfqjazctnjdewdthun.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Hyy30QVgFAzYHxuEdfwv4w_25uLQkh0'

    // Garantir que as variáveis nunca sejam undefined
    if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === '') {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL não definida, usando fallback')
    }
    if (!supabaseAnonKey || supabaseAnonKey === 'undefined' || supabaseAnonKey === '') {
      console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não definida, usando fallback')
    }

    // Debug das variáveis de ambiente (apenas no desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 SUPABASE CONFIG DEBUG:', {
        url: supabaseUrl,
        hasKey: !!supabaseAnonKey,
        envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        envKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'presente' : 'ausente'
      })
    }

    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
  
  return _supabaseClient
}

// Export como getter para manter compatibilidade
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  }
})

// Tipos para as tabelas do Supabase
export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          username: string
          email: string
          nome: string
          senha: string
          papel: 'admin' | 'manager' | 'operator' | 'viewer'
          ativo: boolean
          permissoes_customizadas: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          nome: string
          senha: string
          papel: 'admin' | 'manager' | 'operator' | 'viewer'
          ativo?: boolean
          permissoes_customizadas?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          nome?: string
          senha?: string
          papel?: 'admin' | 'manager' | 'operator' | 'viewer'
          ativo?: boolean
          permissoes_customizadas?: string[]
          updated_at?: string
        }
      }
      production_records: {
        Row: {
          id: string
          time_slot: string
          shift: string
          skids_produced: number
          empty_skids: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          time_slot: string
          shift: string
          skids_produced: number
          empty_skids: number
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          time_slot?: string
          shift?: string
          skids_produced?: number
          empty_skids?: number
          created_by?: string
        }
      }
      downtime_records: {
        Row: {
          id: string
          production_id: string
          reason: string
          duration: number
          description: string | null
        }
        Insert: {
          id?: string
          production_id: string
          reason: string
          duration: number
          description?: string | null
        }
        Update: {
          id?: string
          production_id?: string
          reason?: string
          duration?: number
          description?: string | null
        }
      }
    }
  }
}

export type SupabaseClient = typeof supabase
