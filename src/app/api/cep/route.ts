export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("cep")?.replace(/\D/g, "");
  if (!cep || cep.length !== 8)
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json({ error: "ViaCEP indisponível" }, { status: 502 });

  const data = await res.json();
  if (data.erro) return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });

  return NextResponse.json({
    street:   data.logradouro ?? "",
    district: data.bairro     ?? "",
    city:     data.localidade ?? "",
    state:    data.uf         ?? "",
  });
}
