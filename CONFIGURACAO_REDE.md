# 🌐 Configuração de Rede - Dashboard Plascar

## 📋 Acesso via Domínio Personalizado

Para acessar o dashboard usando um nome amigável em vez do IP, configure o arquivo `hosts` em cada computador da rede.

### 🖥️ Windows

1. **Abra o Bloco de Notas como Administrador**
   - Clique com botão direito no "Bloco de Notas"
   - Selecione "Executar como administrador"

2. **Abra o arquivo hosts**
   - No Bloco de Notas, vá em Arquivo > Abrir
   - Navegue até: `C:\Windows\System32\drivers\etc\`
   - Altere o tipo de arquivo para "Todos os arquivos (*.*)"
   - Selecione o arquivo `hosts`

3. **Adicione as seguintes linhas no final do arquivo:**
   ```
   192.168.15.94    plascar.local
   192.168.15.94    dashboard.plascar.local
   ```

4. **Salve o arquivo**

### 🐧 Linux/Mac

1. **Abra o terminal**

2. **Edite o arquivo hosts:**
   ```bash
   sudo nano /etc/hosts
   ```

3. **Adicione as seguintes linhas no final do arquivo:**
   ```
   192.168.15.94    plascar.local
   192.168.15.94    dashboard.plascar.local
   ```

4. **Salve e feche o arquivo**
   - No nano: Ctrl+X, depois Y, depois Enter

## 🚀 URLs de Acesso

Após configurar o arquivo hosts:

- **Dashboard Principal**: `http://plascar.local:3000`
- **API Backend**: `http://plascar.local:3001`
- **Dashboard Alternativo**: `http://dashboard.plascar.local:3000`

## 🔧 URLs Alternativas (sem configuração)

Se não quiser configurar o arquivo hosts:

- **Dashboard**: `http://192.168.15.94:3000`
- **API**: `http://192.168.15.94:3001`

## ⚠️ Importante

- O servidor deve estar ligado e rodando os serviços
- Todos os computadores devem estar na mesma rede (192.168.15.x)
- Se o IP do servidor mudar, atualize o arquivo hosts

## 🆘 Solução de Problemas

1. **Não consegue acessar?**
   - Verifique se está na mesma rede
   - Teste com `ping plascar.local`
   - Verifique se o firewall não está bloqueando

2. **Erro de conexão com API?**
   - Verifique se o backend está rodando
   - Teste: `http://plascar.local:3001/api/health`

3. **Arquivo hosts não funciona?**
   - Certifique-se de ter salvado como administrador
   - Reinicie o navegador
   - Limpe o cache DNS: `ipconfig /flushdns` (Windows)
