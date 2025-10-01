# 📋 Instruções para Migração das Solicitações para Supabase

## 🎯 Resumo da Migração

A funcionalidade de **solicitações de itens** foi completamente migrada para o Supabase. Agora as solicitações serão armazenadas no banco de dados e estarão disponíveis tanto na página de usuários (`/dashboard/requests`) quanto na página de administração (`/dashboard/admin/requests`).

## 🗄️ 1. Criar a Tabela no Supabase

### Passo 1: Acessar o Supabase Dashboard
1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### Passo 2: Executar o Script SQL
1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase-item-requests.sql`
4. Cole no editor SQL
5. Clique em **Run** para executar o script

### ✅ O que o script faz:
- ✅ Cria a tabela `item_requests` com todas as colunas necessárias
- ✅ Adiciona índices para melhor performance
- ✅ Configura trigger para atualizar `updated_at` automaticamente
- ✅ Habilita Row Level Security (RLS)
- ✅ Cria políticas de segurança:
  - Usuários podem ver suas próprias solicitações
  - Usuários podem criar solicitações
  - Admins e managers podem ver/editar todas as solicitações
  - Apenas admins podem deletar solicitações

## 🔧 2. Funcionalidades Implementadas

### 📝 API Endpoints Criados:

#### **GET** `/api/item-requests`
- Lista todas as solicitações (com filtros por permissão)
- Parâmetro opcional: `?user_id=ID` para filtrar por usuário específico

#### **POST** `/api/item-requests`
- Cria nova solicitação
- Campos obrigatórios: `item_name`, `quantity`, `priority`
- Campos opcionais: `description`

#### **GET** `/api/item-requests/[id]`
- Busca solicitação específica por ID

#### **PUT** `/api/item-requests/[id]`
- Atualiza solicitação (apenas admins/managers)
- Campos atualizáveis: `status`, `assigned_to`, `priority`, `description`

#### **DELETE** `/api/item-requests/[id]`
- Deleta solicitação específica (apenas admins)

#### **DELETE** `/api/item-requests/clear-all`
- Remove todas as solicitações (apenas admins)

### 🎨 Páginas Funcionais:

#### **Página do Usuário** (`/dashboard/requests`)
- ✅ Visualizar suas próprias solicitações
- ✅ Criar novas solicitações
- ✅ Filtros e busca
- ✅ Interface responsiva

#### **Página de Administração** (`/dashboard/admin/requests`)
- ✅ Visualizar todas as solicitações
- ✅ Filtrar por status (pendentes, em andamento, concluídas, sem ação)
- ✅ Atualizar status das solicitações
- ✅ Atribuir responsáveis
- ✅ Limpar todas as solicitações
- ✅ Contadores de solicitações pendentes

#### **Sidebar e Notificações**
- ✅ Badge com contagem de solicitações sem responsável
- ✅ Notificações em tempo real

## 🔐 3. Permissões e Segurança

### Níveis de Acesso:

**👤 Usuários Comuns (operator, viewer):**
- Podem criar solicitações
- Podem ver apenas suas próprias solicitações
- Não podem editar ou deletar

**👨‍💼 Managers:**
- Podem ver todas as solicitações
- Podem atualizar status e atribuir responsáveis
- Não podem deletar solicitações

**👨‍💻 Administradores:**
- Acesso completo a todas as funcionalidades
- Podem deletar solicitações individuais
- Podem limpar todas as solicitações

## 🚀 4. Como Testar

### Após executar o script SQL:

1. **Acesse a aplicação**: http://localhost:3001
2. **Faça login** com um usuário
3. **Teste como usuário comum**:
   - Vá para `/dashboard/requests`
   - Crie uma nova solicitação
   - Verifique se aparece na lista

4. **Teste como admin**:
   - Vá para `/dashboard/admin/requests`
   - Verifique se a solicitação criada aparece
   - Teste atualizar o status
   - Teste atribuir um responsável

5. **Verifique a sidebar**:
   - Deve mostrar o badge com contagem de solicitações sem responsável

## 🐛 5. Solução de Problemas

### Erro: "Tabela não encontrada"
- ✅ Verifique se o script SQL foi executado corretamente
- ✅ Confirme que a tabela `item_requests` existe no Supabase

### Erro: "Acesso negado"
- ✅ Verifique se as políticas RLS foram criadas
- ✅ Confirme que o usuário tem o papel correto na tabela `usuarios`

### Solicitações não aparecem
- ✅ Verifique se o usuário está autenticado
- ✅ Confirme que as foreign keys estão corretas
- ✅ Verifique os logs do console do navegador

## 📊 6. Estrutura da Tabela

```sql
item_requests (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  description TEXT,
  priority TEXT ('low', 'medium', 'high', 'urgent'),
  status TEXT ('pending', 'in_progress', 'completed', 'cancelled'),
  requested_by UUID REFERENCES usuarios(id),
  assigned_to UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

## ✅ 7. Checklist de Migração

- [ ] Script SQL executado no Supabase
- [ ] Tabela `item_requests` criada com sucesso
- [ ] Políticas RLS ativas
- [ ] Teste de criação de solicitação (usuário comum)
- [ ] Teste de visualização (admin)
- [ ] Teste de atualização de status (admin)
- [ ] Teste de atribuição de responsável (admin)
- [ ] Badge da sidebar funcionando
- [ ] Notificações funcionando

---

🎉 **Parabéns!** A migração das solicitações para o Supabase está completa!

Agora o sistema de solicitações está totalmente funcional e integrado com o banco de dados, permitindo um controle completo sobre os pedidos de materiais e suprimentos da empresa.