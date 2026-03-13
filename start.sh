#!/bin/bash
# SGE-UNT — Script de inicio rápido (sin Docker)
# Uso: chmod +x start.sh && ./start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================"
echo "  SGE-UNT — Sistema de Egresados UNT"
echo "======================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js no encontrado. Instala Node.js 20+ desde https://nodejs.org"
  exit 1
fi

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "❌ PostgreSQL no encontrado. Instala PostgreSQL 16."
  exit 1
fi

echo "📦 Instalando dependencias de todos los módulos..."
for mod in modulo-1-registro modulo-2-bolsa modulo-3-seguimiento modulo-4-mentores; do
  echo "  → $mod/backend"
  (cd "$mod/backend" && npm install --silent)
  echo "  → $mod/frontend"
  (cd "$mod/frontend" && npm install --silent)
done

echo ""
echo "🗄️  Configurando base de datos..."
psql -U postgres -c "CREATE DATABASE egresados_unt;" 2>/dev/null || echo "  (BD ya existe)"
psql -U postgres -d egresados_unt -f database/init/01_init.sql

echo ""
echo "📝 Copiando archivos .env..."
for mod in modulo-1-registro modulo-2-bolsa modulo-3-seguimiento modulo-4-mentores; do
  cp -n "$mod/backend/.env.example" "$mod/backend/.env" 2>/dev/null || true
done

echo ""
echo "🚀 Iniciando servicios en background..."
for mod in modulo-1-registro modulo-2-bolsa modulo-3-seguimiento modulo-4-mentores; do
  (cd "$mod/backend" && npm start > /tmp/sge_${mod}_backend.log 2>&1 &)
  echo "  ✓ $mod backend iniciado"
done

sleep 2

for mod in modulo-1-registro modulo-2-bolsa modulo-3-seguimiento modulo-4-mentores; do
  (cd "$mod/frontend" && npm run dev > /tmp/sge_${mod}_frontend.log 2>&1 &)
  echo "  ✓ $mod frontend iniciado"
done

echo ""
echo "======================================"
echo "✅ SGE-UNT iniciado correctamente"
echo "======================================"
echo ""
echo "🌐 URLs de acceso:"
echo "  Módulo 1 (Registro):    http://localhost:5173"
echo "  Módulo 2 (Bolsa):       http://localhost:5174"
echo "  Módulo 3 (Seguimiento): http://localhost:5175"
echo "  Módulo 4 (Mentores):    http://localhost:5176"
echo ""
echo "🔑 Credenciales:"
echo "  Admin:   admin / Admin2024!"
echo "  Empresa: rrhh@techsol.com / Empresa2024!"
echo ""
echo "📋 Para ver logs: tail -f /tmp/sge_modulo-1-registro_backend.log"
echo "🛑 Para detener: pkill -f 'node server.js' && pkill -f 'vite'"
