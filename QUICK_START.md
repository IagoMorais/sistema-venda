# ⚡ Guia de Inicialização Rápida - ControlhePDV

## 🚀 Começando em 3 Minutos

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd sistema-gestao-controlhepdv

# 2. Instale e configure automaticamente
./start.sh install

# 3. Inicie o sistema
./start.sh dev
```

✅ **Pronto!** Acesse: http://localhost:3001

### Login Padrão
- **Usuário:** admin
- **Senha:** admin123

---

## 📋 Comandos Principais

### Script Unificado (./start.sh)

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `./start.sh install` | Instalação inicial | Primeira vez |
| `./start.sh dev` | Modo desenvolvimento | Trabalho diário |
| `./start.sh prod` | Modo produção | Deploy |
| `./start.sh test` | Executar testes | Validação |
| `./start.sh verify` | Verificar sistema | Diagnóstico |
| `./start.sh backup` | Backup manual | Manutenção |
| `./start.sh clean` | Limpar cache | Troubleshooting |
| `./start.sh logs` | Ver logs | Debug |
| `./start.sh help` | Ajuda completa | Dúvidas |

### Alternativa: NPM Scripts

```bash
npm run dev        # Desenvolvimento
npm run build      # Build produção
npm start          # Iniciar produção
npm test           # Executar testes
npm run db:push    # Atualizar schema DB
```

## ⚙️ Configuração Detalhada

### 1. Instalação Automática

O comando `./start.sh install` faz automaticamente:
- ✅ Verifica Node.js e npm
- ✅ Cria arquivo `.env` do `.env.example`
- ✅ Gera `SESSION_SECRET` aleatório
- ✅ Instala todas as dependências

### 2. Configuração Manual (se necessário)

Edite `.env`:
```env
# Banco de dados
DATABASE_URL=postgres://postgres:postgres@localhost:5432/controlhepdv

# Segurança (já gerado automaticamente)
SESSION_SECRET=<gerado-automaticamente>

# Servidor
PORT=3001
NODE_ENV=development
```

### 3. Docker (Automático)

O sistema inicia o PostgreSQL automaticamente via Docker quando você executa `./start.sh dev`.

Para desabilitar Docker:
```bash
./start.sh dev --no-docker
```

## 🌐 Acessando o Sistema

| URL | Descrição |
|-----|-----------|
| http://localhost:3001 | Interface principal |
| http://localhost:3001/api-docs | Documentação da API |
| http://localhost:3001/api/health | Status do servidor |

### 👤 Credenciais Padrão

| Usuário | Senha | Papel |
|---------|-------|-------|
| admin | admin123 | Administrador |
| waiter | waiter123 | Garçom |
| cashier | cashier123 | Caixa |
| kitchen | kitchen123 | Cozinha |
| bar | bar123 | Bar |

⚠️ **IMPORTANTE:** Altere as senhas em produção!

## 🎯 Próximos Passos

Após o sistema estar rodando:

### 1. Explorar Interface
- **Dashboard**: Visão geral do sistema
- **Produtos**: Cadastrar itens do cardápio
- **Usuários**: Gerenciar equipe

### 2. Cadastrar Produtos
```
Menu → Produtos → Novo Produto
- Nome: Ex: "Hambúrguer"
- Preço: Ex: 25.00
- Estoque: Ex: 50
- Estação: Cozinha ou Bar
```

### 3. Criar Pedido (Garçom)
```
Página do Garçom → Nova Comanda
- Selecionar mesa
- Adicionar produtos
- Enviar para cozinha/bar
```

### 4. Preparar Itens (Cozinha/Bar)
```
Página da Estação → Fila de Pedidos
- Ver itens pendentes
- Marcar como pronto
```

### 5. Finalizar Pedido (Caixa)
```
Página do Caixa → Pedidos Abertos
- Selecionar pedido
- Conferir itens
- Processar pagamento
```

## 📱 Atalhos do Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl/Cmd + K` | Busca rápida |
| `Ctrl/Cmd + B` | Toggle sidebar |
| `Ctrl/Cmd + ,` | Configurações |
| `?` | Ajuda de atalhos |

## 🔧 Comandos de Manutenção

### Verificar Sistema
```bash
./start.sh verify
```
Verifica:
- Node.js instalado
- Dependências instaladas
- Banco de dados conectado
- Arquivos necessários presentes

### Backup Manual
```bash
./start.sh backup
```
Cria backup em `./backups/backup_TIMESTAMP.sql`

### Limpar e Reconstruir
```bash
./start.sh clean      # Remove node_modules e builds
./start.sh install    # Reinstala tudo
./start.sh dev        # Inicia novamente
```

### Ver Logs
```bash
./start.sh logs       # Logs em tempo real
# OU
tail -f server.log    # Arquivo de log
```

## 🚨 Problemas Comuns

### "Porta 3001 já em uso"
```bash
# Matar processo na porta
lsof -ti:3001 | xargs kill -9

# OU usar outra porta no .env
PORT=3002
```

### "Banco de dados não conecta"
```bash
# Verificar se PostgreSQL está rodando
./start.sh verify

# Reiniciar Docker (se usando)
docker-compose restart db
```

### "ENOSPC: file watchers"
```env
# Adicionar no .env
DEV_USE_POLLING=1
DEV_POLLING_INTERVAL=150
```

### Mais problemas?
Consulte: **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

## 📚 Documentação Adicional

- **[README.md](README.md)** - Visão geral completa
- **[INSTALL.md](INSTALL.md)** - Guia de instalação detalhado
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solução de problemas
- **[ANALISE_SISTEMA.md](ANALISE_SISTEMA.md)** - Análise técnica

## 💡 Dicas Úteis

### Desenvolvimento Eficiente
1. **Use hot reload**: Mudanças refletem automaticamente
2. **Verifique logs**: `./start.sh logs` para debug
3. **Backup regular**: Ctrl+C cria backup automático
4. **API Docs**: http://localhost:3001/api-docs

### Produção
1. **Altere senhas padrão** antes de fazer deploy
2. **Gere SESSION_SECRET forte**: `openssl rand -base64 32`
3. **Use HTTPS** com reverse proxy (nginx/traefik)
4. **Configure backups automáticos** do banco

## 🎉 Pronto para Começar!

```bash
./start.sh dev
```

Acesse http://localhost:3001 e faça login com **admin / admin123**

**Divirta-se!** 🚀
