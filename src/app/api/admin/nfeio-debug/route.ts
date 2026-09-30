export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

export async function GET() {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey    = process.env.NFEIO_API_KEY ?? "(não definido)";
  const companyId = process.env.NFEIO_COMPANY_ID ?? "(não definido)";

  // Lista empresas cadastradas na conta
  const res = await fetch("https://api.nfe.io/v1/companies", {
    headers: { "Authorization": apiKey },
  });

  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }

  return NextResponse.json({
    NFEIO_API_KEY:    apiKey,
    NFEIO_COMPANY_ID: companyId,
    nfeio_status:     res.status,
    nfeio_response:   data,
  });
}
