export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { isMaster } from "@/lib/admin";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isMaster(user?.publicMetadata as Record<string, unknown>);
}

const VEHICLES = [
  { name: "Isso é Brasil", domain: "issoebrasil.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é Goiás", domain: "issoegoias.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é Brasília", domain: "issoebrasilia.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é Piauí", domain: "issoepiaui.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é São Paulo", domain: "issoesaopaulo.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é Minas Gerais", domain: "issoeminasgerais.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é Rio de Janeiro", domain: "issoeriodejaneiro.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é Paraná", domain: "issoeparana.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Isso é Tocantins", domain: "issoetocantins.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Agora Espírito Santo", domain: "agoraespiritosanto.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Agora Rio Grande do Sul", domain: "agorariograndedosul.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Agora Ceará", domain: "agoradoceara.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Agora Mato Grosso", domain: "agoramatogrosso.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Agora Pernambuco", domain: "agorapernambuco.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Viva Rio Grande do Norte", domain: "vivariograndedonorte.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Viva Brasília", domain: "vivabrasilia.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Viva Roraima", domain: "vivaroraima.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Viva Rondônia", domain: "vivarondonia.com.br", category: "Variedades", tier: "C", reach: 10000 },
  { name: "Portal dos Bombeiros", domain: "portaldosbombeiros.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Portal do Acre", domain: "portaldoacre.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Portal do Trabalhador", domain: "portaldotrabalhador.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Portal Amapá", domain: "portaldoamapa.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Cidades & Condomínios", domain: "cidadesecondominios.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Foco Nacional", domain: "foconacional.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Tribuna do Entorno", domain: "tribunadoentorno.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Correio do Poder", domain: "correiodopoder.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Prefeitos e Governadores", domain: "prefeitosegovernadores.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "W3 Notícias", domain: "w3noticias.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Folha do Planalto", domain: "folhadoplanalto.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Dez Minutos", domain: "dezminutos.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Sergipe de Todos", domain: "sergipedetodos.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Goiânia em Pauta", domain: "goianiaempauta.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Mato Grosso 24h", domain: "matogrosso24h.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Amazonas 24h", domain: "amazonas24h.com.br", category: "Política", tier: "C", reach: 10000 },
  { name: "Na Hora do Brasil", domain: "nahoradobrasil.com.br", category: "Negócios", tier: "C", reach: 10000 },
  { name: "Setor Produtivo", domain: "setorprodutivo.com.br", category: "Negócios", tier: "C", reach: 10000 },
  { name: "Blog do Paulo Melo", domain: "blogdopaulomelo.com.br", category: "Negócios", tier: "C", reach: 10000 },
  { name: "Rádio Inovação", domain: "radioinovacao.com.br", category: "Negócios", tier: "C", reach: 10000 },
  { name: "TV Inovação", domain: "tvinovacao.com.br", category: "Negócios", tier: "C", reach: 10000 },
  { name: "Agro Empreender Brasília", domain: "agroempreenderbrasilia.com.br", category: "Negócios", tier: "C", reach: 10000 },
  { name: "Brasil de PE", domain: "brasildepe.com.br", category: "Negócios", tier: "C", reach: 10000 },
  { name: "BSB News", domain: "bsbnews.com.br", category: "Negócios", tier: "C", reach: 10000 },
];

export async function POST() {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const v of VEHICLES) {
    try {
      await prisma.vehicle.create({ data: v });
      inserted++;
    } catch {
      skipped++;
      errors.push(v.domain);
    }
  }

  return NextResponse.json({ inserted, skipped, skippedDomains: errors });
}
