import { supabase } from './supabase'
import { Session } from '@supabase/supabase-js'
import { UserRole } from '@/lib/types'

// Interface para os dados do usuário no nosso sistema
export interface UserProfile {
  id: string
  username: string
  nome: string
  papel: UserRole
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: UserProfile | null
  session: Session | null
  error?: string
}

class SupabaseAuthService {
  // Login usando Supabase Auth
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, session: null, error: error.message }
      }

      if (data.user) {
        // Buscar dados do perfil do usuário na nossa tabela users
        const userProfile = await this.getUserProfile(data.user.id)
        return {
          user: userProfile,
          session: data.session,
        }
      }

      return { user: null, session: null, error: 'Falha na autenticação' }
    } catch (error) {
      return { user: null, session: null, error: 'Erro interno do servidor' }
    }
  }

  // Registrar novo usuário (admin only)
  async signUp(email: string, password: string, userProfile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { user: null, session: null, error: error.message }
      }

      if (data.user) {
        // Criar perfil do usuário na nossa tabela
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              ...userProfile,
            }
          ])

        if (profileError) {
          return { user: null, session: null, error: 'Erro ao criar perfil do usuário' }
        }

        const newUserProfile = await this.getUserProfile(data.user.id)
        return {
          user: newUserProfile,
          session: data.session,
        }
      }

      return { user: null, session: null, error: 'Falha no registro' }
    } catch (error) {
      return { user: null, session: null, error: 'Erro interno do servidor' }
    }
  }

  // Buscar perfil do usuário
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('ativo', true)
        .single()

      if (error) {
        return null
      }

      return data as UserProfile
    } catch (error) {
      return null
    }
  }

  // Verificar sessão atual
  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        return { user: null, session: null }
      }

      if (data.session?.user) {
        const userProfile = await this.getUserProfile(data.session.user.id)
        return {
          user: userProfile,
          session: data.session,
        }
      }

      return { user: null, session: null }
    } catch (error) {
      return { user: null, session: null }
    }
  }

  // Logout
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return false
      }
      return true
    } catch (error) {
      return false
    }
  }

  // Atualizar perfil do usuário
  async updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return null
      }

      return data as UserProfile
    } catch (error) {
      return null
    }
  }

  // Listar todos os usuários (admin only)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return []
      }

      return data as UserProfile[]
    } catch (error) {
      return []
    }
  }

  // Escutar mudanças na autenticação
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Singleton instance
export const supabaseAuthService = new SupabaseAuthService()
export default supabaseAuthService
