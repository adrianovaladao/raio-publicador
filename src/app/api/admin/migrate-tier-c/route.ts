export const dynamic = "force-dynamic";
import { currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const TIER_C_VEHICLES = [
  { name: "55 Brasil", domain: "55brasil.com.br", site: "https://55brasil.com.br", location: null, reach: 114796 },
  { name: "Agora Ceará", domain: "agoraceara.com.br", site: "https://www.agoraceara.com.br", location: "Fortaleza", reach: 76443 },
  { name: "Agora Espírito Santo", domain: "agoraespiritosanto.com.br", site: "https://agoraespiritosanto.com.br", location: "Vila Velha", reach: 9903 },
  { name: "Agora Imóveis", domain: "agoraimoveis.com.br", site: "https://agoraimoveis.com.br", location: null, reach: 10000 },
  { name: "Agora Maranhão", domain: "agoramaranhao.com.br", site: "https://agoramaranhao.com.br", location: "Maranhão", reach: 88413 },
  { name: "Agora Mato Grosso do Sul", domain: "agoramatogrossodosul.com.br", site: "https://agoramatogrossodosul.com.br", location: "Mato Grosso do Sul", reach: 38518 },
  { name: "Agora Pernambuco", domain: "agorapernambuco.com.br", site: "https://agorapernambuco.com.br", location: "Pernambuco", reach: 7832 },
  { name: "Assosíndicos - DF", domain: "assosindicosdf.com.br", site: "https://assosindicosdf.com.br", location: "Distrito Federal", reach: 13612 },
  { name: "Comunidade em Pauta", domain: "comunidadeempauta.com.br", site: "https://comunidadeempauta.com.br", location: null, reach: 10200 },
  { name: "Correio do Poder", domain: "correiodopoder.com.br", site: "https://correiodopoder.com.br", location: "Distrito Federal", reach: 170651 },
  { name: "Correio do Síndico", domain: "correiodosindico.com.br", site: "https://correiodosindico.com.br", location: null, reach: 104162 },
  { name: "Dez Minutos", domain: "dezminutos.com.br", site: "https://dezminutos.com.br", location: "Amazonas", reach: 127924 },
  { name: "Empreender Brasília", domain: "empreenderbrasilia.com.br", site: "https://empreenderbrasilia.com.br", location: "Distrito Federal", reach: 86928 },
  { name: "Eu Amo Agronegócio", domain: "euamoagronegocio.com.br", site: "https://euamoagronegocio.com.br", location: null, reach: 100000 },
  { name: "Eu Amo Cidade", domain: "euamocidade.com.br", site: "https://euamocidade.com.br", location: null, reach: 110000 },
  { name: "Eu Amo Concurso", domain: "euamoconcurso.com.br", site: "https://euamoconcurso.com.br", location: null, reach: 15255 },
  { name: "Eu Amo Empreender", domain: "euamoempreender.com.br", site: "https://euamoempreender.com.br", location: null, reach: 79737 },
  { name: "Eu Amo Recanto das Emas", domain: "euamorecantodasemas.com.br", site: "https://euamorecantodasemas.com.br", location: "Distrito Federal", reach: 14479 },
  { name: "Eu Amo Rio Verde", domain: "euamorioverde.com.br", site: "https://euamorioverde.com.br", location: "Rio Verde-GO", reach: 15789 },
  { name: "Eu Amo Santa Maria", domain: "euamosantamaria.com.br", site: "https://euamosantamaria.com.br", location: "Santa Maria-DF", reach: 13736 },
  { name: "Fenacom", domain: "fenacomdf.com.br", site: "https://www.fenacomdf.com.br/", location: "Distrito Federal", reach: 15978 },
  { name: "Folha do Planalto", domain: "folhadoplanalto.com.br", site: "https://folhadoplanalto.com.br", location: "Distrito Federal", reach: 59645 },
  { name: "Goiás 24h", domain: "goias24h.com.br", site: "https://goias24h.com.br", location: "Goiás", reach: 65123 },
  { name: "Isso é Agro", domain: "issoeagro.com.br", site: "https://issoeagro.com.br", location: null, reach: 178090 },
  { name: "Isso é Brasil", domain: "issoebrasil.com.br", site: "https://issoebrasil.com.br", location: "Brasil", reach: 159099 },
  { name: "Isso é Brasília", domain: "issoebrasilia.com.br", site: "https://issoebrasilia.com.br", location: "Distrito Federal", reach: 223225 },
  { name: "Isso é Goiás", domain: "issoegoias.com.br", site: "https://issoegoias.com.br", location: "Goiás", reach: 91090 },
  { name: "Isso é Paraná", domain: "issoeparana.com.br", site: "https://issoeparana.com.br", location: "Paraná", reach: 168950 },
  { name: "Isso é Paraíba", domain: "issoeparaiba.com.br", site: "https://issoeparaiba.com.br", location: "Paraíba", reach: 86152 },
  { name: "Isso é Piauí", domain: "issoepiaui.com.br", site: "https://issoepiaui.com.br", location: "Piauí", reach: 82150 },
  { name: "Isso é Rio de Janeiro", domain: "issoerio.com.br", site: "https://www.issoerio.com.br/", location: "Rio de Janeiro", reach: 86746 },
  { name: "Isso é Santa Catarina", domain: "issoesantacatarina.com.br", site: "https://issoesantacatarina.com.br", location: "Santa Catarina", reach: 62300 },
  { name: "Isso é São Paulo", domain: "issoesaopaulo.com.br", site: "https://issoesaopaulo.com.br", location: "São Paulo", reach: 121510 },
  { name: "Na Hora do Brasil", domain: "nahoradobrasil.com.br", site: "https://nahoradobrasil.com.br", location: "Brasil", reach: 208723 },
  { name: "O Pequizeiro", domain: "opequizeiro.com.br", site: "https://opequizeiro.com.br", location: "Goiás", reach: 10000 },
  { name: "Paranoá em Pauta", domain: "paranoaempauta.com.br", site: "https://paranoaempauta.com.br", location: "Paranoá-DF", reach: 64360 },
  { name: "Pará 24h", domain: "para24h.com.br", site: "https://para24h.com.br", location: "Pará", reach: 12000 },
  { name: "Portal Cidades e Condomínios", domain: "cidadesecondominios.com.br", site: "https://cidadesecondominios.com.br", location: "Brasil", reach: 185985 },
  { name: "Portal do Trabalhador", domain: "portaldotrabalhador.com.br", site: "https://portaldotrabalhador.com.br", location: "Brasil", reach: 117596 },
  { name: "Rádio Inovação", domain: "radioinovacao.com.br", site: "https://radioinovacao.com.br", location: null, reach: 50982 },
  { name: "Setor Produtivo", domain: "setorprodutivo.com.br", site: "https://setorprodutivo.com.br", location: null, reach: 62761 },
  { name: "Tendências e Negócios", domain: "tendenciasenegocios.com.br", site: "https://www.tendenciasenegocios.com.br/", location: null, reach: 141459 },
  { name: "Tribuna de Goiás", domain: "tribunadegoias.com.br", site: "https://tribunadegoias.com.br", location: "Goiás", reach: 138890 },
  { name: "Tribuna do Consumidor", domain: "tribunadoconsumidor.com.br", site: "https://tribunadoconsumidor.com.br", location: null, reach: 58000 },
  { name: "Tribuna do DF", domain: "tribunadodf.com.br", site: "https://tribunadodf.com.br", location: "Brasilia", reach: 63000 },
  { name: "Tribuna do Entorno", domain: "tribunadoentorno.com.br", site: "https://tribunadoentorno.com.br", location: "Brasilia", reach: 207644 },
  { name: "TV Inovação", domain: "tvinovacao.com.br", site: "https://tvinovacao.com.br", location: null, reach: 211654 },
  { name: "Visão de Mulher", domain: "visaodemulher.com.br", site: "https://visaodemulher.com.br", location: null, reach: 15401 },
  { name: "Viva Rio Grande do Norte", domain: "vivariograndedonorte.com.br", site: "https://vivariograndedonorte.com.br", location: "Natal", reach: 26820 },
  { name: "Viva Rondônia", domain: "vivarondonia.com.br", site: "https://vivarondonia.com.br", location: "Porto Velho", reach: 21000 },
  { name: "Viva Roraima", domain: "vivaroraima.com.br", site: "https://vivaroraima.com.br", location: "Boa Vista", reach: 16000 },
  { name: "W3 Notícias", domain: "w3noticias.com.br", site: "https://w3noticias.com.br", location: "Brasilia", reach: 81041 },
];

export async function POST() {
  const user = await currentUser();
  if (user?.publicMetadata?.raioAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();

  const deleted = await prisma.vehicle.deleteMany({ where: { tier: "C" } });

  const created = await prisma.vehicle.createMany({
    data: TIER_C_VEHICLES.map(v => ({
      name:     v.name,
      domain:   v.domain,
      site:     v.site,
      location: v.location,
      category: "Geral",
      tier:     "C",
      reach:    v.reach,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({
    deleted: deleted.count,
    created: created.count,
    message: `Tier C atualizado: ${deleted.count} removidos, ${created.count} criados.`,
  });
}
