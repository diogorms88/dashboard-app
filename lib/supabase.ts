import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alrfqjazctnjdewdthun.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscmZxamF6Y3RuamRld2R0aHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyNzY3NDYsImV4cCI6MjA0Mjg1Mjc0Nn0.3iJWo1PjPr5EoKSJk7xNUK3hRSJPKDhbP6gvnx9f6Jg'

// Debug das variáveis de ambiente
console.log('🔧 SUPABASE CONFIG DEBUG:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  envKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'presente' : 'ausente'
})

// Verificar se as variáveis estão definidas
if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não está definida!')
}
if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
