export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { put, list, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const RETENTION_DAYS = 30;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const today = new Date().toISOString().slice(0, 10); // "2026-09-10"

  try {
    // ── 1. Exporta todas as tabelas ──────────────────────────────────────────
    const [
      brands,
      releases,
      teamMembers,
      brandMembers,
      vehicles,
      subscriptions,
      invites,
      notifications,
      notificationPreferences,
      vouchers,
      voucherRedemptions,
      supportConversations,
      supportMessages,
      supportTickets,
      pixPayments,
      fiscalProfiles,
    ] = await Promise.all([
      prisma.brand.findMany(),
      prisma.release.findMany(),
      prisma.teamMember.findMany(),
      prisma.brandMember.findMany(),
      prisma.vehicle.findMany(),
      prisma.subscription.findMany(),
      prisma.invite.findMany(),
      prisma.notification.findMany(),
      prisma.notificationPreference.findMany(),
      prisma.voucher.findMany(),
      prisma.voucherRedemption.findMany(),
      prisma.supportConversation.findMany(),
      prisma.supportMessage.findMany(),
      prisma.supportTicket.findMany(),
      prisma.pixPayment.findMany(),
      prisma.fiscalProfile.findMany(),
    ]);

    const snapshot = {
      exportedAt: new Date().toISOString(),
      tables: {
        Brand:                   { count: brands.length,                   data: brands },
        Release:                 { count: releases.length,                 data: releases },
        TeamMember:              { count: teamMembers.length,              data: teamMembers },
        BrandMember:             { count: brandMembers.length,             data: brandMembers },
        Vehicle:                 { count: vehicles.length,                 data: vehicles },
        Subscription:            { count: subscriptions.length,            data: subscriptions },
        Invite:                  { count: invites.length,                  data: invites },
        Notification:            { count: notifications.length,            data: notifications },
        NotificationPreference:  { count: notificationPreferences.length,  data: notificationPreferences },
        Voucher:                 { count: vouchers.length,                 data: vouchers },
        VoucherRedemption:       { count: voucherRedemptions.length,       data: voucherRedemptions },
        SupportConversation:     { count: supportConversations.length,     data: supportConversations },
        SupportMessage:          { count: supportMessages.length,          data: supportMessages },
        SupportTicket:           { count: supportTickets.length,           data: supportTickets },
        PixPayment:              { count: pixPayments.length,              data: pixPayments },
        FiscalProfile:           { count: fiscalProfiles.length,           data: fiscalProfiles },
      },
    };

    // ── 2. Salva no Blob (privado) ───────────────────────────────────────────
    const filename = `backups/${today}.json`;
    const { url } = await put(
      filename,
      JSON.stringify(snapshot, null, 2),
      { access: "private", contentType: "application/json", addRandomSuffix: false }
    );

    // ── 3. Remove backups mais antigos que RETENTION_DAYS ───────────────────
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const { blobs } = await list({ prefix: "backups/" });
    const toDelete = blobs.filter(b => {
      // nome: "backups/2026-08-01.json"
      const dateStr = b.pathname.replace("backups/", "").replace(".json", "");
      return new Date(dateStr) < cutoff;
    });

    await Promise.all(toDelete.map(b => del(b.url)));

    const totals = Object.fromEntries(
      Object.entries(snapshot.tables).map(([t, v]) => [t, v.count])
    );

    return NextResponse.json({
      ok: true,
      date: today,
      url,
      totals,
      deleted: toDelete.map(b => b.pathname),
    });
  } catch (err) {
    console.error("[backup-db] Erro:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
