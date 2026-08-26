#!/bin/bash
# backup-blobs.sh — baixa todos os blobs do Vercel Blob Store para ./backups/blobs/
# Uso: bash scripts/backup-blobs.sh
# Requer: curl, jq

set -e

# Carrega token do .env.local se existir
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | grep BLOB_READ_WRITE_TOKEN | xargs)
fi

if [ -z "$BLOB_READ_WRITE_TOKEN" ]; then
  echo "❌ BLOB_READ_WRITE_TOKEN não definido"
  echo "   Defina no .env.local ou exporte antes de rodar:"
  echo "   export BLOB_READ_WRITE_TOKEN='vercel_blob_rw_...'"
  exit 1
fi

BACKUP_DIR="./backups/blobs/$(date +"%Y%m%d_%H%M%S")"
mkdir -p "$BACKUP_DIR"

echo "⏳ Listando blobs..."

CURSOR=""
TOTAL=0

while true; do
  # Monta URL com cursor de paginação se houver
  if [ -z "$CURSOR" ]; then
    URL="https://blob.vercel-storage.com?limit=1000"
  else
    URL="https://blob.vercel-storage.com?limit=1000&cursor=${CURSOR}"
  fi

  RESPONSE=$(curl -s "$URL" \
    -H "Authorization: Bearer $BLOB_READ_WRITE_TOKEN")

  # Extrai lista de blobs
  BLOBS=$(echo "$RESPONSE" | jq -r '.blobs[] | .url + " " + .pathname')

  if [ -z "$BLOBS" ]; then
    break
  fi

  while IFS= read -r line; do
    BLOB_URL=$(echo "$line" | awk '{print $1}')
    PATHNAME=$(echo "$line" | awk '{print $2}')

    # Cria subdiretório se necessário (ex: logos/)
    DEST="$BACKUP_DIR/$PATHNAME"
    mkdir -p "$(dirname "$DEST")"

    curl -s -o "$DEST" "$BLOB_URL"
    echo "  ✅ $PATHNAME"
    TOTAL=$((TOTAL + 1))
  done <<< "$BLOBS"

  # Verifica se há próxima página
  HAS_MORE=$(echo "$RESPONSE" | jq -r '.hasMore // false')
  if [ "$HAS_MORE" != "true" ]; then
    break
  fi
  CURSOR=$(echo "$RESPONSE" | jq -r '.cursor')
done

echo ""
echo "✅ $TOTAL blobs salvos em $BACKUP_DIR"
echo "   Tamanho: $(du -sh "$BACKUP_DIR" | cut -f1)"

# Remove backups de blobs com mais de 30 dias
find "./backups/blobs" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
echo "🧹 Backups antigos (>30d) removidos"
