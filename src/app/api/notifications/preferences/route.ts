export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DEFAULT_PREFS } from "@/lib/notify-types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pref = await getPrisma().notificationPreference.findUnique({ where: { userId } });
  return NextResponse.json(pref?.prefs ?? DEFAULT_PREFS);
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await getPrisma().notificationPreference.upsert({
    where: { userId },
    create: { userId, prefs: body },
    update: { prefs: body },
  });

  return NextResponse.json({ ok: true });
}
