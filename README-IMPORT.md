# 📊 CSV Import Tool - SQLite

## 🎯 Funcionalidades

Este script TypeScript importa dados de CSV para SQLite com as seguintes características:

- ✅ **UPSERT idempotente** em `production_records`
- ✅ **Limpeza automática** de registros filhos antes da inserção
- ✅ **Geração de UUIDs** para tabelas filhas
- ✅ **Tratamento robusto de erros** JSON
- ✅ **Transações** para garantir integridade
- ✅ **Verificações automáticas** após importação

## 🚀 Como usar

### 1. Instalar dependências
```bash
# Copiar package.json
cp package-import.json package.json

# Instalar dependências
npm install
```

### 2. Preparar arquivos
- Certifique-se que o arquivo `registros_rows (3).csv` está na pasta
- O banco `app.db` será criado automaticamente

### 3. Executar importação
```bash
npm run import
```

## 📋 Estrutura do CSV Esperada

O CSV deve ter as seguintes colunas:
- `id` - Identificador único
- `data` - Data da produção
- `hora` - Janela de horário (formato: "07h00 - 08h00")
- `skids` - Quantidade de skids produzidos
- `skids_vazios` - Quantidade de skids vazios
- `paradas` - JSON com array de paradas
- `producao` - JSON com array de detalhes de produção

## 🗄️ Schema do Banco

### Tabelas Criadas:
1. **`users`** - Usuários do sistema
2. **`production_records`** - Registros principais de produção
3. **`downtime_records`** - Registros de paradas (filha de production_records)
4. **`production_details`** - Detalhes da produção (filha de production_records)
5. **`material_settings`** - Configurações de materiais

### Relacionamentos:
- `downtime_records.record_id` → `production_records.id`
- `production_details.record_id` → `production_records.id`

## 📊 Exemplo de JSON no CSV

### Paradas (coluna `paradas`):
```json
[
  {
    "type": "manutencao",
    "minutes": 15,
    "criteria": "preventiva",
    "description": "Troca de filtro"
  }
]
```

### Produção (coluna `producao`):
```json
[
  {
    "model": "Gol",
    "color": "Branco",
    "quantity": 25
  },
  {
    "model": "Polo",
    "color": "Prata",
    "quantity": 18
  }
]
```

## 🔧 Características Técnicas

### Tratamento de Erros:
- **JSON inválido**: Salva texto bruto e pula expansão
- **Campos faltantes**: Usa valores padrão
- **Horários inválidos**: Define como NULL
- **Transações**: Rollback automático em caso de erro

### Performance:
- **Transações em lote**: Melhor performance
- **Prepared statements**: Prevenção de SQL injection
- **UPSERT**: Evita duplicatas
- **Foreign keys**: Integridade referencial

### Logs:
- ✅ Progresso da importação
- ⚠️ Avisos para dados problemáticos
- ❌ Erros detalhados
- 📊 Estatísticas finais

## 🎛️ Personalização

### Alterar caminhos:
```typescript
const importer = new CSVImporter('./meu-banco.db', './meus-dados.csv');
```

### Executar programaticamente:
```typescript
import CSVImporter from './import_csv_to_sqlite';

const importer = new CSVImporter();
importer.run();
```

## 📈 Verificações Automáticas

Após a importação, o script exibe:
- 📊 Contagem de registros por tabela
- 📋 Amostra dos 3 registros mais recentes
- ✅ Status de sucesso/erro

## ⚠️ Importante

- O script é **idempotente**: pode ser executado múltiplas vezes
- Registros filhos são **recriados** a cada execução
- **Backup** seus dados antes de executar em produção
- Verifique se o CSV está no **formato UTF-8**

