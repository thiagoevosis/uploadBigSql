#!/bin/bash

echo "Iniciando UploadSql..."

# Mata processos antigos que possam estar rodando nas portas
echo "Limpando portas 3000 e 3001..."
kill -9 $(lsof -t -i:3000) 2>/dev/null || true
kill -9 $(lsof -t -i:3001) 2>/dev/null || true
kill -9 $(lsof -t -i:5173) 2>/dev/null || true

# Configura o diretório base baseado em onde o script está
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Inicia o backend em segundo plano
echo "Iniciando Servidor Backend..."
cd "$BASE_DIR/backend"
PORT=3001 npm start &
BACKEND_PID=$!

# Inicia o frontend em segundo plano
echo "Iniciando Servidor Frontend..."
cd "$BASE_DIR/frontend"
npm run dev -- --host &
FRONTEND_PID=$!

echo "======================================"
echo " UploadSql rodando perfeitamente!"
echo " Backend Node.js: http://localhost:3001"
echo " Frontend React: http://localhost:5173"
echo " Abrindo navegador..."
echo " (Para encerrar tudo, aperte CTRL+C nesta janela)"
echo "======================================"

# Tenta abrir o navegador automaticamente
sleep 2
xdg-open http://localhost:5173 2>/dev/null || true

# Função para matar tudo se o usuário apertar CTRL+C
cleanup() {
    echo ""
    echo "Encerrando servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup INT

# Mantém o script rodando para deixar os servidores no ar
wait
