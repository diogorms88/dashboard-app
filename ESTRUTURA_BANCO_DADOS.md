# 🗄️ Estrutura do Banco de Dados - Dashboard Plascar

## 📊 Visão Geral
O sistema utiliza **SQLite** com **16 tabelas** organizadas em 6 módulos principais:
- **Usuários e Autenticação** (1 tabela)
- **Produção** (4 tabelas)
- **Materiais** (2 tabelas)  
- **Solicitações** (1 tabela)
- **Formulários 8D** (5 tabelas)
- **Planejamento** (4 tabelas)

---

## 👥 **1. MÓDULO DE USUÁRIOS**

### 🔐 `users` - Usuários do Sistema
**Função:** Gerencia todos os usuários e suas permissões
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `username` | TEXT (UNIQUE) | Nome de usuário para login |
| `nome` | TEXT | Nome completo do usuário |
| `senha` | TEXT | Senha criptografada (bcrypt) |
| `papel` | TEXT | Nível de acesso: 'admin', 'manager', 'operator', 'viewer' |
| `ativo` | BOOLEAN | Se o usuário está ativo (1) ou inativo (0) |
| `created_at` | DATETIME | Data de criação da conta |
| `updated_at` | DATETIME | Data da última atualização |

---

## 🏭 **2. MÓDULO DE PRODUÇÃO**

### 📈 `production_records` - Registros de Produção
**Função:** Registra a produção por turno e horário
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `time_slot` | TEXT | Horário da produção (ex: "07:00-08:00") |
| `shift` | TEXT | Turno (ex: "Manhã", "Tarde", "Noite") |
| `skids_produced` | INTEGER | Quantidade de skids produzidos |
| `empty_skids` | INTEGER | Quantidade de skids vazios |
| `created_by` | INTEGER (FK) | Usuário que criou o registro |
| `created_at` | DATETIME | Data/hora do registro |

### ⏱️ `downtime_records` - Registros de Paradas
**Função:** Registra paradas de produção e seus motivos
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `production_id` | INTEGER (FK) | Referência ao registro de produção |
| `reason` | TEXT | Motivo da parada |
| `duration` | INTEGER | Duração da parada (em minutos) |
| `description` | TEXT | Descrição detalhada da parada |

### 🎨 `production_details` - Detalhes da Produção
**Função:** Detalha modelos, cores e quantidades produzidas
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `production_id` | INTEGER (FK) | Referência ao registro de produção |
| `model` | TEXT | Modelo do produto (ex: "Gol", "Polo") |
| `color` | TEXT | Cor do produto |
| `quantity` | INTEGER | Quantidade produzida deste modelo/cor |
| `is_repaint` | BOOLEAN | Se é repintura (1) ou primeira pintura (0) |

---

## 🧪 **3. MÓDULO DE MATERIAIS**

### ⚙️ `material_settings` - Configurações de Materiais
**Função:** Define propriedades dos materiais de pintura
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `material_name` | TEXT (UNIQUE) | Nome do material |
| `dilution_rate` | REAL | Taxa de diluição (%) |
| `diluent_type` | TEXT | Tipo de diluente ('primer', 'thinner', etc.) |
| `catalyst_rate` | REAL | Taxa de catalisador (%) |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data da última atualização |

### 📊 `model_material_consumption` - Consumo por Modelo
**Função:** Define consumo de tinta por modelo e cor
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `model` | TEXT | Modelo do veículo |
| `color` | TEXT | Cor |
| `primer_ml_per_piece` | REAL | Primer em ml por peça |
| `base_ml_per_piece` | REAL | Tinta base em ml por peça |
| `varnish_ml_per_piece` | REAL | Verniz em ml por peça |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data da última atualização |

---

## 📋 **4. MÓDULO DE SOLICITAÇÕES**

### 🛒 `item_requests` - Solicitações de Itens
**Função:** Gerencia pedidos de materiais e suprimentos
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `item_name` | TEXT | Nome do item solicitado |
| `quantity` | INTEGER | Quantidade solicitada |
| `description` | TEXT | Descrição detalhada |
| `priority` | TEXT | Prioridade: 'baixa', 'media', 'alta', 'urgente' |
| `status` | TEXT | Status: 'pendente', 'em_andamento', 'concluida', 'cancelada' |
| `requested_by` | INTEGER (FK) | Usuário solicitante |
| `assigned_to` | INTEGER (FK) | Usuário responsável |
| `created_at` | DATETIME | Data da solicitação |
| `updated_at` | DATETIME | Data da última atualização |

---

## 🔍 **5. MÓDULO FORMULÁRIOS 8D**

### 📝 `forms_8d` - Formulários 8D Principais
**Função:** Formulários de resolução de problemas (metodologia 8D)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `title` | TEXT | Título do problema |
| `problem_description` | TEXT | Descrição detalhada |
| `team_members` | TEXT | Membros da equipe (JSON) |
| `problem_date` | DATE | Data do problema |
| `detection_date` | DATE | Data de detecção |
| `customer_impact` | TEXT | Impacto no cliente |
| `severity_level` | TEXT | Severidade: 'baixa', 'media', 'alta', 'critica' |
| `status` | TEXT | Status: 'aberto', 'em_andamento', 'concluido', 'cancelado' |
| `created_by` | INTEGER (FK) | Usuário criador |
| `assigned_to` | INTEGER (FK) | Responsável |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data da última atualização |
| `completed_at` | DATETIME | Data de conclusão |

### 🐟 `ishikawa_analysis` - Análise Ishikawa (Espinha de Peixe)
**Função:** Análise de causas usando diagrama Ishikawa
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `form_8d_id` | INTEGER (FK) | Referência ao formulário 8D |
| `category` | TEXT | Categoria: 'mao_de_obra', 'maquina', 'material', 'metodo', 'meio_ambiente', 'medicao' |
| `cause_description` | TEXT | Descrição da causa |
| `subcause_description` | TEXT | Descrição da subcausa |
| `impact_level` | INTEGER | Nível de impacto (1-5) |
| `created_at` | DATETIME | Data de criação |

### ❓ `five_whys_analysis` - Análise dos 5 Porquês
**Função:** Análise de causa raiz usando metodologia dos 5 porquês
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `form_8d_id` | INTEGER (FK) | Referência ao formulário 8D |
| `problem_statement` | TEXT | Declaração do problema |
| `why_1` | TEXT | Primeiro porquê |
| `why_2` | TEXT | Segundo porquê |
| `why_3` | TEXT | Terceiro porquê |
| `why_4` | TEXT | Quarto porquê |
| `why_5` | TEXT | Quinto porquê |
| `root_cause` | TEXT | Causa raiz identificada |
| `created_at` | DATETIME | Data de criação |

### 📋 `action_plans` - Planos de Ação
**Função:** Ações corretivas e preventivas do 8D
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `form_8d_id` | INTEGER (FK) | Referência ao formulário 8D |
| `action_type` | TEXT | Tipo: 'imediata', 'corretiva', 'preventiva' |
| `action_description` | TEXT | Descrição da ação |
| `responsible_person` | TEXT | Pessoa responsável |
| `due_date` | DATE | Data limite |
| `status` | TEXT | Status: 'pendente', 'em_andamento', 'concluida', 'atrasada' |
| `completion_date` | DATE | Data de conclusão |
| `verification_method` | TEXT | Método de verificação |
| `effectiveness_check` | TEXT | Verificação de eficácia |
| `created_at` | DATETIME | Data de criação |

### 🔢 `disciplines_8d` - Disciplinas do 8D
**Função:** Controla as 8 disciplinas da metodologia 8D
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `form_8d_id` | INTEGER (FK) | Referência ao formulário 8D |
| `discipline_id` | TEXT | Disciplina: 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8' |
| `status` | TEXT | Status: 'pendente', 'em_andamento', 'concluida' |
| `content` | TEXT | Conteúdo da disciplina |
| `responsible_person` | TEXT | Responsável |
| `completion_date` | DATE | Data de conclusão |
| `comments` | TEXT | Comentários |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data da última atualização |

---

## 📅 **6. MÓDULO DE PLANEJAMENTO**

### 🎯 `planning_projects` - Projetos de Planejamento
**Função:** Projetos e iniciativas da empresa
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `title` | TEXT | Título do projeto |
| `description` | TEXT | Descrição |
| `project_type` | TEXT | Tipo: 'projeto', 'melhoria', 'manutencao', 'treinamento', 'auditoria' |
| `priority` | TEXT | Prioridade: 'baixa', 'media', 'alta', 'critica' |
| `status` | TEXT | Status: 'planejado', 'em_andamento', 'pausado', 'concluido', 'cancelado' |
| `start_date` | DATE | Data de início planejada |
| `end_date` | DATE | Data de fim planejada |
| `actual_start_date` | DATE | Data de início real |
| `actual_end_date` | DATE | Data de fim real |
| `progress_percentage` | INTEGER | Progresso (0-100%) |
| `budget` | REAL | Orçamento |
| `actual_cost` | REAL | Custo real |
| `responsible_person` | TEXT | Pessoa responsável |
| `team_members` | TEXT | Membros da equipe (JSON) |
| `created_by` | INTEGER (FK) | Usuário criador |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data da última atualização |

### ✅ `planning_tasks` - Tarefas do Projeto
**Função:** Tarefas individuais dentro dos projetos
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `project_id` | INTEGER (FK) | Referência ao projeto |
| `task_name` | TEXT | Nome da tarefa |
| `description` | TEXT | Descrição |
| `assigned_to` | TEXT | Pessoa designada |
| `priority` | TEXT | Prioridade: 'baixa', 'media', 'alta', 'critica' |
| `status` | TEXT | Status: 'pendente', 'em_andamento', 'concluida', 'bloqueada' |
| `start_date` | DATE | Data de início |
| `end_date` | DATE | Data de fim |
| `actual_start_date` | DATE | Data de início real |
| `actual_end_date` | DATE | Data de fim real |
| `progress_percentage` | INTEGER | Progresso (0-100%) |
| `dependencies` | TEXT | Dependências (JSON) |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data da última atualização |

### 🎯 `planning_milestones` - Marcos do Projeto
**Função:** Marcos importantes dos projetos
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `project_id` | INTEGER (FK) | Referência ao projeto |
| `milestone_name` | TEXT | Nome do marco |
| `description` | TEXT | Descrição |
| `target_date` | DATE | Data alvo |
| `actual_date` | DATE | Data real |
| `status` | TEXT | Status: 'pendente', 'concluido', 'atrasado' |
| `completion_criteria` | TEXT | Critérios de conclusão |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data da última atualização |

### 📈 `planning_timeline` - Timeline do Projeto
**Função:** Histórico de eventos dos projetos
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INTEGER (PK) | Identificador único |
| `project_id` | INTEGER (FK) | Referência ao projeto |
| `event_type` | TEXT | Tipo: 'criacao', 'inicio', 'progresso', 'marco', 'conclusao', 'pausa', 'cancelamento', 'comentario' |
| `event_title` | TEXT | Título do evento |
| `event_description` | TEXT | Descrição do evento |
| `event_date` | DATETIME | Data/hora do evento |
| `progress_before` | INTEGER | Progresso antes |
| `progress_after` | INTEGER | Progresso depois |
| `created_by` | INTEGER (FK) | Usuário que criou |
| `attachments` | TEXT | Anexos (JSON) |
| `created_at` | DATETIME | Data de criação |

---

## 🔗 **Relacionamentos Principais**

### Chaves Estrangeiras:
- `production_records.created_by` → `users.id`
- `downtime_records.production_id` → `production_records.id`
- `production_details.production_id` → `production_records.id`
- `item_requests.requested_by` → `users.id`
- `item_requests.assigned_to` → `users.id`
- `forms_8d.created_by` → `users.id`
- `forms_8d.assigned_to` → `users.id`
- `ishikawa_analysis.form_8d_id` → `forms_8d.id`
- `five_whys_analysis.form_8d_id` → `forms_8d.id`
- `action_plans.form_8d_id` → `forms_8d.id`
- `disciplines_8d.form_8d_id` → `forms_8d.id`
- `planning_projects.created_by` → `users.id`
- `planning_tasks.project_id` → `planning_projects.id`
- `planning_milestones.project_id` → `planning_projects.id`
- `planning_timeline.project_id` → `planning_projects.id`
- `planning_timeline.created_by` → `users.id`

---

## 📊 **Resumo por Módulo**

| Módulo | Tabelas | Função Principal |
|--------|---------|------------------|
| **Usuários** | 1 | Autenticação e controle de acesso |
| **Produção** | 4 | Controle da produção, paradas e detalhes |
| **Materiais** | 2 | Gestão de materiais e consumo |
| **Solicitações** | 1 | Pedidos de materiais e suprimentos |
| **8D** | 5 | Resolução de problemas e qualidade |
| **Planejamento** | 4 | Gestão de projetos e tarefas |

**Total: 16 tabelas** que suportam um sistema completo de gestão industrial! 🏭

