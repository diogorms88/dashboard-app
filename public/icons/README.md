# Ícones PNG Customizados

Coloque suas imagens PNG nesta pasta com os seguintes nomes:

- `dashboard.png` - Ícone do dashboard principal
- `database.png` - Ícone do banco de dados
- `production.png` - Ícone de produção
- `materials.png` - Ícone de materiais
- `analytics.png` - Ícone de análises
- `reports.png` - Ícone de relatórios
- `planning.png` - Ícone de planejamento

## Recomendações:

- **Tamanho**: 24x24px ou 48x48px para melhor qualidade
- **Formato**: PNG com fundo transparente
- **Estilo**: Mantenha um estilo consistente entre todos os ícones
- **Cores**: Use cores que combinem com o design do seu sistema

## Como adicionar novos ícones:

1. Salve sua imagem PNG nesta pasta
2. Edite o arquivo `components/magicui/animated-beam-demo.tsx`
3. Modifique o objeto `Icons` para referenciar sua nova imagem
4. Exemplo:
   ```tsx
   novoIcone: () => (
     <CustomIcon 
       src="/icons/seu-icone.png" 
       alt="Descrição do ícone"
       className="w-6 h-6"
     />
   ),
   ```
