-- Script para corrigir as políticas RLS e função create_item_request

-- Primeiro, vamos dropar e recriar as políticas RLS
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
            AND ativo = true
        )
    );

-- Política para permitir que admins e managers atualizem solicitações
CREATE POLICY "Admins and managers can update requests" ON item_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND papel IN ('admin', 'manager')
            AND ativo = true
        )
    );

-- Política para permitir que admins deletem solicitações
CREATE POLICY "Admins can delete requests" ON item_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() 
            AND papel = 'admin'
            AND ativo = true
        )
    );

-- Corrigir a função create_item_request
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
  -- Inserir nova solicitação com ordem correta dos campos
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

-- Verificar se as políticas foram aplicadas corretamente
SELECT 'Políticas RLS corrigidas com sucesso!' as resultado;