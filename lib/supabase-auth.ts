import { supabase } from './supabase'

// Interface para os dados do usuário baseado na estrutura da tabela usuarios
export interface Usuario {
  id: string
  username: string
  email: string
  nome: string
  papel: 'admin' | 'manager' | 'operator' | 'viewer'
  ativo: boolean
  permissoes_customizadas: string[]
  created_at: string
  updated_at: string
}

export type UsuarioSemSenha = Omit<Usuario, 'senha'>

export interface AuthResponse {
  user: UsuarioSemSenha | null
  token?: string
  error?: string
}

class SupabaseAuthService {
  // Login usando credenciais diretas na tabela usuarios
  async login(username: string, senha: string): Promise<AuthResponse> {
    try {

      
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('senha', senha)
        .eq('ativo', true)
        .single()

      if (error) {

        return { 
          user: null, 
          error: error.code === 'PGRST116' ? 'Credenciais inválidas' : error.message 
        }
      }

      if (usuarios) {

        
        // Remover senha do objeto de retorno
        const { senha, ...usuarioSemSenha } = usuarios
        // senha é extraída mas não usada por questão de segurança
        void senha
        
        // Gerar um token simples (você pode implementar JWT aqui se quiser)
        const token = btoa(JSON.stringify({ 
          id: usuarios.id, 
          username: usuarios.username,
          timestamp: Date.now() 
        }))

        return {
          user: usuarioSemSenha as UsuarioSemSenha,
          token,
        }
      }

      return { user: null, error: 'Credenciais inválidas' }
    } catch (error) {
      return { user: null, error: 'Erro interno do servidor' }
    }
  }

  // Verificar token (validação simples)
  async verifyToken(token: string): Promise<UsuarioSemSenha | null> {
    try {
      // Verificar se o token existe e não está vazio
      if (!token || token.trim() === '') {
        throw new Error('Token vazio')
      }

      // Tentar decodificar o token
      let decoded
      try {
        decoded = JSON.parse(atob(token))
      } catch (decodeError) {
        throw new Error('Token mal formado')
      }

      // Verificar se o token tem a estrutura esperada
      if (!decoded || !decoded.id || !decoded.username || !decoded.timestamp) {
        throw new Error('Token com estrutura inválida')
      }
      
      // Verificar se o token não está muito antigo (24 horas)
      const tokenAge = Date.now() - decoded.timestamp
      if (tokenAge > 24 * 60 * 60 * 1000) {
        throw new Error('Token expirado')
      }

      // Buscar usuário atual no banco
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, username, email, nome, papel, ativo, permissoes_customizadas, created_at, updated_at')
        .eq('id', decoded.id)
        .eq('ativo', true)
        .single()

      if (error || !usuario) {
        throw new Error('Usuário não encontrado ou inativo')
      }

      return usuario as UsuarioSemSenha
    } catch (error) {
    return null
    }
  }

  // Buscar usuário por ID
  async getUserById(id: string): Promise<UsuarioSemSenha | null> {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, username, email, nome, papel, ativo, permissoes_customizadas, created_at, updated_at')
        .eq('id', id)
        .eq('ativo', true)
        .single()

      if (error) {
        return null
      }

      return usuario as UsuarioSemSenha
    } catch (error) {
      return null
    }
  }

  // Listar todos os usuários (admin only)
  async getAllUsers(): Promise<UsuarioSemSenha[]> {
    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('id, username, email, nome, papel, ativo, permissoes_customizadas, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) {
        return []
      }

      return usuarios as UsuarioSemSenha[]
    } catch (error) {
      return []
    }
  }

  // Atualizar usuário
  async updateUser(id: string, updates: Partial<Omit<Usuario, 'id' | 'created_at'>>): Promise<UsuarioSemSenha | null> {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, username, email, nome, papel, ativo, permissoes_customizadas, created_at, updated_at')
        .single()

      if (error) {
        return null
      }

      return usuario as UsuarioSemSenha
    } catch (error) {
      return null
    }
  }

  // Criar novo usuário
  async createUser(userData: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>): Promise<UsuarioSemSenha | null> {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .insert([userData])
        .select('id, username, email, nome, papel, ativo, permissoes_customizadas, created_at, updated_at')
        .single()

      if (error) {
        return null
      }

      return usuario as UsuarioSemSenha
    } catch (error) {
      return null
    }
  }

  // Deletar usuário
  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)

      if (error) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  // Resetar senha do usuário
  async resetPassword(id: string, novaSenha: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          senha: novaSenha,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }
}

// Singleton instance
export const supabaseAuthService = new SupabaseAuthService()
export default supabaseAuthService
