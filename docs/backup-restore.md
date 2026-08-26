# Backup & Restore — Raio Publicador

## Como fazer backup manual

```bash
bash scripts/backup-db.sh
```

Gera um arquivo `.sql.gz` na pasta `backups/`.

## Como restaurar um backup

```bash
# Descomprimir
gunzip raio_backup_YYYYMMDD_HHMMSS.sql.gz

# Restaurar (substitua DATABASE_URL pelo banco de destino)
psql "$DATABASE_URL" < raio_backup_YYYYMMDD_HHMMSS.sql
```

## Backup automático (GitHub Actions)

O workflow `.github/workflows/backup.yml` roda todo dia às 04:00 UTC.

**Configurar o secret:**
1. GitHub → raio-publicador → Settings → Secrets and variables → Actions
2. New repository secret: `DATABASE_URL` = valor do POSTGRES_URL da Vercel

Os backups ficam em Actions → workflow run → Artifacts por 90 dias.

## Restore via Neon (Point-in-time Recovery)

1. console.neon.tech → seu projeto → Branches
2. "Restore" → escolha data/hora
3. Neon cria um branch com o estado daquele momento
4. Teste no branch; se OK, promova para main

## O que está protegido

| Dado | Onde | Backup |
|---|---|---|
| Marcas (Brand) | PostgreSQL | Neon PITR + GitHub Actions |
| Releases | PostgreSQL | Neon PITR + GitHub Actions |
| Veículos | PostgreSQL | Neon PITR + GitHub Actions |
| Assinaturas/créditos | PostgreSQL | Neon PITR + GitHub Actions |
| Usuários/auth | Clerk | Gerenciado pelo Clerk (não precisa backup) |
| Pagamentos | Stripe | Gerenciado pelo Stripe (não precisa backup) |
| Imagens/logos | Vercel Blob ou URL externa | Verificar separadamente |
