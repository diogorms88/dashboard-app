import { supabase } from '@/lib/supabase'

// Interface para usuário sem senha
interface UsuarioSemSenha {
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

// Função para verificar e decodificar o token
export async function verifyToken(token: string): Promise<UsuarioSemSenha | null> {
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