-- Torna stripeInvoiceId opcional (Pix não tem ID Stripe)
ALTER TABLE "PendingInvoice" ALTER COLUMN "stripeInvoiceId" DROP NOT NULL;

-- Adiciona pixPaymentId para rastrear NFS-e de pagamentos Pix
ALTER TABLE "PendingInvoice" ADD COLUMN "pixPaymentId" TEXT;
CREATE UNIQUE INDEX "PendingInvoice_pixPaymentId_key" ON "PendingInvoice"("pixPaymentId");
