-- Script completo para configurar o sistema no Supabase
-- Inclui tabela de usuários e solicitações de itens

-- ========================================
-- 1. TABELA DE USUÁRIOS
-- ========================================

-- Dropar tabela existente se houver
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  senha TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('admin', 'manager', 'operator', 'viewer')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  permissoes_customizadas TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para a tabela usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_papel ON usuarios(papel);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Inserir usuários padrão
INSERT INTO usuarios (username, email, nome, senha, papel, ativo) VALUES
('admin', 'admin@plascar.com', 'Administrador', 'admin123', 'admin', true),
('gerente', 'gerente@plascar.com', 'Gerente Sistema', 'gerente123', 'manager', true),
('operador', 'operador@plascar.com', 'Operador Padrão', 'operador123', 'operator', true),
('viewer', 'viewer@plascar.com', 'Visualizador', 'viewer123', 'viewer', true);

-- ========================================
-- 2. TABELA DE SOLICITAÇÕES DE ITENS
-- ========================================

-- Dropar tabela existente se houver
DROP TABLE IF EXISTS item_requests CASCADE;

CREATE TABLE item_requests (
  id BIGSERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  requested_by UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_item_requests_requested_by ON item_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_item_requests_assigned_to ON item_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_item_requests_status ON item_requests(status);
CREATE INDEX IF NOT EXISTS idx_item_requests_priority ON item_requests(priority);
CREATE INDEX IF NOT EXISTS idx_item_requests_created_at ON item_requests(created_at);

-- ========================================
-- 3. TRIGGERS E FUNÇÕES
-- ========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para usuarios
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para item_requests
DROP TRIGGER IF EXISTS update_item_requests_updated_at ON item_requests;
CREATE TRIGGER update_item_requests_updated_at
    BEFORE UPDATE ON item_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. POLÍTICAS RLS PARA USUARIOS
-- ========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON usuarios;
DROP POLICY IF EXISTS "Admins can view all users" ON usuarios;
DROP POLICY IF EXISTS "Users can update their own profile" ON usuarios;
DROP POLICY IF EXISTS "Admins can manage users" ON usuarios;

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile" ON usuarios
    FOR SELECT USING (id = auth.uid() OR id::text = current_setting('app.current_user_id', true));

-- Admins e managers podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE (u.id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
            AND u.papel IN ('admin', 'manager')
            AND u.ativo = true
        )
    );

-- Usuários podem atualizar seu próprio perfil (exceto papel)
CREATE POLICY "Users can update their own profile" ON usuarios
    FOR UPDATE USING (id = auth.uid() OR id::text = current_setting('app.current_user_id', true));

-- Admins podem gerenciar todos os usuários
CREATE POLICY "Admins can manage users" ON usuarios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE (u.id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
            AND u.papel = 'admin'
            AND u.ativo = true
        )
    );

-- ========================================
-- 6. POLÍTICAS RLS PARA ITEM_REQUESTS
-- ========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own requests" ON item_requests;
DROP POLICY IF EXISTS "Users can create requests" ON item_requests;
DROP POLICY IF EXISTS "Admins and managers can view all requests" ON item_requests;
DROP POLICY IF EXISTS "Admins and managers can update requests" ON item_requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON item_requests;

-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view their own requests" ON item_requests
    FOR SELECT USING (
        requested_by = auth.uid() OR 
        requested_by::text = current_setting('app.current_user_id', true) OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE (u.id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
            AND u.papel IN ('admin', 'manager')
            AND u.ativo = true
        )
    );

-- Usuários podem criar solicitações
CREATE POLICY "Users can create requests" ON item_requests
    FOR INSERT WITH CHECK (
        requested_by = auth.uid() OR 
        requested_by::text = current_setting('app.current_user_id', true) OR
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE (u.id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
            AND u.ativo = true
        )
    );

-- Admins e managers podem atualizar solicitações
CREATE POLICY "Admins and managers can update requests" ON item_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE (u.id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
            AND u.papel IN ('admin', 'manager')
            AND u.ativo = true
        )
    );

-- Apenas admins podem deletar solicitações
CREATE POLICY "Admins can delete requests" ON item_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios u 
            WHERE (u.id = auth.uid() OR u.id::text = current_setting('app.current_user_id', true))
            AND u.papel = 'admin'
            AND u.ativo = true
        )
    );

-- ========================================
-- 7. FUNÇÃO PARA CRIAR SOLICITAÇÕES
-- ========================================

CREATE OR REPLACE FUNCTION create_item_request(
    p_item_name TEXT,
    p_quantity INTEGER,
    p_requested_by UUID,
    p_description TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium'
)
RETURNS TABLE(
    id BIGINT,
    item_name TEXT,
    quantity INTEGER,
    description TEXT,
    priority TEXT,
    status TEXT,
    requested_by UUID,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO item_requests (item_name, quantity, description, priority, requested_by)
    VALUES (p_item_name, p_quantity, p_description, p_priority, p_requested_by)
    RETURNING 
        item_requests.id,
        item_requests.item_name,
        item_requests.quantity,
        item_requests.description,
        item_requests.priority,
        item_requests.status,
        item_requests.requested_by,
        item_requests.assigned_to,
        item_requests.created_at,
        item_requests.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. CONFIGURAÇÕES FINAIS
-- ========================================

-- Comentários nas tabelas
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema';
COMMENT ON TABLE item_requests IS 'Tabela de solicitações de itens/materiais';

-- Comentários nas colunas principais
COMMENT ON COLUMN usuarios.papel IS 'Papel do usuário: admin, manager, operator, viewer';
COMMENT ON COLUMN item_requests.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN item_requests.status IS 'Status: pending, in_progress, completed, cancelled';

SELECT 'Setup completo executado com sucesso!' as resultado;