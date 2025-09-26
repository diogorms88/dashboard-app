# 🎨 Plascar Dashboard

Dashboard de controle de produção de pintura automotiva desenvolvido em Next.js com Supabase.

## 🚀 Funcionalidades

- **📊 Dashboard de Produção**: Visualização em tempo real da produção por turnos
- **🎨 Controle de Materiais**: Cálculo automático de consumo de primer, base, verniz e diluentes
- **📈 Relatórios Detalhados**: Análise de produção por modelo, cor e horário
- **👥 Gestão de Usuários**: Sistema de autenticação com diferentes níveis de acesso
- **⚙️ Configurações**: Configuração flexível de consumo de materiais por modelo/cor

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Charts**: Recharts

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- npm ou yarn

## ⚙️ Configuração

1. **Clone o repositório**
```bash
git clone [url-do-repositorio]
cd plascar-dashboard
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env.local` na raiz do projeto:
```bash
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
JWT_SECRET=sua_chave_jwt_secreta
```

4. **Configure o banco de dados**
Execute o script SQL para criar as tabelas necessárias:
```bash
# No painel do Supabase SQL Editor, execute:
scripts/create-material-tables-supabase.sql
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 🗃️ Estrutura do Projeto

```
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Páginas do dashboard
│   ├── login/            # Página de login
│   └── globals.css       # Estilos globais
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── ...               # Componentes específicos
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
├── public/               # Arquivos estáticos
└── scripts/              # Scripts de configuração
```

## 📊 Principais Funcionalidades

### Dashboard de Produção
- Visualização de peças pintadas por turno
- Gráficos de produção por modelo e cor
- Indicadores de performance em tempo real

### Controle de Materiais
- Cálculo automático de consumo baseado em configurações
- Separação entre materiais puros e diluentes
- Suporte a diferentes tipos de primer (P&A)
- Configurações específicas por modelo/cor

### Relatórios
- Produção detalhada por modelo e cor
- Análise de consumo hora a hora
- Exportação de dados

## 🔧 Configuração de Materiais

O sistema permite configurar:
- Taxa de diluição por tipo de material
- Consumo específico por modelo/cor
- Configurações de catalisador
- Fallbacks inteligentes para itens sem configuração específica

## 🚀 Deploy

O projeto está pronto para deploy em plataformas como:
- Vercel (recomendado)
- Netlify
- Railway

Certifique-se de configurar as variáveis de ambiente na plataforma escolhida.

## 📄 Licença

Este projeto é propriedade da Plascar e destina-se ao uso interno.

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## ⚠️ Notas Importantes

- Este sistema foi migrado de SQLite para Supabase
- Todas as configurações de materiais são flexíveis e editáveis
- O sistema suporta diferentes turnos e filtros de data
- Logs detalhados estão disponíveis para debugging