CREATE TABLE "PendingInvoice" (
  "id"              TEXT NOT NULL,
  "clerkId"         TEXT NOT NULL,
  "stripeInvoiceId" TEXT NOT NULL,
  "amountCents"     INTEGER NOT NULL,
  "scheduledFor"    TIMESTAMP(3) NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'PENDING',
  "nfeioId"         TEXT,
  "errorMessage"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PendingInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingInvoice_stripeInvoiceId_key" ON "PendingInvoice"("stripeInvoiceId");
