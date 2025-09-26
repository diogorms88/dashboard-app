import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
