export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "png";
  try {
    const blob = await put(`logos/${userId}/${Date.now()}.${ext}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[POST /api/upload]", e);
    return NextResponse.json({ error: "Falha no upload. Verifique se o Vercel Blob está configurado (BLOB_READ_WRITE_TOKEN)." }, { status: 500 });
  }
}
