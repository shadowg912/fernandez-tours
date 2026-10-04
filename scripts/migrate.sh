#!/usr/bin/env bash
# Uso: scripts/migrate.sh [develop|production|seed]
set -euo pipefail

set -a
# shellcheck disable=SC1091
source .env.local
set +a

case "${1:-}" in
  develop)
    echo "📦 Aplicando migraciones a DEVELOP (fernandez-tours-develop)..."
    npx supabase db push --db-url "$DATABASE_URL_DEVELOP"
    ;;
  seed)
    echo "🌱 Aplicando seed a DEVELOP..."
    node --env-file=.env.local scripts/seed.mjs
    ;;
  production)
    echo "⚠️  ATENCIÓN: estás a punto de aplicar migraciones a PRODUCCIÓN (Supabase)."
    echo "   REGLA DEL PROYECTO: esto requiere autorización explícita del usuario."
    read -r -p "   Escribe 'produccion' para confirmar: " confirm
    if [ "$confirm" != "produccion" ]; then
      echo "❌ Cancelado."
      exit 1
    fi
    npx supabase db push --db-url "$DATABASE_URL_PRODUCTION"
    ;;
  *)
    echo "Uso: scripts/migrate.sh [develop|seed|production]"
    exit 1
    ;;
esac
