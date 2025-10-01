-- Criar tabela item_requests no Supabase
-- Baseado na estrutura definida em ESTRUTURA_BANCO_DADOS.md

-- Dropar tabela existente se houver para garantir estrutura correta
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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_item_requests_requested_by ON item_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_item_requests_assigned_to ON item_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_item_requests_status ON item_requests(status);
CREATE INDEX IF NOT EXISTS idx_item_requests_priority ON item_requests(priority);
CREATE INDEX IF NOT EXISTS idx_item_requests_created_at ON item_requests(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger existente se houver e criar novamente
DROP TRIGGER IF EXISTS update_item_requests_updated_at ON item_requests;
CREATE TRIGGER update_item_requests_updated_at
    BEFORE UPDATE ON item_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver e criar novamente
DROP POLICY IF EXISTS "Users can view their own requests" ON item_requests;
DROP POLICY IF EXISTS "Users can create requests" ON item_requests;
DROP POLICY IF EXISTS "Admins and managers can view all requests" ON item_requests;
DROP POLICY IF EXISTS "Admins and managers can update requests" ON item_requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON item_requests;

-- Política para permitir que usuários vejam suas próprias solicitações
CREATE POLICY "Users can view their own requests" ON item_requests
    FOR SELECT USING (requested_by = auth.uid());

-- Política para permitir que usuários criem solicitações
CREATE POLICY "Users can create requests" ON item_requests
    FOR INSERT WITH CHECK (requested_by = auth.uid());

-- Política para permitir que admins e managers vejam todas as solicitações
CREATE POLICY "Admins and managers can view all requests" ON item_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND papel IN ('admin', 'manager')
        )
    );

-- Política para permitir que admins e managers atualizem solicitações
CREATE POLICY "Admins and managers can update requests" ON item_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND papel IN ('admin', 'manager')
        )
    );

-- Política para permitir que admins deletem solicitações
CREATE POLICY "Admins can delete requests" ON item_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND papel = 'admin'
        )
    );

-- Comentários para documentação
COMMENT ON TABLE item_requests IS 'Tabela para gerenciar solicitações de itens/materiais';

-- Função para criar solicitação com contexto de usuário
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Inserir nova solicitação
  RETURN QUERY
  INSERT INTO item_requests (
    item_name,
    quantity,
    description,
    priority,
    status,
    requested_by
  )
  VALUES (
    p_item_name,
    p_quantity,
    p_description,
    p_priority,
    'pending',
    p_requested_by
  )
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
$$;
COMMENT ON COLUMN item_requests.item_name IS 'Nome do item solicitado';
COMMENT ON COLUMN item_requests.quantity IS 'Quantidade solicitada (deve ser maior que 0)';
COMMENT ON COLUMN item_requests.description IS 'Descrição detalhada da solicitação';
COMMENT ON COLUMN item_requests.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN item_requests.status IS 'Status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN item_requests.requested_by IS 'ID do usuário que fez a solicitação';
COMMENT ON COLUMN item_requests.assigned_to IS 'ID do usuário responsável pela solicitação';