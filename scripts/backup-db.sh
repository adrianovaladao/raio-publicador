#!/bin/bash
# backup-db.sh — exporta o banco de produção para um arquivo .sql.gz
# Uso manual: bash scripts/backup-db.sh
# Uso automático: cron ou GitHub Actions (ver docs/backup.md)

set -e

# Carrega variáveis do .env.production.local se existir
if [ -f ".env.production.local" ]; then
  export $(grep -v '^#' .env.production.local | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não definido"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
FILENAME="raio_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "⏳ Exportando banco..."
pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "✅ Backup salvo: ${BACKUP_DIR}/${FILENAME} (${SIZE})"

# Remove backups locais com mais de 30 dias
find "$BACKUP_DIR" -name "raio_backup_*.sql.gz" -mtime +30 -delete
echo "🧹 Backups antigos (>30d) removidos"
