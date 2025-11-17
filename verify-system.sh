#!/bin/bash

# verify-system.sh - Script completo para verificar e testar todo o sistema
# Inclui: testes de rotas, verificação de banco, build do frontend, etc.

set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_ROOT"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        success "$1 está instalado"
        return 0
    else
        error "$1 não está instalado"
        return 1
    fi
}

check_env_file() {
    if [[ -f .env ]]; then
        success "Arquivo .env encontrado"
        return 0
    else
        warning "Arquivo .env não encontrado, usando .env.example"
        if [[ -f .env.example ]]; then
            cp .env.example .env
            success "Arquivo .env criado a partir do .env.example"
        else
            error "Nem .env nem .env.example encontrados"
            return 1
        fi
    fi
}

check_database() {
    log "Verificando conexão com o banco de dados..."
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        source .env 2>/dev/null || true
    fi
    
    if [[ -n "${DATABASE_URL:-}" ]]; then
        if command -v psql >/dev/null 2>&1; then
            if psql "${DATABASE_URL}" -c "SELECT 1;" >/dev/null 2>&1; then
                success "Conexão com banco de dados OK"
                return 0
            else
                error "Falha ao conectar ao banco de dados"
                return 1
            fi
        else
            warning "psql não está instalado, pulando teste de conexão"
            return 0
        fi
    else
        warning "DATABASE_URL não configurado"
        return 1
    fi
}

check_dependencies() {
    log "Verificando dependências..."
    
    if [[ -f package.json ]]; then
        if [[ -d node_modules ]]; then
            success "node_modules encontrado"
        else
            warning "node_modules não encontrado, instalando..."
            npm install
        fi
        
        # Verificar se há dependências desatualizadas
        npm outdated 2>/dev/null || true
    else
        error "package.json não encontrado"
        return 1
    fi
}

check_build() {
    log "Verificando build do frontend..."
    
    if npm run build >/dev/null 2>&1; then
        success "Build do frontend OK"
        return 0
    else
        error "Falha no build do frontend"
        return 1
    fi
}

test_routes() {
    log "Testando rotas do servidor..."
    
    if [[ -x ./test-server.sh ]]; then
        ./test-server.sh
    else
        warning "test-server.sh não encontrado ou não executável"
    fi
}

test_api_endpoints() {
    log "Testando endpoints da API..."
    
    if [[ -x ./test-routes.sh ]]; then
        ./test-routes.sh
    else
        warning "test-routes.sh não encontrado ou não executável"
    fi
}

check_docker() {
    log "Verificando Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        if docker info >/dev/null 2>&1; then
            success "Docker está rodando"
            
            if docker compose version >/dev/null 2>&1 || docker-compose version >/dev/null 2>&1; then
                success "Docker Compose está disponível"
            else
                warning "Docker Compose não está disponível"
            fi
        else
            error "Docker não está rodando"
        fi
    else
        warning "Docker não está instalado"
    fi
}

run_tests() {
    log "Executando testes automatizados..."
    
    if npm test >/dev/null 2>&1; then
        success "Todos os testes passaram"
    else
        error "Alguns testes falharam"
    fi
}

main() {
    echo "🔍 Sistema de Verificação Integrada"
    echo "=================================="
    echo ""
    
    # Verificar comandos essenciais
    check_command node
    check_command npm
    check_command git
    
    # Verificar ambiente
    check_env_file
    
    # Verificar dependências
    check_dependencies
    
    # Verificar banco de dados
    check_database
    
    # Verificar Docker
    check_docker
    
    # Verificar build
    check_build
    
    # Testar rotas
    test_routes
    
    # Testar API
    test_api_endpoints
    
    # Executar testes
    run_tests
    
    echo ""
    echo "🎯 Verificação concluída!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Para iniciar o sistema: ./start.sh"
    echo "   2. Para testar manualmente: npm run dev"
    echo "   3. Para ver logs: tail -f server.log"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
