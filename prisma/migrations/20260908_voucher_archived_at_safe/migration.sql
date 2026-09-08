-- Adiciona archivedAt se ainda não existir (idempotente)
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
