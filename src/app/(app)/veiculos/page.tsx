"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, X } from "lucide-react";

const VEHICLES = [
  { id: "v1", name: "Ge globo", domain: "ge.globo.com", cat: "Geral", uf: "—", tier: "A", reach: 100000000, tokens: 0, color: "#1A1A1A" },
  { id: "v2", name: "G1 globo", domain: "g1.globo.com", cat: "Geral", uf: "—", tier: "A", reach: 70000000, tokens: 0, color: "#1A1A1A" },
  { id: "v3", name: "Terra", domain: "terra.com.br", cat: "Geral", uf: "—", tier: "A", reach: 61000000, tokens: 0, color: "#1A1A1A" },
  { id: "v4", name: "Oglobo globo", domain: "oglobo.globo.com", cat: "Geral", uf: "—", tier: "A", reach: 19000000, tokens: 0, color: "#1A1A1A" },
  { id: "v5", name: "Ig", domain: "ig.com.br", cat: "Geral", uf: "—", tier: "A", reach: 8400000, tokens: 0, color: "#1A1A1A" },
  { id: "v6", name: "Revistakdea360", domain: "revistakdea360.com.br", cat: "Negócios", uf: "—", tier: "D", reach: 5614333, tokens: 0, color: "#946100" },
  { id: "v7", name: "Gazetadopovo", domain: "gazetadopovo.com.br", cat: "Geral", uf: "—", tier: "A", reach: 5500000, tokens: 0, color: "#1A1A1A" },
  { id: "v8", name: "Correiobraziliense", domain: "correiobraziliense.com.br", cat: "Negócios", uf: "—", tier: "A", reach: 5400000, tokens: 0, color: "#1A1A1A" },
  { id: "v9", name: "Band", domain: "band.com.br", cat: "Geral", uf: "—", tier: "A", reach: 5000000, tokens: 0, color: "#1A1A1A" },
  { id: "v10", name: "Valor globo", domain: "valor.globo.com", cat: "Geral", uf: "—", tier: "A", reach: 4200000, tokens: 0, color: "#1A1A1A" },
  { id: "v11", name: "Mixvale", domain: "mixvale.com.br", cat: "Geral", uf: "—", tier: "C", reach: 3700000, tokens: 0, color: "#2F8A5B" },
  { id: "v12", name: "Uai", domain: "uai.com.br", cat: "Geral", uf: "—", tier: "A", reach: 3600000, tokens: 0, color: "#1A1A1A" },
  { id: "v13", name: "Rollingstone", domain: "rollingstone.com.br", cat: "Geral", uf: "—", tier: "B", reach: 2700000, tokens: 0, color: "#2A6FDB" },
  { id: "v14", name: "Odia ig", domain: "odia.ig.com.br", cat: "Geral", uf: "—", tier: "A", reach: 2500000, tokens: 0, color: "#1A1A1A" },
  { id: "v15", name: "Em", domain: "em.com.br", cat: "Geral", uf: "—", tier: "A", reach: 2400000, tokens: 0, color: "#1A1A1A" },
  { id: "v16", name: "Brasil247", domain: "brasil247.com", cat: "Geral", uf: "—", tier: "A", reach: 1700000, tokens: 0, color: "#1A1A1A" },
  { id: "v17", name: "Egobrazil", domain: "egobrazil.com.br", cat: "Geral", uf: "—", tier: "A", reach: 1254000, tokens: 0, color: "#1A1A1A" },
  { id: "v18", name: "Recreio", domain: "recreio.com.br", cat: "Geral", uf: "—", tier: "C", reach: 1200000, tokens: 0, color: "#2F8A5B" },
  { id: "v19", name: "Folhavitoria", domain: "folhavitoria.com.br", cat: "Geral", uf: "—", tier: "B", reach: 1000000, tokens: 0, color: "#2A6FDB" },
  { id: "v20", name: "Futebolinterior", domain: "futebolinterior.com.br", cat: "Esportes", uf: "—", tier: "B", reach: 956000, tokens: 0, color: "#2A6FDB" },
  { id: "v21", name: "Gizmodo uol", domain: "gizmodo.uol.com.br", cat: "Geral", uf: "—", tier: "A", reach: 900000, tokens: 0, color: "#1A1A1A" },
  { id: "v22", name: "Diariodocentrodomundo", domain: "diariodocentrodomundo.com.br", cat: "Geral", uf: "—", tier: "A", reach: 835000, tokens: 0, color: "#1A1A1A" },
  { id: "v23", name: "Tribunapr", domain: "tribunapr.com.br", cat: "Geral", uf: "—", tier: "B", reach: 834000, tokens: 0, color: "#2A6FDB" },
  { id: "v24", name: "Midiamax", domain: "midiamax.com.br", cat: "Geral", uf: "—", tier: "B", reach: 800000, tokens: 0, color: "#2A6FDB" },
  { id: "v25", name: "Folhape", domain: "folhape.com.br", cat: "Geral", uf: "—", tier: "B", reach: 722000, tokens: 0, color: "#2A6FDB" },
  { id: "v26", name: "Globorural globo", domain: "globorural.globo.com", cat: "Geral", uf: "—", tier: "A", reach: 696100, tokens: 0, color: "#1A1A1A" },
  { id: "v27", name: "Sportbuzz", domain: "sportbuzz.com.br", cat: "Esportes", uf: "—", tier: "C", reach: 597500, tokens: 0, color: "#2F8A5B" },
  { id: "v28", name: "Jornaldebrasilia", domain: "jornaldebrasilia.com.br", cat: "Geral", uf: "—", tier: "B", reach: 578000, tokens: 0, color: "#2A6FDB" },
  { id: "v29", name: "Gazetaweb", domain: "gazetaweb.com", cat: "Geral", uf: "—", tier: "B", reach: 536000, tokens: 0, color: "#2A6FDB" },
  { id: "v30", name: "Observatoriodosfamosos", domain: "observatoriodosfamosos.com.br", cat: "Geral", uf: "—", tier: "D", reach: 504200, tokens: 0, color: "#946100" },
  { id: "v31", name: "Bahianoticias", domain: "bahianoticias.com.br", cat: "Geral", uf: "—", tier: "A", reach: 463000, tokens: 0, color: "#1A1A1A" },
  { id: "v32", name: "Spacemoney", domain: "spacemoney.com.br", cat: "Geral", uf: "—", tier: "C", reach: 436000, tokens: 0, color: "#2F8A5B" },
  { id: "v33", name: "Istoe", domain: "istoe.com.br", cat: "Geral", uf: "—", tier: "A", reach: 412200, tokens: 0, color: "#1A1A1A" },
  { id: "v34", name: "Todaynews", domain: "todaynews.com.br", cat: "Geral", uf: "—", tier: "C", reach: 335043, tokens: 0, color: "#2F8A5B" },
  { id: "v35", name: "Cidadeverde", domain: "cidadeverde.com", cat: "Geral", uf: "—", tier: "B", reach: 333000, tokens: 0, color: "#2A6FDB" },
  { id: "v36", name: "Folhadecuritiba", domain: "folhadecuritiba.com.br", cat: "Geral", uf: "—", tier: "D", reach: 331100, tokens: 0, color: "#946100" },
  { id: "v37", name: "Lorena ig", domain: "lorena.ig.com.br", cat: "Geral", uf: "—", tier: "A", reach: 309000, tokens: 0, color: "#1A1A1A" },
  { id: "v38", name: "D24am", domain: "d24am.com", cat: "Geral", uf: "—", tier: "B", reach: 287100, tokens: 0, color: "#2A6FDB" },
  { id: "v39", name: "Torcedores", domain: "torcedores.com", cat: "Esportes", uf: "—", tier: "A", reach: 275000, tokens: 0, color: "#1A1A1A" },
  { id: "v40", name: "Imprensaemidia", domain: "imprensaemidia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 250000, tokens: 0, color: "#946100" },
  { id: "v41", name: "Fnonline uol", domain: "fnonline.uol.com.br", cat: "Geral", uf: "—", tier: "A", reach: 238600, tokens: 0, color: "#1A1A1A" },
  { id: "v42", name: "Entrete1", domain: "entrete1.com.br", cat: "Geral", uf: "—", tier: "A", reach: 222722, tokens: 0, color: "#1A1A1A" },
  { id: "v43", name: "Observatoriodatv", domain: "observatoriodatv.com.br", cat: "Geral", uf: "—", tier: "C", reach: 219000, tokens: 0, color: "#2F8A5B" },
  { id: "v44", name: "Revistapegn globo", domain: "revistapegn.globo.com", cat: "Geral", uf: "—", tier: "A", reach: 217000, tokens: 0, color: "#1A1A1A" },
  { id: "v45", name: "Assiscity", domain: "assiscity.com", cat: "Geral", uf: "—", tier: "D", reach: 187500, tokens: 0, color: "#946100" },
  { id: "v46", name: "Contigo", domain: "contigo.com.br", cat: "Geral", uf: "—", tier: "C", reach: 184700, tokens: 0, color: "#2F8A5B" },
  { id: "v47", name: "Revistaanamaria", domain: "revistaanamaria.com.br", cat: "Geral", uf: "—", tier: "C", reach: 175300, tokens: 0, color: "#2F8A5B" },
  { id: "v48", name: "Bemparana", domain: "bemparana.com.br", cat: "Geral", uf: "—", tier: "A", reach: 162000, tokens: 0, color: "#1A1A1A" },
  { id: "v49", name: "Dropsdejogos Uai", domain: "dropsdejogos.uai.com.br", cat: "Geral", uf: "—", tier: "B", reach: 161100, tokens: 0, color: "#2A6FDB" },
  { id: "v50", name: "Arrobanews", domain: "arrobanews.com.br", cat: "Geral", uf: "—", tier: "B", reach: 150003, tokens: 0, color: "#2A6FDB" },
  { id: "v51", name: "Jb", domain: "jb.com.br", cat: "Geral", uf: "—", tier: "B", reach: 137900, tokens: 0, color: "#2A6FDB" },
  { id: "v52", name: "Tvprime correiobraziliense", domain: "tvprime.correiobraziliense.com.br", cat: "Geral", uf: "—", tier: "A", reach: 123400, tokens: 0, color: "#1A1A1A" },
  { id: "v53", name: "Tudofeed", domain: "tudofeed.com.br", cat: "Geral", uf: "—", tier: "A", reach: 122502, tokens: 0, color: "#1A1A1A" },
  { id: "v54", name: "Glamurama", domain: "glamurama.com.br", cat: "Geral", uf: "—", tier: "C", reach: 120000, tokens: 0, color: "#2F8A5B" },
  { id: "v55", name: "Acritica", domain: "acritica.com", cat: "Geral", uf: "—", tier: "B", reach: 119700, tokens: 0, color: "#2A6FDB" },
  { id: "v56", name: "Cinebuzz", domain: "cinebuzz.com.br", cat: "Geral", uf: "—", tier: "C", reach: 112200, tokens: 0, color: "#2F8A5B" },
  { id: "v57", name: "Brasil perfil", domain: "brasil.perfil.com", cat: "Geral", uf: "—", tier: "A", reach: 106400, tokens: 0, color: "#1A1A1A" },
  { id: "v58", name: "Omunicipio", domain: "omunicipio.com.br", cat: "Geral", uf: "—", tier: "C", reach: 102600, tokens: 0, color: "#2F8A5B" },
  { id: "v59", name: "Bonde", domain: "bonde.com.br", cat: "Geral", uf: "—", tier: "B", reach: 102000, tokens: 0, color: "#2A6FDB" },
  { id: "v60", name: "Dm", domain: "dm.com.br", cat: "Geral", uf: "—", tier: "B", reach: 97900, tokens: 0, color: "#2A6FDB" },
  { id: "v61", name: "Confinetnoticias", domain: "confinetnoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 93000, tokens: 0, color: "#2F8A5B" },
  { id: "v62", name: "Giroemipiau1", domain: "giroemipiau1.com.br", cat: "Geral", uf: "—", tier: "C", reach: 92400, tokens: 0, color: "#2F8A5B" },
  { id: "v63", name: "Cosmopolitam", domain: "cosmopolitam.com.br", cat: "Entretenimento", uf: "—", tier: "A", reach: 84000, tokens: 0, color: "#1A1A1A" },
  { id: "v64", name: "Diariodoaco", domain: "diariodoaco.com.br", cat: "Geral", uf: "—", tier: "C", reach: 82900, tokens: 0, color: "#2F8A5B" },
  { id: "v65", name: "Paracatunews", domain: "paracatunews.com.br", cat: "Geral", uf: "—", tier: "D", reach: 80000, tokens: 0, color: "#946100" },
  { id: "v66", name: "Rd1", domain: "rd1.com.br", cat: "Entretenimento", uf: "—", tier: "B", reach: 71000, tokens: 0, color: "#2A6FDB" },
  { id: "v67", name: "Oobservador", domain: "oobservador.com", cat: "Geral", uf: "—", tier: "D", reach: 66200, tokens: 0, color: "#946100" },
  { id: "v68", name: "Portalcorreio", domain: "portalcorreio.com.br", cat: "Geral", uf: "—", tier: "B", reach: 63000, tokens: 0, color: "#2A6FDB" },
  { id: "v69", name: "Folhadelondrina", domain: "folhadelondrina.com.br", cat: "Geral", uf: "—", tier: "B", reach: 60000, tokens: 0, color: "#2A6FDB" },
  { id: "v70", name: "Seucreditodigital", domain: "seucreditodigital.com.br", cat: "Geral", uf: "—", tier: "C", reach: 60000, tokens: 0, color: "#2F8A5B" },
  { id: "v71", name: "Noticiasdotimao", domain: "noticiasdotimao.com.br", cat: "Geral", uf: "—", tier: "D", reach: 59400, tokens: 0, color: "#946100" },
  { id: "v72", name: "Oimparcial", domain: "oimparcial.com.br", cat: "Geral", uf: "—", tier: "B", reach: 59000, tokens: 0, color: "#2A6FDB" },
  { id: "v73", name: "Portogente", domain: "portogente.com.br", cat: "Geral", uf: "—", tier: "C", reach: 59000, tokens: 0, color: "#2F8A5B" },
  { id: "v74", name: "Ppnewsfb", domain: "ppnewsfb.com.br", cat: "Geral", uf: "—", tier: "D", reach: 56000, tokens: 0, color: "#946100" },
  { id: "v75", name: "Toledonews", domain: "toledonews.com.br", cat: "Geral", uf: "—", tier: "D", reach: 55400, tokens: 0, color: "#946100" },
  { id: "v76", name: "Surgiu", domain: "surgiu.com.br", cat: "Geral", uf: "—", tier: "C", reach: 54000, tokens: 0, color: "#2F8A5B" },
  { id: "v77", name: "Via41", domain: "via41.com.br", cat: "Geral", uf: "—", tier: "D", reach: 53800, tokens: 0, color: "#946100" },
  { id: "v78", name: "Inmagazine ig", domain: "inmagazine.ig.com.br", cat: "Entretenimento", uf: "—", tier: "B", reach: 53000, tokens: 0, color: "#2A6FDB" },
  { id: "v79", name: "Tonafolha", domain: "tonafolha.com.br", cat: "Geral", uf: "—", tier: "A", reach: 50444, tokens: 0, color: "#1A1A1A" },
  { id: "v80", name: "Tvcampinas", domain: "tvcampinas.com.br", cat: "Geral", uf: "—", tier: "A", reach: 50432, tokens: 0, color: "#1A1A1A" },
  { id: "v81", name: "Portalpaporeto", domain: "portalpaporeto.com.br", cat: "Geral", uf: "—", tier: "A", reach: 50342, tokens: 0, color: "#1A1A1A" },
  { id: "v82", name: "Onepop", domain: "onepop.com.br", cat: "Geral", uf: "—", tier: "A", reach: 50222, tokens: 0, color: "#1A1A1A" },
  { id: "v83", name: "Meon", domain: "meon.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50000, tokens: 0, color: "#2F8A5B" },
  { id: "v84", name: "Omunicipioblumenau", domain: "omunicipioblumenau.com.br", cat: "Geral", uf: "—", tier: "C", reach: 47800, tokens: 0, color: "#2F8A5B" },
  { id: "v85", name: "Jornalcontabil ig", domain: "jornalcontabil.ig.com.br", cat: "Geral", uf: "—", tier: "B", reach: 46000, tokens: 0, color: "#2A6FDB" },
  { id: "v86", name: "Observatoriog", domain: "observatoriog.com.br", cat: "Geral", uf: "—", tier: "C", reach: 45500, tokens: 0, color: "#2F8A5B" },
  { id: "v87", name: "Extraderondonia", domain: "extraderondonia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 39900, tokens: 0, color: "#946100" },
  { id: "v88", name: "Obuxixo", domain: "obuxixo.com.br", cat: "Geral", uf: "—", tier: "A", reach: 39339, tokens: 0, color: "#1A1A1A" },
  { id: "v89", name: "Ubatanoticias", domain: "ubatanoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 37300, tokens: 0, color: "#946100" },
  { id: "v90", name: "Correiodolago", domain: "correiodolago.com.br", cat: "Geral", uf: "—", tier: "C", reach: 36400, tokens: 0, color: "#2F8A5B" },
  { id: "v91", name: "Revistacolorada", domain: "revistacolorada.com.br", cat: "Geral", uf: "—", tier: "C", reach: 36400, tokens: 0, color: "#2F8A5B" },
  { id: "v92", name: "Maispb", domain: "maispb.com.br", cat: "Geral", uf: "—", tier: "C", reach: 34700, tokens: 0, color: "#2F8A5B" },
  { id: "v93", name: "Portalpalotina", domain: "portalpalotina.com.br", cat: "Geral", uf: "—", tier: "D", reach: 33800, tokens: 0, color: "#946100" },
  { id: "v94", name: "Ubiratãonline", domain: "ubiratãonline.com.br", cat: "Geral", uf: "—", tier: "D", reach: 33700, tokens: 0, color: "#946100" },
  { id: "v95", name: "Timmax", domain: "timmax.com.br", cat: "Geral", uf: "—", tier: "B", reach: 33503, tokens: 0, color: "#2A6FDB" },
  { id: "v96", name: "Valabah", domain: "valabah.com.br", cat: "Geral", uf: "—", tier: "B", reach: 33322, tokens: 0, color: "#2A6FDB" },
  { id: "v97", name: "Comando190", domain: "comando190.com.br", cat: "Geral", uf: "—", tier: "D", reach: 32200, tokens: 0, color: "#946100" },
  { id: "v98", name: "Jornaldebeltrao", domain: "jornaldebeltrao.com.br", cat: "Geral", uf: "—", tier: "C", reach: 30400, tokens: 0, color: "#2F8A5B" },
  { id: "v99", name: "Tudorondonia", domain: "tudorondonia.com", cat: "Geral", uf: "—", tier: "C", reach: 30200, tokens: 0, color: "#2F8A5B" },
  { id: "v100", name: "Blogdomarcosilva", domain: "blogdomarcosilva.com.br", cat: "Geral", uf: "—", tier: "C", reach: 30000, tokens: 0, color: "#2F8A5B" },
  { id: "v101", name: "Guiafloripa", domain: "guiafloripa.com.br", cat: "Geral", uf: "—", tier: "C", reach: 30000, tokens: 0, color: "#2F8A5B" },
  { id: "v102", name: "Portalcripto", domain: "portalcripto.com.br", cat: "Economia", uf: "—", tier: "C", reach: 30000, tokens: 0, color: "#2F8A5B" },
  { id: "v103", name: "Cbzoo", domain: "cbzoo.com.br", cat: "Geral", uf: "—", tier: "C", reach: 29500, tokens: 0, color: "#2F8A5B" },
  { id: "v104", name: "Jornalrazao", domain: "jornalrazao.com", cat: "Geral", uf: "—", tier: "D", reach: 29500, tokens: 0, color: "#946100" },
  { id: "v105", name: "Guiamedianeira", domain: "guiamedianeira.com.br", cat: "Geral", uf: "—", tier: "D", reach: 28700, tokens: 0, color: "#946100" },
  { id: "v106", name: "Folhapatoense", domain: "folhapatoense.com", cat: "Geral", uf: "—", tier: "D", reach: 28400, tokens: 0, color: "#946100" },
  { id: "v107", name: "Caisdosertao", domain: "caisdosertao.com.br", cat: "Geral", uf: "—", tier: "D", reach: 27500, tokens: 0, color: "#946100" },
  { id: "v108", name: "Jornaldobras", domain: "jornaldobras.com.br", cat: "Geral", uf: "—", tier: "D", reach: 27000, tokens: 0, color: "#946100" },
  { id: "v109", name: "Amazonasatual", domain: "amazonasatual.com.br", cat: "Geral", uf: "—", tier: "B", reach: 26000, tokens: 0, color: "#2A6FDB" },
  { id: "v110", name: "Lavras24horas", domain: "lavras24horas.com.br", cat: "Geral", uf: "—", tier: "D", reach: 25700, tokens: 0, color: "#946100" },
  { id: "v111", name: "Sbemrevista", domain: "sbemrevista.com.br", cat: "Geral", uf: "—", tier: "D", reach: 25200, tokens: 0, color: "#946100" },
  { id: "v112", name: "Folhadovale", domain: "folhadovale.net", cat: "Geral", uf: "—", tier: "D", reach: 25200, tokens: 0, color: "#946100" },
  { id: "v113", name: "Diariodonegocio", domain: "diariodonegocio.com.br", cat: "Geral", uf: "—", tier: "B", reach: 23451, tokens: 0, color: "#2A6FDB" },
  { id: "v114", name: "Conectadocomvoce", domain: "conectadocomvoce.com.br", cat: "Geral", uf: "—", tier: "B", reach: 22502, tokens: 0, color: "#2A6FDB" },
  { id: "v115", name: "Reporternaressi", domain: "reporternaressi.com.br", cat: "Geral", uf: "—", tier: "D", reach: 22400, tokens: 0, color: "#946100" },
  { id: "v116", name: "Primeirahora", domain: "primeirahora.com.br", cat: "Geral", uf: "—", tier: "C", reach: 22000, tokens: 0, color: "#2F8A5B" },
  { id: "v117", name: "Revistadetetive", domain: "revistadetetive.com.br", cat: "Geral", uf: "—", tier: "E", reach: 22000, tokens: 0, color: "#C2452E" },
  { id: "v118", name: "Portalaz", domain: "portalaz.com.br", cat: "Geral", uf: "—", tier: "C", reach: 21800, tokens: 0, color: "#2F8A5B" },
  { id: "v119", name: "Cacodarosa", domain: "cacodarosa.com", cat: "Geral", uf: "—", tier: "D", reach: 21800, tokens: 0, color: "#946100" },
  { id: "v120", name: "Qgdanoticia", domain: "qgdanoticia.com.br", cat: "Geral", uf: "—", tier: "B", reach: 21501, tokens: 0, color: "#2A6FDB" },
  { id: "v121", name: "Pontaporainforma", domain: "pontaporainforma.com.br", cat: "Geral", uf: "—", tier: "C", reach: 20600, tokens: 0, color: "#2F8A5B" },
  { id: "v122", name: "Douradosagora", domain: "douradosagora.com.br", cat: "Geral", uf: "—", tier: "C", reach: 20300, tokens: 0, color: "#2F8A5B" },
  { id: "v123", name: "Senhoresporte", domain: "senhoresporte.com", cat: "Geral", uf: "—", tier: "C", reach: 20000, tokens: 0, color: "#2F8A5B" },
  { id: "v124", name: "Celebs", domain: "celebs.com.br", cat: "Entretenimento", uf: "—", tier: "E", reach: 19500, tokens: 0, color: "#C2452E" },
  { id: "v125", name: "Ne9", domain: "ne9.com.br", cat: "Geral", uf: "—", tier: "D", reach: 19300, tokens: 0, color: "#946100" },
  { id: "v126", name: "Revistamaxima", domain: "revistamaxima.com.br", cat: "Geral", uf: "—", tier: "C", reach: 19200, tokens: 0, color: "#2F8A5B" },
  { id: "v127", name: "Tribunadointerior", domain: "tribunadointerior.com.br", cat: "Geral", uf: "—", tier: "C", reach: 18600, tokens: 0, color: "#2F8A5B" },
  { id: "v128", name: "Portalr3", domain: "portalr3.com.br", cat: "Geral", uf: "—", tier: "C", reach: 18400, tokens: 0, color: "#2F8A5B" },
  { id: "v129", name: "G37", domain: "g37.com.br", cat: "Geral", uf: "—", tier: "D", reach: 18400, tokens: 0, color: "#946100" },
  { id: "v130", name: "Baguete", domain: "baguete.com.br", cat: "Tecnologia", uf: "—", tier: "B", reach: 17800, tokens: 0, color: "#2A6FDB" },
  { id: "v131", name: "Anoticiamais", domain: "anoticiamais.com.br", cat: "Geral", uf: "—", tier: "D", reach: 17700, tokens: 0, color: "#946100" },
  { id: "v132", name: "Propagandashistoricas", domain: "propagandashistoricas.com.br", cat: "Geral", uf: "—", tier: "C", reach: 17300, tokens: 0, color: "#2F8A5B" },
  { id: "v133", name: "Leianoticias", domain: "leianoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 17300, tokens: 0, color: "#2F8A5B" },
  { id: "v134", name: "Rcwtv", domain: "rcwtv.com.br", cat: "Geral", uf: "—", tier: "D", reach: 17000, tokens: 0, color: "#946100" },
  { id: "v135", name: "Gazetadetaubate", domain: "gazetadetaubate.com.br", cat: "Geral", uf: "—", tier: "D", reach: 16200, tokens: 0, color: "#946100" },
  { id: "v136", name: "Saojoaquimonline", domain: "saojoaquimonline.com.br", cat: "Geral", uf: "—", tier: "C", reach: 15500, tokens: 0, color: "#2F8A5B" },
  { id: "v137", name: "Portalcruzeirense", domain: "portalcruzeirense.com.br", cat: "Geral", uf: "—", tier: "D", reach: 15500, tokens: 0, color: "#946100" },
  { id: "v138", name: "Bonsfluidos", domain: "bonsfluidos.com.br", cat: "Geral", uf: "—", tier: "C", reach: 15200, tokens: 0, color: "#2F8A5B" },
  { id: "v139", name: "Giro matanorte", domain: "giro.matanorte.com", cat: "Geral", uf: "—", tier: "D", reach: 15000, tokens: 0, color: "#946100" },
  { id: "v140", name: "Sobralonline", domain: "sobralonline.com.br", cat: "Geral", uf: "—", tier: "D", reach: 14800, tokens: 0, color: "#946100" },
  { id: "v141", name: "Gmaisnoticias", domain: "gmaisnoticias.com", cat: "Geral", uf: "—", tier: "D", reach: 13500, tokens: 0, color: "#946100" },
  { id: "v142", name: "Mogiguacuacontece", domain: "mogiguacuacontece.com.br", cat: "Geral", uf: "—", tier: "D", reach: 13300, tokens: 0, color: "#946100" },
  { id: "v143", name: "Cartaodevisita r7", domain: "cartaodevisita.r7.com", cat: "Geral", uf: "—", tier: "B", reach: 13000, tokens: 0, color: "#2A6FDB" },
  { id: "v144", name: "Saoroquenoticias", domain: "saoroquenoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 12500, tokens: 0, color: "#946100" },
  { id: "v145", name: "Omunicipiojoinville", domain: "omunicipiojoinville.com", cat: "Geral", uf: "—", tier: "D", reach: 12300, tokens: 0, color: "#946100" },
  { id: "v146", name: "Gazetadoagreste", domain: "gazetadoagreste.com.br", cat: "Geral", uf: "—", tier: "D", reach: 11900, tokens: 0, color: "#946100" },
  { id: "v147", name: "Pragmatismopolitico", domain: "pragmatismopolitico.com.br", cat: "Geral", uf: "—", tier: "A", reach: 11700, tokens: 0, color: "#1A1A1A" },
  { id: "v148", name: "Correionoticia", domain: "correionoticia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10800, tokens: 0, color: "#946100" },
  { id: "v149", name: "Correionoticia", domain: "correionoticia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10800, tokens: 0, color: "#946100" },
  { id: "v150", name: "Meganesia", domain: "meganesia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10644, tokens: 0, color: "#946100" },
  { id: "v151", name: "Cucadecrente", domain: "cucadecrente.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10500, tokens: 0, color: "#946100" },
  { id: "v152", name: "Observatoriodegames", domain: "observatoriodegames.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10400, tokens: 0, color: "#946100" },
  { id: "v153", name: "Riachaonet", domain: "riachaonet.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10100, tokens: 0, color: "#946100" },
  { id: "v154", name: "Piauihoje", domain: "piauihoje.com", cat: "Geral", uf: "—", tier: "C", reach: 10000, tokens: 0, color: "#2F8A5B" },
  { id: "v155", name: "Revista tec", domain: "revista.tec.br", cat: "Geral", uf: "—", tier: "C", reach: 10000, tokens: 0, color: "#2F8A5B" },
  { id: "v156", name: "Gazetadasemana", domain: "gazetadasemana.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10000, tokens: 0, color: "#946100" },
  { id: "v157", name: "Radiosampaio", domain: "radiosampaio.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10000, tokens: 0, color: "#946100" },
  { id: "v158", name: "Itamarajunoticias", domain: "itamarajunoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10000, tokens: 0, color: "#946100" },
  { id: "v159", name: "Gazetadevotorantim", domain: "gazetadevotorantim.com.br", cat: "Geral", uf: "—", tier: "D", reach: 9800, tokens: 0, color: "#946100" },
  { id: "v160", name: "Fatosdesconhecidos", domain: "fatosdesconhecidos.com.br", cat: "Geral", uf: "—", tier: "B", reach: 9700, tokens: 0, color: "#2A6FDB" },
  { id: "v161", name: "Rolnews", domain: "rolnews.com.br", cat: "Geral", uf: "—", tier: "D", reach: 9400, tokens: 0, color: "#946100" },
  { id: "v162", name: "Pordentrodeminas", domain: "pordentrodeminas.com.br", cat: "Geral", uf: "—", tier: "D", reach: 8900, tokens: 0, color: "#946100" },
  { id: "v163", name: "Montesclaros", domain: "montesclaros.com", cat: "Geral", uf: "—", tier: "C", reach: 8500, tokens: 0, color: "#2F8A5B" },
  { id: "v164", name: "Olivre", domain: "olivre.com.br", cat: "Geral", uf: "—", tier: "C", reach: 8200, tokens: 0, color: "#2F8A5B" },
  { id: "v165", name: "Rondoniadinamica", domain: "rondoniadinamica.com", cat: "Geral", uf: "—", tier: "C", reach: 8100, tokens: 0, color: "#2F8A5B" },
  { id: "v166", name: "Alexferraz", domain: "alexferraz.com.br", cat: "Geral", uf: "—", tier: "D", reach: 8000, tokens: 0, color: "#946100" },
  { id: "v167", name: "Obaianao", domain: "obaianao.com.br", cat: "Geral", uf: "—", tier: "D", reach: 7934, tokens: 0, color: "#946100" },
  { id: "v168", name: "Letage", domain: "letage.com.br", cat: "Geral", uf: "—", tier: "D", reach: 7800, tokens: 0, color: "#946100" },
  { id: "v169", name: "Sitebarra", domain: "sitebarra.com.br", cat: "Geral", uf: "—", tier: "D", reach: 7700, tokens: 0, color: "#946100" },
  { id: "v170", name: "Revistafatorbrasil", domain: "revistafatorbrasil.com.br", cat: "Geral", uf: "—", tier: "C", reach: 7600, tokens: 0, color: "#2F8A5B" },
  { id: "v171", name: "Vitoriadaconquistanoticias", domain: "vitoriadaconquistanoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 7600, tokens: 0, color: "#946100" },
  { id: "v172", name: "Epopnaweb", domain: "epopnaweb.com.br", cat: "Geral", uf: "—", tier: "D", reach: 7500, tokens: 0, color: "#946100" },
  { id: "v173", name: "Newsrondonia", domain: "newsrondonia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 7400, tokens: 0, color: "#2F8A5B" },
  { id: "v174", name: "Mercadohoje Uai", domain: "mercadohoje.uai.com.br", cat: "Geral", uf: "—", tier: "A", reach: 7300, tokens: 0, color: "#1A1A1A" },
  { id: "v175", name: "Atualizabahia", domain: "atualizabahia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 7100, tokens: 0, color: "#946100" },
  { id: "v176", name: "Colunaboraviajar", domain: "colunaboraviajar.com.br", cat: "Geral", uf: "—", tier: "E", reach: 7000, tokens: 0, color: "#C2452E" },
  { id: "v177", name: "Manausonline", domain: "manausonline.com", cat: "Geral", uf: "—", tier: "D", reach: 6900, tokens: 0, color: "#946100" },
  { id: "v178", name: "Tvconcordia", domain: "tvconcordia.com.br", cat: "Geral", uf: "—", tier: "E", reach: 6900, tokens: 0, color: "#C2452E" },
  { id: "v179", name: "Revistacentral", domain: "revistacentral.com.br", cat: "Geral", uf: "—", tier: "C", reach: 6500, tokens: 0, color: "#2F8A5B" },
  { id: "v180", name: "Criativaonline", domain: "criativaonline.com.br", cat: "Geral", uf: "—", tier: "C", reach: 6400, tokens: 0, color: "#2F8A5B" },
  { id: "v181", name: "Jornalocapixaba", domain: "jornalocapixaba.com.br", cat: "Geral", uf: "—", tier: "D", reach: 6400, tokens: 0, color: "#946100" },
  { id: "v182", name: "Es1", domain: "es1.com.br", cat: "Geral", uf: "—", tier: "D", reach: 6000, tokens: 0, color: "#946100" },
  { id: "v183", name: "Jornaldocorpo", domain: "jornaldocorpo.com.br", cat: "Saúde", uf: "—", tier: "E", reach: 6000, tokens: 0, color: "#C2452E" },
  { id: "v184", name: "Portaldopalmeirense", domain: "portaldopalmeirense.com.br", cat: "Geral", uf: "—", tier: "D", reach: 5900, tokens: 0, color: "#946100" },
  { id: "v185", name: "Planetafolha", domain: "planetafolha.com.br", cat: "Geral", uf: "—", tier: "D", reach: 5900, tokens: 0, color: "#946100" },
  { id: "v186", name: "Tosabendomais", domain: "tosabendomais.com.br", cat: "Geral", uf: "—", tier: "E", reach: 5700, tokens: 0, color: "#C2452E" },
  { id: "v187", name: "Tonafama ig", domain: "tonafama.ig.com.br", cat: "Geral", uf: "—", tier: "A", reach: 5600, tokens: 0, color: "#1A1A1A" },
  { id: "v188", name: "Petrolandianoticias", domain: "petrolandianoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 5600, tokens: 0, color: "#946100" },
  { id: "v189", name: "Mfpdigital", domain: "mfpdigital.com.br", cat: "Geral", uf: "—", tier: "B", reach: 5400, tokens: 0, color: "#2A6FDB" },
  { id: "v190", name: "Folhadevilhena", domain: "folhadevilhena.com.br", cat: "Geral", uf: "—", tier: "D", reach: 5400, tokens: 0, color: "#946100" },
  { id: "v191", name: "Diariodeprofissoes", domain: "diariodeprofissoes.com.br", cat: "Geral", uf: "—", tier: "D", reach: 5200, tokens: 0, color: "#946100" },
  { id: "v192", name: "Tribunadecianorte", domain: "tribunadecianorte.com.br", cat: "Geral", uf: "—", tier: "D", reach: 5100, tokens: 0, color: "#946100" },
  { id: "v193", name: "Didigalvao", domain: "didigalvao.com.br", cat: "Geral", uf: "—", tier: "C", reach: 5000, tokens: 0, color: "#2F8A5B" },
  { id: "v194", name: "Tribunadomoxoto", domain: "tribunadomoxoto.com", cat: "Geral", uf: "—", tier: "D", reach: 5000, tokens: 0, color: "#946100" },
  { id: "v195", name: "Cellebriway", domain: "cellebriway.com.br", cat: "Entretenimento", uf: "—", tier: "E", reach: 5000, tokens: 0, color: "#C2452E" },
  { id: "v196", name: "Amambainoticias", domain: "amambainoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 4800, tokens: 0, color: "#2F8A5B" },
  { id: "v197", name: "Oitomeia", domain: "oitomeia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 4600, tokens: 0, color: "#2F8A5B" },
  { id: "v198", name: "Networkflow", domain: "networkflow.com.br", cat: "Geral", uf: "—", tier: "D", reach: 4587, tokens: 0, color: "#946100" },
  { id: "v199", name: "Todosegundo", domain: "todosegundo.com.br", cat: "Geral", uf: "—", tier: "D", reach: 4527, tokens: 0, color: "#946100" },
  { id: "v200", name: "Oqueassistir", domain: "oqueassistir.com.br", cat: "Geral", uf: "—", tier: "D", reach: 4300, tokens: 0, color: "#946100" },
  { id: "v201", name: "Portalmidia", domain: "portalmidia.net", cat: "Geral", uf: "—", tier: "D", reach: 4000, tokens: 0, color: "#946100" },
  { id: "v202", name: "Materialivre", domain: "materialivre.com", cat: "Geral", uf: "—", tier: "E", reach: 4000, tokens: 0, color: "#C2452E" },
  { id: "v203", name: "Portaldocolorado", domain: "portaldocolorado.com.br", cat: "Geral", uf: "—", tier: "C", reach: 3900, tokens: 0, color: "#2F8A5B" },
  { id: "v204", name: "Portaldecamaqua", domain: "portaldecamaqua.com.br", cat: "Geral", uf: "—", tier: "D", reach: 3900, tokens: 0, color: "#946100" },
  { id: "v205", name: "Agencianyx", domain: "agencianyx.com.br", cat: "Geral", uf: "—", tier: "C", reach: 3400, tokens: 0, color: "#2F8A5B" },
  { id: "v206", name: "Bzcapital", domain: "bzcapital.com.br", cat: "Geral", uf: "—", tier: "D", reach: 3400, tokens: 0, color: "#946100" },
  { id: "v207", name: "Brasilagoraonline", domain: "brasilagoraonline.com.br", cat: "Geral", uf: "—", tier: "D", reach: 3400, tokens: 0, color: "#946100" },
  { id: "v208", name: "Portaldosaopaulino", domain: "portaldosaopaulino.com.br", cat: "Geral", uf: "—", tier: "D", reach: 3300, tokens: 0, color: "#946100" },
  { id: "v209", name: "Nativanews", domain: "nativanews.com.br", cat: "Geral", uf: "—", tier: "D", reach: 3300, tokens: 0, color: "#946100" },
  { id: "v210", name: "Fleety", domain: "fleety.com.br", cat: "Geral", uf: "—", tier: "C", reach: 3200, tokens: 0, color: "#2F8A5B" },
  { id: "v211", name: "Manequim", domain: "manequim.com.br", cat: "Geral", uf: "—", tier: "C", reach: 3200, tokens: 0, color: "#2F8A5B" },
  { id: "v212", name: "Ciberlex", domain: "ciberlex.adv.br", cat: "Geral", uf: "—", tier: "D", reach: 3200, tokens: 0, color: "#946100" },
  { id: "v213", name: "Contatados", domain: "contatados.com.br", cat: "Geral", uf: "—", tier: "D", reach: 3100, tokens: 0, color: "#946100" },
  { id: "v214", name: "Techblog", domain: "techblog.app.br", cat: "Geral", uf: "—", tier: "B", reach: 3000, tokens: 0, color: "#2A6FDB" },
  { id: "v215", name: "Webcitizen", domain: "webcitizen.com.br", cat: "Geral", uf: "—", tier: "B", reach: 3000, tokens: 0, color: "#2A6FDB" },
  { id: "v216", name: "Folhadepiedade", domain: "folhadepiedade.com.br", cat: "Geral", uf: "—", tier: "B", reach: 3000, tokens: 0, color: "#2A6FDB" },
  { id: "v217", name: "Alagoas200", domain: "alagoas200.com.br", cat: "Geral", uf: "—", tier: "B", reach: 3000, tokens: 0, color: "#2A6FDB" },
  { id: "v218", name: "Vivofutebol", domain: "vivofutebol.com.br", cat: "Geral", uf: "—", tier: "C", reach: 3000, tokens: 0, color: "#2F8A5B" },
  { id: "v219", name: "Professortrabalhista", domain: "professortrabalhista.adv.br", cat: "Geral", uf: "—", tier: "D", reach: 2900, tokens: 0, color: "#946100" },
  { id: "v220", name: "Idade", domain: "idade.org", cat: "Geral", uf: "—", tier: "C", reach: 2700, tokens: 0, color: "#2F8A5B" },
  { id: "v221", name: "Virgula", domain: "virgula", cat: "Geral", uf: "—", tier: "D", reach: 2508, tokens: 0, color: "#946100" },
  { id: "v222", name: "Ebookcult", domain: "ebookcult.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2500, tokens: 0, color: "#2F8A5B" },
  { id: "v223", name: "Cnrt", domain: "cnrt.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2500, tokens: 0, color: "#2F8A5B" },
  { id: "v224", name: "Adonline", domain: "adonline.com.br", cat: "Geral", uf: "—", tier: "D", reach: 2500, tokens: 0, color: "#946100" },
  { id: "v225", name: "Lucamoreira", domain: "lucamoreira.com.br", cat: "Geral", uf: "—", tier: "D", reach: 2500, tokens: 0, color: "#946100" },
  { id: "v226", name: "4maos", domain: "4maos.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2400, tokens: 0, color: "#2F8A5B" },
  { id: "v227", name: "Passportnet", domain: "passportnet.com.br", cat: "Geral", uf: "—", tier: "D", reach: 2400, tokens: 0, color: "#946100" },
  { id: "v228", name: "Portalct", domain: "portalct.com.br", cat: "Geral", uf: "—", tier: "D", reach: 2400, tokens: 0, color: "#946100" },
  { id: "v229", name: "Inmais", domain: "inmais.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2358, tokens: 0, color: "#2F8A5B" },
  { id: "v230", name: "Sopacultural", domain: "sopacultural.com", cat: "Geral", uf: "—", tier: "C", reach: 2300, tokens: 0, color: "#2F8A5B" },
  { id: "v231", name: "Agiletesters", domain: "agiletesters.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2300, tokens: 0, color: "#2F8A5B" },
  { id: "v232", name: "Designertours", domain: "designertours.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2200, tokens: 0, color: "#2F8A5B" },
  { id: "v233", name: "Affinibox", domain: "affinibox.com.br", cat: "Geral", uf: "—", tier: "D", reach: 2200, tokens: 0, color: "#946100" },
  { id: "v234", name: "Correiodolitoral", domain: "correiodolitoral.com", cat: "Geral", uf: "—", tier: "C", reach: 2100, tokens: 0, color: "#2F8A5B" },
  { id: "v235", name: "Gamebang", domain: "gamebang.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2000, tokens: 0, color: "#2F8A5B" },
  { id: "v236", name: "Jornalmontesclaros", domain: "jornalmontesclaros.com.br", cat: "Geral", uf: "—", tier: "C", reach: 2000, tokens: 0, color: "#2F8A5B" },
  { id: "v237", name: "Vrsaopaulo", domain: "vrsaopaulo.com.br", cat: "Geral", uf: "—", tier: "D", reach: 2000, tokens: 0, color: "#946100" },
  { id: "v238", name: "Frissononline", domain: "frissononline.com.br", cat: "Geral", uf: "—", tier: "D", reach: 2000, tokens: 0, color: "#946100" },
  { id: "v239", name: "Amdjus", domain: "amdjus.com.br", cat: "Negócios", uf: "—", tier: "D", reach: 2000, tokens: 0, color: "#946100" },
  { id: "v240", name: "Hpg", domain: "hpg.com.br", cat: "Geral", uf: "—", tier: "B", reach: 1900, tokens: 0, color: "#2A6FDB" },
  { id: "v241", name: "Gentedeopiniao", domain: "gentedeopiniao.com.br", cat: "Geral", uf: "—", tier: "C", reach: 1900, tokens: 0, color: "#2F8A5B" },
  { id: "v242", name: "Miniposts", domain: "miniposts.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1900, tokens: 0, color: "#946100" },
  { id: "v243", name: "Valenews", domain: "valenews.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1900, tokens: 0, color: "#946100" },
  { id: "v244", name: "Portonoticias", domain: "portonoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1900, tokens: 0, color: "#946100" },
  { id: "v245", name: "Correiodointerior", domain: "correiodointerior.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1800, tokens: 0, color: "#946100" },
  { id: "v246", name: "Jornaldachapada", domain: "jornaldachapada.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1800, tokens: 0, color: "#946100" },
  { id: "v247", name: "Adital", domain: "adital.com.br", cat: "Geral", uf: "—", tier: "B", reach: 1700, tokens: 0, color: "#2A6FDB" },
  { id: "v248", name: "Caras", domain: "caras.com.br", cat: "Geral", uf: "—", tier: "A", reach: 1600, tokens: 0, color: "#1A1A1A" },
  { id: "v249", name: "Maranhaoesportes", domain: "maranhaoesportes.com", cat: "Geral", uf: "—", tier: "D", reach: 1600, tokens: 0, color: "#946100" },
  { id: "v250", name: "Jornal seg", domain: "jornal.seg.br", cat: "Geral", uf: "—", tier: "C", reach: 1520, tokens: 0, color: "#2F8A5B" },
  { id: "v251", name: "Prepbrasil", domain: "prepbrasil.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1500, tokens: 0, color: "#946100" },
  { id: "v252", name: "Somosnoticia", domain: "somosnoticia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1500, tokens: 0, color: "#946100" },
  { id: "v253", name: "Observatoriodanoticia", domain: "observatoriodanoticia.com.br", cat: "Geral", uf: "—", tier: "B", reach: 1450, tokens: 0, color: "#2A6FDB" },
  { id: "v254", name: "Cameracotidiana", domain: "cameracotidiana.com.br", cat: "Geral", uf: "—", tier: "B", reach: 1400, tokens: 0, color: "#2A6FDB" },
  { id: "v255", name: "Trecobox", domain: "trecobox.com.br", cat: "Geral", uf: "—", tier: "C", reach: 1400, tokens: 0, color: "#2F8A5B" },
  { id: "v256", name: "Sobreviveemsaopaulo", domain: "sobreviveemsaopaulo.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1400, tokens: 0, color: "#946100" },
  { id: "v257", name: "Lagosul", domain: "lagosul.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1400, tokens: 0, color: "#946100" },
  { id: "v258", name: "Barrasvirtual", domain: "barrasvirtual.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1400, tokens: 0, color: "#946100" },
  { id: "v259", name: "Pacoimperial", domain: "pacoimperial.com.br", cat: "Geral", uf: "—", tier: "B", reach: 1300, tokens: 0, color: "#2A6FDB" },
  { id: "v260", name: "Celular1", domain: "celular1.com.br", cat: "Tecnologia", uf: "—", tier: "B", reach: 1300, tokens: 0, color: "#2A6FDB" },
  { id: "v261", name: "F5online", domain: "f5online.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1300, tokens: 0, color: "#946100" },
  { id: "v262", name: "Canaljustica", domain: "canaljustica.jor.br", cat: "Geral", uf: "—", tier: "D", reach: 1300, tokens: 0, color: "#946100" },
  { id: "v263", name: "Omaranhense", domain: "omaranhense.com", cat: "Geral", uf: "—", tier: "D", reach: 1300, tokens: 0, color: "#946100" },
  { id: "v264", name: "Jogosdebola", domain: "jogosdebola.com", cat: "Geral", uf: "—", tier: "B", reach: 1200, tokens: 0, color: "#2A6FDB" },
  { id: "v265", name: "Previdenciasimples", domain: "previdenciasimples.com", cat: "Geral", uf: "—", tier: "C", reach: 1200, tokens: 0, color: "#2F8A5B" },
  { id: "v266", name: "Itrabalhistas", domain: "itrabalhistas.com.br", cat: "Geral", uf: "—", tier: "C", reach: 1200, tokens: 0, color: "#2F8A5B" },
  { id: "v267", name: "Sp2040", domain: "sp2040.net.br", cat: "Geral", uf: "—", tier: "B", reach: 1187, tokens: 0, color: "#2A6FDB" },
  { id: "v268", name: "Tcfoco", domain: "tcfoco.com.br", cat: "Geral", uf: "—", tier: "C", reach: 1159, tokens: 0, color: "#2F8A5B" },
  { id: "v269", name: "Setorneinvestidor", domain: "setorneinvestidor.net", cat: "Geral", uf: "—", tier: "E", reach: 1149, tokens: 0, color: "#C2452E" },
  { id: "v270", name: "Phpconf", domain: "phpconf.com.br", cat: "Geral", uf: "—", tier: "C", reach: 1100, tokens: 0, color: "#2F8A5B" },
  { id: "v271", name: "Revistarumo", domain: "revistarumo.com.br", cat: "Geral", uf: "—", tier: "C", reach: 1100, tokens: 0, color: "#2F8A5B" },
  { id: "v272", name: "News tec", domain: "news.tec.br", cat: "Geral", uf: "—", tier: "C", reach: 1100, tokens: 0, color: "#2F8A5B" },
  { id: "v273", name: "Jornaldobelem", domain: "jornaldobelem.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1100, tokens: 0, color: "#946100" },
  { id: "v274", name: "Andrezzabarros", domain: "andrezzabarros.com", cat: "Geral", uf: "—", tier: "D", reach: 1100, tokens: 0, color: "#946100" },
  { id: "v275", name: "Dicasdeniteroi", domain: "dicasdeniteroi.com.br", cat: "Geral", uf: "—", tier: "E", reach: 1100, tokens: 0, color: "#C2452E" },
  { id: "v276", name: "Cidadenoar", domain: "cidadenoar.com", cat: "Geral", uf: "—", tier: "C", reach: 1002, tokens: 0, color: "#2F8A5B" },
  { id: "v277", name: "Carteiradetrabalho", domain: "carteiradetrabalho.digital", cat: "Geral", uf: "—", tier: "C", reach: 1000, tokens: 0, color: "#2F8A5B" },
  { id: "v278", name: "Portalolhardinamico", domain: "portalolhardinamico.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1000, tokens: 0, color: "#946100" },
  { id: "v279", name: "Financaspessoais", domain: "financaspessoais.blog.br", cat: "Economia", uf: "—", tier: "D", reach: 1000, tokens: 0, color: "#946100" },
  { id: "v280", name: "Revistamind an9", domain: "revistamind.an9.com.br", cat: "Geral", uf: "—", tier: "D", reach: 1000, tokens: 0, color: "#946100" },
  { id: "v281", name: "Newswire", domain: "newswire.com.br", cat: "Geral", uf: "—", tier: "E", reach: 1000, tokens: 0, color: "#C2452E" },
  { id: "v282", name: "Soumaispop", domain: "soumaispop.com.br", cat: "Geral", uf: "—", tier: "E", reach: 1000, tokens: 0, color: "#C2452E" },
  { id: "v283", name: "Papodebicho", domain: "papodebicho.com.br", cat: "Saúde", uf: "—", tier: "E", reach: 1000, tokens: 0, color: "#C2452E" },
  { id: "v284", name: "Radardorio", domain: "radardorio.com.br", cat: "Geral", uf: "—", tier: "E", reach: 1000, tokens: 0, color: "#C2452E" },
  { id: "v285", name: "Projetocasa", domain: "projetocasa.com.br", cat: "Geral", uf: "—", tier: "E", reach: 1000, tokens: 0, color: "#C2452E" },
  { id: "v286", name: "Arena360", domain: "arena360.com.br", cat: "Geral", uf: "—", tier: "E", reach: 1000, tokens: 0, color: "#C2452E" },
  { id: "v287", name: "Nosdomorro", domain: "nosdomorro.com.br", cat: "Geral", uf: "—", tier: "B", reach: 980, tokens: 0, color: "#2A6FDB" },
  { id: "v288", name: "1news correiobraziliense", domain: "1news.correiobraziliense.com.br", cat: "Geral", uf: "—", tier: "A", reach: 958, tokens: 0, color: "#1A1A1A" },
  { id: "v289", name: "Extraguarapuava", domain: "extraguarapuava.com.br", cat: "Geral", uf: "—", tier: "D", reach: 944, tokens: 0, color: "#946100" },
  { id: "v290", name: "Contabilidadecidada", domain: "contabilidadecidada.com.br", cat: "Geral", uf: "—", tier: "E", reach: 939, tokens: 0, color: "#C2452E" },
  { id: "v291", name: "Ortopedistadeombro", domain: "ortopedistadeombro.com.br", cat: "Geral", uf: "—", tier: "C", reach: 913, tokens: 0, color: "#2F8A5B" },
  { id: "v292", name: "Tribunaregiao", domain: "tribunaregiao.com.br", cat: "Geral", uf: "—", tier: "C", reach: 887, tokens: 0, color: "#2F8A5B" },
  { id: "v293", name: "Comofazerdicas", domain: "comofazerdicas.com.br", cat: "Geral", uf: "—", tier: "D", reach: 874, tokens: 0, color: "#946100" },
  { id: "v294", name: "Namidia", domain: "namidia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 873, tokens: 0, color: "#946100" },
  { id: "v295", name: "Sb24horas", domain: "sb24horas.com.br", cat: "Geral", uf: "—", tier: "D", reach: 859, tokens: 0, color: "#946100" },
  { id: "v296", name: "Sportingforever", domain: "sportingforever.com", cat: "Geral", uf: "—", tier: "C", reach: 858, tokens: 0, color: "#2F8A5B" },
  { id: "v297", name: "Portaldostimes", domain: "portaldostimes.com.br", cat: "Geral", uf: "—", tier: "D", reach: 848, tokens: 0, color: "#946100" },
  { id: "v298", name: "Revistadeducao", domain: "revistadeducao.com.br", cat: "Geral", uf: "—", tier: "C", reach: 831, tokens: 0, color: "#2F8A5B" },
  { id: "v299", name: "Revistadeducao", domain: "revistadeducao.com.br", cat: "Geral", uf: "—", tier: "C", reach: 831, tokens: 0, color: "#2F8A5B" },
  { id: "v300", name: "Maracanet", domain: "maracanet.com", cat: "Geral", uf: "—", tier: "D", reach: 808, tokens: 0, color: "#946100" },
  { id: "v301", name: "Correio seg", domain: "correio.seg.br", cat: "Geral", uf: "—", tier: "C", reach: 787, tokens: 0, color: "#2F8A5B" },
  { id: "v302", name: "Vidadeviajante", domain: "vidadeviajante.com.br", cat: "Geral", uf: "—", tier: "D", reach: 764, tokens: 0, color: "#946100" },
  { id: "v303", name: "Tribunaemfoco", domain: "tribunaemfoco.com.br", cat: "Geral", uf: "—", tier: "D", reach: 764, tokens: 0, color: "#946100" },
  { id: "v304", name: "Jornal log", domain: "jornal.log.br", cat: "Geral", uf: "—", tier: "D", reach: 763, tokens: 0, color: "#946100" },
  { id: "v305", name: "Glasses4you", domain: "glasses4you.com.br", cat: "Geral", uf: "—", tier: "C", reach: 722, tokens: 0, color: "#2F8A5B" },
  { id: "v306", name: "Realnews", domain: "realnews.com.br", cat: "Geral", uf: "—", tier: "D", reach: 707, tokens: 0, color: "#946100" },
  { id: "v307", name: "Acontecenors", domain: "acontecenors.com.br", cat: "Geral", uf: "—", tier: "D", reach: 673, tokens: 0, color: "#946100" },
  { id: "v308", name: "Devoltaparaocinema", domain: "devoltaparaocinema.com.br", cat: "Geral", uf: "—", tier: "C", reach: 651, tokens: 0, color: "#2F8A5B" },
  { id: "v309", name: "Folhanobre", domain: "folhanobre.com.br", cat: "Geral", uf: "—", tier: "C", reach: 639, tokens: 0, color: "#2F8A5B" },
  { id: "v310", name: "Agora To", domain: "agora-to.com.br", cat: "Geral", uf: "—", tier: "D", reach: 627, tokens: 0, color: "#946100" },
  { id: "v311", name: "Gazetaderondonia", domain: "gazetaderondonia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 610, tokens: 0, color: "#2F8A5B" },
  { id: "v312", name: "Salariomaternidade", domain: "salariomaternidade.com.br", cat: "Geral", uf: "—", tier: "C", reach: 576, tokens: 0, color: "#2F8A5B" },
  { id: "v313", name: "Gazetaregional", domain: "gazetaregional.com", cat: "Geral", uf: "—", tier: "D", reach: 568, tokens: 0, color: "#946100" },
  { id: "v314", name: "Teixeiraemfoco", domain: "teixeiraemfoco.com.br", cat: "Geral", uf: "—", tier: "C", reach: 561, tokens: 0, color: "#2F8A5B" },
  { id: "v315", name: "Epopnaweb", domain: "epopnaweb.com.br", cat: "Geral", uf: "—", tier: "D", reach: 550, tokens: 0, color: "#946100" },
  { id: "v316", name: "Estadodoparana", domain: "estadodoparana.com", cat: "Geral", uf: "—", tier: "D", reach: 498, tokens: 0, color: "#946100" },
  { id: "v317", name: "Gazetadorio", domain: "gazetadorio.com.br", cat: "Geral", uf: "—", tier: "D", reach: 485, tokens: 0, color: "#946100" },
  { id: "v318", name: "Informa curitiba", domain: "informa.curitiba.br", cat: "Geral", uf: "—", tier: "C", reach: 482, tokens: 0, color: "#2F8A5B" },
  { id: "v319", name: "Abadianoticia", domain: "abadianoticia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 468, tokens: 0, color: "#2F8A5B" },
  { id: "v320", name: "Construcaoeacabamento", domain: "construcaoeacabamento.com.br", cat: "Geral", uf: "—", tier: "E", reach: 466, tokens: 0, color: "#C2452E" },
  { id: "v321", name: "Fatocurioso", domain: "fatocurioso.info", cat: "Geral", uf: "—", tier: "D", reach: 458, tokens: 0, color: "#946100" },
  { id: "v322", name: "Tonamidia", domain: "tonamidia.com.br", cat: "Entretenimento", uf: "—", tier: "D", reach: 449, tokens: 0, color: "#946100" },
  { id: "v323", name: "Bloglge", domain: "bloglge.com.br", cat: "Geral", uf: "—", tier: "C", reach: 444, tokens: 0, color: "#2F8A5B" },
  { id: "v324", name: "Sosnoticias", domain: "sosnoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 428, tokens: 0, color: "#946100" },
  { id: "v325", name: "Noticiasatual", domain: "noticiasatual.com", cat: "Geral", uf: "—", tier: "D", reach: 414, tokens: 0, color: "#946100" },
  { id: "v326", name: "Advogadosemsaopaulosp", domain: "advogadosemsaopaulosp.com.br", cat: "Jurídico", uf: "—", tier: "D", reach: 400, tokens: 0, color: "#946100" },
  { id: "v327", name: "Clubemetropole", domain: "clubemetropole.com.br", cat: "Geral", uf: "—", tier: "C", reach: 397, tokens: 0, color: "#2F8A5B" },
  { id: "v328", name: "Assisnoticias", domain: "assisnoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 395, tokens: 0, color: "#946100" },
  { id: "v329", name: "Clickcampos", domain: "clickcampos.com", cat: "Geral", uf: "—", tier: "E", reach: 395, tokens: 0, color: "#C2452E" },
  { id: "v330", name: "Jornalasemana", domain: "jornalasemana.com.br", cat: "Geral", uf: "—", tier: "D", reach: 366, tokens: 0, color: "#946100" },
  { id: "v331", name: "Sabedoriaglobal", domain: "sabedoriaglobal.com.br", cat: "Saúde", uf: "—", tier: "B", reach: 360, tokens: 0, color: "#2A6FDB" },
  { id: "v332", name: "Saudeacessivel", domain: "saudeacessivel.com.br", cat: "Saúde", uf: "—", tier: "B", reach: 352, tokens: 0, color: "#2A6FDB" },
  { id: "v333", name: "Portaldogamer", domain: "portaldogamer.com.br", cat: "Geral", uf: "—", tier: "B", reach: 352, tokens: 0, color: "#2A6FDB" },
  { id: "v334", name: "Portalyoba", domain: "portalyoba.com.br", cat: "Geral", uf: "—", tier: "D", reach: 348, tokens: 0, color: "#946100" },
  { id: "v335", name: "Botucatuonline", domain: "botucatuonline.com", cat: "Geral", uf: "—", tier: "D", reach: 346, tokens: 0, color: "#946100" },
  { id: "v336", name: "Businessideas", domain: "businessideas.com.br", cat: "Geral", uf: "—", tier: "D", reach: 346, tokens: 0, color: "#946100" },
  { id: "v337", name: "Meubanco", domain: "meubanco.digital", cat: "Geral", uf: "—", tier: "C", reach: 343, tokens: 0, color: "#2F8A5B" },
  { id: "v338", name: "Universarioscristaos", domain: "universarioscristaos.com.br", cat: "Geral", uf: "—", tier: "D", reach: 324, tokens: 0, color: "#946100" },
  { id: "v339", name: "Folhadeparnaiba", domain: "folhadeparnaiba.com.br", cat: "Geral", uf: "—", tier: "C", reach: 308, tokens: 0, color: "#2F8A5B" },
  { id: "v340", name: "Euamomeusanimais", domain: "euamomeusanimais.com.br", cat: "Geral", uf: "—", tier: "D", reach: 302, tokens: 0, color: "#946100" },
  { id: "v341", name: "Timesbrasilia", domain: "timesbrasilia.com.br", cat: "Geral", uf: "—", tier: "D", reach: 301, tokens: 0, color: "#946100" },
  { id: "v342", name: "Portalgc", domain: "portalgc.com.br", cat: "Geral", uf: "—", tier: "C", reach: 300, tokens: 0, color: "#2F8A5B" },
  { id: "v343", name: "Clickjornal", domain: "clickjornal.com", cat: "Geral", uf: "—", tier: "D", reach: 299, tokens: 0, color: "#946100" },
  { id: "v344", name: "Portalz tec", domain: "portalz.tec.br", cat: "Geral", uf: "—", tier: "C", reach: 297, tokens: 0, color: "#2F8A5B" },
  { id: "v345", name: "Cirurgiacoracao", domain: "cirurgiacoracao.com.br", cat: "Saúde", uf: "—", tier: "E", reach: 297, tokens: 0, color: "#C2452E" },
  { id: "v346", name: "Portalrmc", domain: "portalrmc.net", cat: "Geral", uf: "—", tier: "C", reach: 295, tokens: 0, color: "#2F8A5B" },
  { id: "v347", name: "Setorenergetico", domain: "setorenergetico.com.br", cat: "Geral", uf: "—", tier: "B", reach: 285, tokens: 0, color: "#2A6FDB" },
  { id: "v348", name: "Nahoraonline", domain: "nahoraonline.com", cat: "Geral", uf: "—", tier: "D", reach: 268, tokens: 0, color: "#946100" },
  { id: "v349", name: "Diariodaborborema", domain: "diariodaborborema.com.br", cat: "Geral", uf: "—", tier: "D", reach: 266, tokens: 0, color: "#946100" },
  { id: "v350", name: "Onortao", domain: "onortao.com.br", cat: "Geral", uf: "—", tier: "C", reach: 260, tokens: 0, color: "#2F8A5B" },
  { id: "v351", name: "Cirurgiadacatarata", domain: "cirurgiadacatarata.com.br", cat: "Saúde", uf: "—", tier: "D", reach: 258, tokens: 0, color: "#946100" },
  { id: "v352", name: "Advivo", domain: "advivo.com.br", cat: "Negócios", uf: "—", tier: "B", reach: 255, tokens: 0, color: "#2A6FDB" },
  { id: "v353", name: "Minhaconquista", domain: "minhaconquista.digital", cat: "Geral", uf: "—", tier: "D", reach: 255, tokens: 0, color: "#946100" },
  { id: "v354", name: "Cirurgiadecancer", domain: "cirurgiadecancer.com.br", cat: "Saúde", uf: "—", tier: "E", reach: 254, tokens: 0, color: "#C2452E" },
  { id: "v355", name: "Paisagismobrasil", domain: "paisagismobrasil.com.br", cat: "Geral", uf: "—", tier: "C", reach: 253, tokens: 0, color: "#2F8A5B" },
  { id: "v356", name: "Tribunadodia", domain: "tribunadodia.com.br", cat: "Geral", uf: "—", tier: "E", reach: 250, tokens: 0, color: "#C2452E" },
  { id: "v357", name: "Administracaopolitica", domain: "administracaopolitica.com.br", cat: "Geral", uf: "—", tier: "C", reach: 249, tokens: 0, color: "#2F8A5B" },
  { id: "v358", name: "Embanewsonline", domain: "embanewsonline.com.br", cat: "Geral", uf: "—", tier: "C", reach: 242, tokens: 0, color: "#2F8A5B" },
  { id: "v359", name: "Agrocotacoes", domain: "agrocotacoes.com.br", cat: "Geral", uf: "—", tier: "D", reach: 240, tokens: 0, color: "#946100" },
  { id: "v360", name: "Luiziananoticias", domain: "luiziananoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 226, tokens: 0, color: "#2F8A5B" },
  { id: "v361", name: "Amadahipertrofia", domain: "amadahipertrofia.com", cat: "Geral", uf: "—", tier: "C", reach: 218, tokens: 0, color: "#2F8A5B" },
  { id: "v362", name: "Tudosexo", domain: "tudosexo.com.br", cat: "Saúde", uf: "—", tier: "E", reach: 210, tokens: 0, color: "#C2452E" },
  { id: "v363", name: "Gfama", domain: "gfama.com.br", cat: "Geral", uf: "—", tier: "E", reach: 205, tokens: 0, color: "#C2452E" },
  { id: "v364", name: "Saopauloaberta", domain: "saopauloaberta.com.br", cat: "Geral", uf: "—", tier: "B", reach: 200, tokens: 0, color: "#2A6FDB" },
  { id: "v365", name: "Siteego", domain: "siteego.com.br", cat: "Geral", uf: "—", tier: "E", reach: 200, tokens: 0, color: "#C2452E" },
  { id: "v366", name: "Noticas24horas", domain: "noticas24horas.com.br", cat: "Geral", uf: "—", tier: "C", reach: 198, tokens: 0, color: "#2F8A5B" },
  { id: "v367", name: "Paradis", domain: "paradis.com.br", cat: "Geral", uf: "—", tier: "D", reach: 192, tokens: 0, color: "#946100" },
  { id: "v368", name: "Trespassosnews", domain: "trespassosnews.com.br", cat: "Geral", uf: "—", tier: "D", reach: 191, tokens: 0, color: "#946100" },
  { id: "v369", name: "Brazilurgente", domain: "brazilurgente.com.br", cat: "Geral", uf: "—", tier: "D", reach: 191, tokens: 0, color: "#946100" },
  { id: "v370", name: "Hipnoseterapia", domain: "hipnoseterapia.org", cat: "Geral", uf: "—", tier: "C", reach: 189, tokens: 0, color: "#2F8A5B" },
  { id: "v371", name: "Wtw19", domain: "wtw19.com.br", cat: "Geral", uf: "—", tier: "C", reach: 188, tokens: 0, color: "#2F8A5B" },
  { id: "v372", name: "Jornalpreliminar", domain: "jornalpreliminar.com.br", cat: "Geral", uf: "—", tier: "C", reach: 186, tokens: 0, color: "#2F8A5B" },
  { id: "v373", name: "Conteudosgeniais", domain: "conteudosgeniais.com.br", cat: "Geral", uf: "—", tier: "D", reach: 183, tokens: 0, color: "#946100" },
  { id: "v374", name: "Gentefamosa", domain: "gentefamosa.com.br", cat: "Geral", uf: "—", tier: "E", reach: 180, tokens: 0, color: "#C2452E" },
  { id: "v375", name: "Aguafrianoticias", domain: "aguafrianoticias.com.br", cat: "Geral", uf: "—", tier: "E", reach: 180, tokens: 0, color: "#C2452E" },
  { id: "v376", name: "Gossiptime", domain: "gossiptime.com.br", cat: "Geral", uf: "—", tier: "E", reach: 180, tokens: 0, color: "#C2452E" },
  { id: "v377", name: "Mundolatino", domain: "mundolatino.com.br", cat: "Geral", uf: "—", tier: "D", reach: 179, tokens: 0, color: "#946100" },
  { id: "v378", name: "Universoneo", domain: "universoneo.com.br", cat: "Geral", uf: "—", tier: "B", reach: 177, tokens: 0, color: "#2A6FDB" },
  { id: "v379", name: "Babyou", domain: "babyou.com.br", cat: "Saúde", uf: "—", tier: "C", reach: 166, tokens: 0, color: "#2F8A5B" },
  { id: "v380", name: "Colunatech", domain: "colunatech.com.br", cat: "Geral", uf: "—", tier: "B", reach: 164, tokens: 0, color: "#2A6FDB" },
  { id: "v381", name: "Itapenoticias", domain: "itapenoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 158, tokens: 0, color: "#2F8A5B" },
  { id: "v382", name: "Vitrinepix", domain: "vitrinepix.com.br", cat: "Geral", uf: "—", tier: "C", reach: 151, tokens: 0, color: "#2F8A5B" },
  { id: "v383", name: "Incast", domain: "incast.com.br", cat: "Tecnologia", uf: "—", tier: "C", reach: 149, tokens: 0, color: "#2F8A5B" },
  { id: "v384", name: "Trocaria", domain: "trocaria.com.br", cat: "Geral", uf: "—", tier: "C", reach: 148, tokens: 0, color: "#2F8A5B" },
  { id: "v385", name: "Qmixdigital", domain: "qmixdigital.com.br", cat: "Geral", uf: "—", tier: "D", reach: 148, tokens: 0, color: "#946100" },
  { id: "v386", name: "Vazounaweb", domain: "vazounaweb.com.br", cat: "Geral", uf: "—", tier: "E", reach: 148, tokens: 0, color: "#C2452E" },
  { id: "v387", name: "Contei", domain: "contei.com.br", cat: "Geral", uf: "—", tier: "E", reach: 147, tokens: 0, color: "#C2452E" },
  { id: "v388", name: "Diariopernambucano", domain: "diariopernambucano.com.br", cat: "Geral", uf: "—", tier: "C", reach: 135, tokens: 0, color: "#2F8A5B" },
  { id: "v389", name: "Doutortv", domain: "doutortv.com.br", cat: "Geral", uf: "—", tier: "D", reach: 134, tokens: 0, color: "#946100" },
  { id: "v390", name: "Noticiasdaserra", domain: "noticiasdaserra.com.br", cat: "Geral", uf: "—", tier: "C", reach: 132, tokens: 0, color: "#2F8A5B" },
  { id: "v391", name: "Guairanews", domain: "guairanews.com", cat: "Geral", uf: "—", tier: "D", reach: 131, tokens: 0, color: "#946100" },
  { id: "v392", name: "Uol Portalarrumandoasmalas", domain: "uol.portalarrumandoasmalas.com.br", cat: "Geral", uf: "—", tier: "E", reach: 129, tokens: 0, color: "#C2452E" },
  { id: "v393", name: "Df8", domain: "df8.com.br", cat: "Geral", uf: "—", tier: "B", reach: 123, tokens: 0, color: "#2A6FDB" },
  { id: "v394", name: "Portalcarreirajuridica", domain: "portalcarreirajuridica.com.br", cat: "Geral", uf: "—", tier: "D", reach: 121, tokens: 0, color: "#946100" },
  { id: "v395", name: "Limeiradigital", domain: "limeiradigital.com", cat: "Geral", uf: "—", tier: "D", reach: 120, tokens: 0, color: "#946100" },
  { id: "v396", name: "Fashionlike", domain: "fashionlike.com.br", cat: "Geral", uf: "—", tier: "E", reach: 120, tokens: 0, color: "#C2452E" },
  { id: "v397", name: "Advogadoscriminais", domain: "advogadoscriminais.com", cat: "Geral", uf: "—", tier: "D", reach: 119, tokens: 0, color: "#946100" },
  { id: "v398", name: "Jornalbahia", domain: "jornalbahia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 116, tokens: 0, color: "#2F8A5B" },
  { id: "v399", name: "Clicnoroeste", domain: "clicnoroeste.com", cat: "Economia", uf: "—", tier: "D", reach: 112, tokens: 0, color: "#946100" },
  { id: "v400", name: "Alertasocial", domain: "alertasocial.com.br", cat: "Geral", uf: "—", tier: "C", reach: 107, tokens: 0, color: "#2F8A5B" },
  { id: "v401", name: "Carroslancamentos", domain: "carroslancamentos.com.br", cat: "Geral", uf: "—", tier: "C", reach: 101, tokens: 0, color: "#2F8A5B" },
  { id: "v402", name: "Divirto", domain: "divirto.com.br", cat: "Geral", uf: "—", tier: "B", reach: 100, tokens: 0, color: "#2A6FDB" },
  { id: "v403", name: "Saudevitalidade", domain: "saudevitalidade.com.br", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v404", name: "Meupis2021", domain: "meupis2021.com", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v405", name: "Achixclip", domain: "achixclip.com.br", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v406", name: "Certidaonegativa", domain: "certidaonegativa.org", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v407", name: "Mundodasdicas", domain: "mundodasdicas.com.br", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v408", name: "Resumovirtual", domain: "resumovirtual.com.br", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v409", name: "Maisro", domain: "maisro.com.br", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v410", name: "Falanortenordeste", domain: "falanortenordeste.com.br", cat: "Geral", uf: "—", tier: "C", reach: 100, tokens: 0, color: "#2F8A5B" },
  { id: "v411", name: "Publisherbrasil", domain: "publisherbrasil.com.br", cat: "Geral", uf: "—", tier: "D", reach: 100, tokens: 0, color: "#946100" },
  { id: "v412", name: "Visaoimparcial", domain: "visaoimparcial.com", cat: "Geral", uf: "—", tier: "D", reach: 100, tokens: 0, color: "#946100" },
  { id: "v413", name: "Culturaenegocios", domain: "culturaenegocios.com.br", cat: "Geral", uf: "—", tier: "D", reach: 100, tokens: 0, color: "#946100" },
  { id: "v414", name: "Meioambienterio", domain: "meioambienterio.com", cat: "Geral", uf: "—", tier: "D", reach: 100, tokens: 0, color: "#946100" },
  { id: "v415", name: "Revista Portalutil", domain: "revista.portalutil.com.br", cat: "Geral", uf: "—", tier: "C", reach: 99, tokens: 0, color: "#2F8A5B" },
  { id: "v416", name: "Celularhoje", domain: "celularhoje.com", cat: "Geral", uf: "—", tier: "C", reach: 98, tokens: 0, color: "#2F8A5B" },
  { id: "v417", name: "Circulandonews", domain: "circulandonews.com.br", cat: "Geral", uf: "—", tier: "C", reach: 93, tokens: 0, color: "#2F8A5B" },
  { id: "v418", name: "Desassossegada", domain: "desassossegada.com.br", cat: "Geral", uf: "—", tier: "B", reach: 92, tokens: 0, color: "#2A6FDB" },
  { id: "v419", name: "Itbusinessforum", domain: "itbusinessforum.com.br", cat: "Geral", uf: "—", tier: "D", reach: 91, tokens: 0, color: "#946100" },
  { id: "v420", name: "Logicadomercado", domain: "logicadomercado.com.br", cat: "Geral", uf: "—", tier: "D", reach: 90, tokens: 0, color: "#946100" },
  { id: "v421", name: "Xthor", domain: "xthor.com.br", cat: "Geral", uf: "—", tier: "C", reach: 88, tokens: 0, color: "#2F8A5B" },
  { id: "v422", name: "Muitaviagem", domain: "muitaviagem.com.br", cat: "Geral", uf: "—", tier: "C", reach: 83, tokens: 0, color: "#2F8A5B" },
  { id: "v423", name: "Valeapena", domain: "valeapena.com.br", cat: "Geral", uf: "—", tier: "D", reach: 83, tokens: 0, color: "#946100" },
  { id: "v424", name: "Noticiasdetimon", domain: "noticiasdetimon.com.br", cat: "Geral", uf: "—", tier: "C", reach: 82, tokens: 0, color: "#2F8A5B" },
  { id: "v425", name: "Ideiasefinancas", domain: "ideiasefinancas.com.br", cat: "Geral", uf: "—", tier: "C", reach: 80, tokens: 0, color: "#2F8A5B" },
  { id: "v426", name: "Saberdefato", domain: "saberdefato.com.br", cat: "Geral", uf: "—", tier: "C", reach: 80, tokens: 0, color: "#2F8A5B" },
  { id: "v427", name: "Elapop", domain: "elapop.com", cat: "Geral", uf: "—", tier: "D", reach: 76, tokens: 0, color: "#946100" },
  { id: "v428", name: "Atualizado", domain: "atualizado.net.br", cat: "Geral", uf: "—", tier: "C", reach: 75, tokens: 0, color: "#2F8A5B" },
  { id: "v429", name: "Alagoasdiario", domain: "alagoasdiario.com.br", cat: "Geral", uf: "—", tier: "C", reach: 75, tokens: 0, color: "#2F8A5B" },
  { id: "v430", name: "Opopularjornal", domain: "opopularjornal.com.br", cat: "Geral", uf: "—", tier: "C", reach: 75, tokens: 0, color: "#2F8A5B" },
  { id: "v431", name: "Imprensaemidia", domain: "imprensaemidia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 70, tokens: 0, color: "#2F8A5B" },
  { id: "v432", name: "Blogse", domain: "blogse.com.br", cat: "Geral", uf: "—", tier: "C", reach: 67, tokens: 0, color: "#2F8A5B" },
  { id: "v433", name: "Gazetadanoticia", domain: "gazetadanoticia.com.br", cat: "Geral", uf: "—", tier: "E", reach: 63, tokens: 0, color: "#C2452E" },
  { id: "v434", name: "Itapecurunoticias", domain: "itapecurunoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 62, tokens: 0, color: "#2F8A5B" },
  { id: "v435", name: "Planomedicosaude", domain: "planomedicosaude.com.br", cat: "Geral", uf: "—", tier: "C", reach: 60, tokens: 0, color: "#2F8A5B" },
  { id: "v436", name: "Brasilnovonoticias", domain: "brasilnovonoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 57, tokens: 0, color: "#2F8A5B" },
  { id: "v437", name: "Agoraefacil", domain: "agoraefacil.com", cat: "Geral", uf: "—", tier: "D", reach: 57, tokens: 0, color: "#946100" },
  { id: "v438", name: "Regiaohoje", domain: "regiaohoje.com.br", cat: "Geral", uf: "—", tier: "D", reach: 55, tokens: 0, color: "#946100" },
  { id: "v439", name: "Megalopoles", domain: "megalopoles.com.br", cat: "Geral", uf: "—", tier: "E", reach: 55, tokens: 0, color: "#C2452E" },
  { id: "v440", name: "Diariorepublicano", domain: "diariorepublicano.com.br", cat: "Geral", uf: "—", tier: "E", reach: 54, tokens: 0, color: "#C2452E" },
  { id: "v441", name: "Futebolatino lance", domain: "futebolatino.lance.com.br", cat: "Geral", uf: "—", tier: "A", reach: 50, tokens: 0, color: "#1A1A1A" },
  { id: "v442", name: "Gamerview Uai", domain: "gamerview.uai.com.br", cat: "Geral", uf: "—", tier: "B", reach: 50, tokens: 0, color: "#2A6FDB" },
  { id: "v443", name: "Meiahora", domain: "meiahora.com.br", cat: "Geral", uf: "—", tier: "B", reach: 50, tokens: 0, color: "#2A6FDB" },
  { id: "v444", name: "Astralassessoria", domain: "astralassessoria.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v445", name: "Novoprogresso portaldacidade", domain: "novoprogresso.portaldacidade.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v446", name: "Aguabrancaemfoco", domain: "aguabrancaemfoco.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v447", name: "Tribunaminas", domain: "tribunaminas.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v448", name: "Afnewss", domain: "afnewss.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v449", name: "Curiosododia", domain: "curiosododia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v450", name: "Estudioweb", domain: "estudioweb.com.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v451", name: "Dicasdaily", domain: "dicasdaily.com", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v452", name: "Informa foz", domain: "informa.foz.br", cat: "Geral", uf: "—", tier: "C", reach: 50, tokens: 0, color: "#2F8A5B" },
  { id: "v453", name: "Tudoinsight", domain: "tudoinsight.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v454", name: "Hojetrends", domain: "hojetrends.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v455", name: "Easyideias", domain: "easyideias.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v456", name: "Guiadeinvestimento", domain: "guiadeinvestimento.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v457", name: "Fatoslight", domain: "fatoslight.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v458", name: "Fatosway", domain: "fatosway.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v459", name: "Clickparana", domain: "clickparana.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v460", name: "Topnewstech", domain: "topnewstech.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v461", name: "Araguainanoticias", domain: "araguainanoticias.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v462", name: "Anselmosantana", domain: "anselmosantana.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v463", name: "Digiwn", domain: "digiwn.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v464", name: "Marcasemercados", domain: "marcasemercados.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v465", name: "Empregosconcursos", domain: "empregosconcursos.com", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v466", name: "Nitronewsbrasil", domain: "nitronewsbrasil.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v467", name: "Muitomaisqueoamor", domain: "muitomaisqueoamor.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v468", name: "Ortopediacoluna", domain: "ortopediacoluna.com.br", cat: "Geral", uf: "—", tier: "D", reach: 50, tokens: 0, color: "#946100" },
  { id: "v469", name: "Revistaconsumo", domain: "revistaconsumo.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v470", name: "Esportefantastico", domain: "esportefantastico.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v471", name: "Portaldafama", domain: "portaldafama.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v472", name: "Tododiafit", domain: "tododiafit.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v473", name: "Glp4", domain: "glp4.com", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v474", name: "Socelebridades", domain: "socelebridades.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v475", name: "Cosmopolitam", domain: "cosmopolitam.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v476", name: "Egomaranhao", domain: "egomaranhao.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v477", name: "Influenciadoresdobrasil", domain: "influenciadoresdobrasil.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v478", name: "Tupinews", domain: "tupinews.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v479", name: "Qgdafama", domain: "qgdafama.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v480", name: "Tvseja", domain: "tvseja.com.br", cat: "Geral", uf: "—", tier: "E", reach: 50, tokens: 0, color: "#C2452E" },
  { id: "v481", name: "Jornaldobairroalto", domain: "jornaldobairroalto.com.br", cat: "Geral", uf: "—", tier: "C", reach: 43, tokens: 0, color: "#2F8A5B" },
  { id: "v482", name: "Revistabahiaemfoco", domain: "revistabahiaemfoco.com.br", cat: "Geral", uf: "—", tier: "C", reach: 43, tokens: 0, color: "#2F8A5B" },
  { id: "v483", name: "Nicecontentnews", domain: "nicecontentnews.com", cat: "Geral", uf: "—", tier: "C", reach: 43, tokens: 0, color: "#2F8A5B" },
  { id: "v484", name: "Cocaisnoticias", domain: "cocaisnoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 38, tokens: 0, color: "#2F8A5B" },
  { id: "v485", name: "Cabrobonews", domain: "cabrobonews.com.br", cat: "Geral", uf: "—", tier: "C", reach: 34, tokens: 0, color: "#2F8A5B" },
  { id: "v486", name: "Portoenoticias", domain: "portoenoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 34, tokens: 0, color: "#2F8A5B" },
  { id: "v487", name: "Agenciadivulgar", domain: "agenciadivulgar.com.br", cat: "Geral", uf: "—", tier: "C", reach: 30, tokens: 0, color: "#2F8A5B" },
  { id: "v488", name: "Apucarananoticias", domain: "apucarananoticias.com.br", cat: "Geral", uf: "—", tier: "C", reach: 29, tokens: 0, color: "#2F8A5B" },
  { id: "v489", name: "Maranhaomais", domain: "maranhaomais.com.br", cat: "Geral", uf: "—", tier: "C", reach: 28, tokens: 0, color: "#2F8A5B" },
  { id: "v490", name: "Jornalnoticiaonline", domain: "jornalnoticiaonline.com", cat: "Geral", uf: "—", tier: "C", reach: 25, tokens: 0, color: "#2F8A5B" },
  { id: "v491", name: "Noticiasdefloriano", domain: "noticiasdefloriano.com.br", cat: "Geral", uf: "—", tier: "C", reach: 24, tokens: 0, color: "#2F8A5B" },
  { id: "v492", name: "Azulmagazine", domain: "azulmagazine.com.br", cat: "Geral", uf: "—", tier: "C", reach: 24, tokens: 0, color: "#2F8A5B" },
  { id: "v493", name: "Dicasfemininas", domain: "dicasfemininas.com.br", cat: "Geral", uf: "—", tier: "C", reach: 20, tokens: 0, color: "#2F8A5B" },
  { id: "v494", name: "Noticiasemminasgerais", domain: "noticiasemminasgerais.com", cat: "Geral", uf: "—", tier: "C", reach: 20, tokens: 0, color: "#2F8A5B" },
  { id: "v495", name: "Ouvidoriabrasil", domain: "ouvidoriabrasil.org", cat: "Geral", uf: "—", tier: "B", reach: 15, tokens: 0, color: "#2A6FDB" },
  { id: "v496", name: "Medicodasmaos", domain: "medicodasmaos.com.br", cat: "Saúde", uf: "—", tier: "C", reach: 15, tokens: 0, color: "#2F8A5B" },
  { id: "v497", name: "Reporteranadia", domain: "reporteranadia.com.br", cat: "Geral", uf: "—", tier: "C", reach: 12, tokens: 0, color: "#2F8A5B" },
  { id: "v498", name: "Saudeemalta", domain: "saudeemalta.net.br", cat: "Saúde", uf: "—", tier: "B", reach: 10, tokens: 0, color: "#2A6FDB" },
  { id: "v499", name: "Revistatopsaude", domain: "revistatopsaude.com.br", cat: "Saúde", uf: "—", tier: "C", reach: 10, tokens: 0, color: "#2F8A5B" },
  { id: "v500", name: "Saudicas", domain: "saudicas.com.br", cat: "Saúde", uf: "—", tier: "C", reach: 10, tokens: 0, color: "#2F8A5B" },
  { id: "v501", name: "Ief", domain: "ief.com.br", cat: "Geral", uf: "—", tier: "D", reach: 10, tokens: 0, color: "#946100" },
  { id: "v502", name: "Catacralibre", domain: "catacralibre.com.br", cat: "Geral", uf: "—", tier: "E", reach: 1, tokens: 0, color: "#C2452E" }
];

const VEH_CATS  = ["Geral","Negócios","Tecnologia","Esportes","Economia","Saúde","Entretenimento","Política","Jurídico","Agronegócio"];
const VEH_TIERS = ["A","B","C","D","E"];

const TIER_TOKENS:  Record<string, number> = { A: 250, B: 150, C: 100, D: 50, E: 0 };
const TIER_COLORS:  Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017", D: "#3A7DC9", E: "#D0DFF0" };
const TIER_FG:      Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff",    D: "#fff",    E: "#3A5A80" };

const TIER_INFO = [
  { t: "A", label: "Grande portal nacional", range: "10 mi+ leitores/mês",  tokens: 250, cls: "t-a" },
  { t: "B", label: "Portal regional forte",  range: "100 mil–10 mi/mês",    tokens: 150, cls: "t-b" },
  { t: "C", label: "Portal médio / nicho",   range: "10 mil–100 mil/mês",   tokens: 100, cls: "t-c" },
  { t: "D", label: "Blog / portal local",    range: "1 mil–10 mil/mês",     tokens: 50,  cls: "t-d" },
  { t: "E", label: "Site emergente",         range: "Até 1 mil/mês",        tokens: 0,   cls: "t-e" },
];

type SortCol = "name" | "cat" | "tier" | "reach" | "tokens";
type SortDir = "asc" | "desc";

function fmtReach(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const TIER_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

function sortVehicles(arr: typeof VEHICLES, col: SortCol, dir: SortDir) {
  return [...arr].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (col === "tokens") { va = TIER_TOKENS[a.tier] ?? 0; vb = TIER_TOKENS[b.tier] ?? 0; }
    else if (col === "tier") { va = TIER_ORDER[a.tier] ?? 99; vb = TIER_ORDER[b.tier] ?? 99; }
    else if (col === "reach") { va = a.reach; vb = b.reach; }
    else { va = (a[col] as string).toLowerCase(); vb = (b[col] as string).toLowerCase(); }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown size={13} style={{ opacity: 0.3, marginLeft: 4 }} />;
  return dir === "asc"
    ? <ArrowUp size={13} style={{ marginLeft: 4, color: "var(--coral-ink)" }} />
    : <ArrowDown size={13} style={{ marginLeft: 4, color: "var(--coral-ink)" }} />;
}

function FilterModal({ cats, tiers, onApply, onClose }: {
  cats: string[]; tiers: string[];
  onApply: (cats: string[], tiers: string[]) => void;
  onClose: () => void;
}) {
  const [selCats,  setSelCats]  = useState<string[]>(cats);
  const [selTiers, setSelTiers] = useState<string[]>(tiers);

  const toggleCat  = (c: string) => setSelCats(prev  => prev.includes(c)  ? prev.filter(x => x !== c)  : [...prev, c]);
  const toggleTier = (t: string) => setSelTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const activeCount = selCats.length + selTiers.length;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="m-head">
          <h3>Filtrar veículos</h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Categoria</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VEH_CATS.map(c => (
                <button key={c} onClick={() => toggleCat(c)}
                  className={`chip${selCats.includes(c) ? " active" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Tier</p>
            <div style={{ display: "flex", gap: 8 }}>
              {VEH_TIERS.map(t => (
                <button key={t} onClick={() => toggleTier(t)}
                  className={`chip${selTiers.includes(t) ? " active" : ""}`}>
                  Tier {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="m-foot" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelCats([]); setSelTiers([]); }}>
            Limpar filtros
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={() => { onApply(selCats, selTiers); onClose(); }}>
              Aplicar {activeCount > 0 ? `(${activeCount})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VeiculosPage() {
  const [q,           setQ]          = useState("");
  const [filterCats,  setFilterCats] = useState<string[]>([]);
  const [filterTiers, setFilterTiers] = useState<string[]>([]);
  const [sortCol,     setSortCol]    = useState<SortCol>("reach");
  const [sortDir,     setSortDir]    = useState<SortDir>("desc");
  const [showFilter,  setShowFilter] = useState(false);
  const [page,        setPage]       = useState(1);

  const PAGE_SIZE     = 25;
  const activeFilters = filterCats.length + filterTiers.length;

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  }

  const thStyle = (col: SortCol): React.CSSProperties => ({
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    color: sortCol === col ? "var(--coral-ink)" : undefined,
    verticalAlign: "middle",
  });

  const thInner = (label: string, col: SortCol, align: "left" | "right" = "left") => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: align === "right" ? "flex-end" : "flex-start", width: "100%" }}>
      {label}
      <SortIcon col={col} active={sortCol} dir={sortDir} />
    </span>
  );

  const filtered = VEHICLES.filter(v =>
    (filterCats.length  === 0 || filterCats.includes(v.cat))  &&
    (filterTiers.length === 0 || filterTiers.includes(v.tier)) &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );

  const sorted     = sortVehicles(filtered, sortCol, sortDir);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const list       = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalReach = sorted.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Rede</p>
            <h2><em>Centenas</em> de veículos parceiros</h2>
            <p className="sub">Do grande portal nacional ao blog regional. Escolha os veículos certos para cada release no momento de agendar.</p>
          </div>
        </div>

        {/* Cards de tier */}
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 24 }}>
          {TIER_INFO.map(ti => (
            <div className="card kpi" key={ti.t} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span className={`tier ${ti.cls}`} style={{ fontSize: 11, padding: "4px 10px" }}>{ti.t}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)" }}>
                  {ti.tokens > 0 ? `${ti.tokens}` : "0"}
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--stone)", marginLeft: 4 }}>créditos</span>
                </span>
              </div>
              <div className="lbl">{ti.label}</div>
              <div className="val" style={{ fontSize: 13, marginTop: 4, fontWeight: 700 }}>{ti.range}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ marginBottom: 18, gap: 8 }}>
          <button
            className={`btn btn-ghost btn-sm${activeFilters > 0 ? " active" : ""}`}
            onClick={() => setShowFilter(true)}
            style={{ gap: 6 }}
          >
            <SlidersHorizontal size={14} />
            Filtrar
            {activeFilters > 0 && (
              <span style={{ background: "var(--coral)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px", marginLeft: 2 }}>
                {activeFilters}
              </span>
            )}
          </button>
          {activeFilters > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--stone)" }} onClick={() => { setFilterCats([]); setFilterTiers([]); }}>
              <X size={13} /> Limpar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <input
            className="input"
            placeholder="Buscar veículo…"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            style={{ width: 220, padding: "8px 14px", fontSize: 13 }}
          />
        </div>

        {/* Tabela */}
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ ...thStyle("name"), width: "36%" }} onClick={() => handleSort("name")}>
                  {thInner("Veículo", "name")}
                </th>
                <th style={thStyle("cat")} onClick={() => handleSort("cat")}>
                  {thInner("Categoria", "cat")}
                </th>
                <th style={thStyle("tier")} onClick={() => handleSort("tier")}>
                  {thInner("Tier", "tier")}
                </th>
                <th style={{ ...thStyle("reach"), textAlign: "right" }} onClick={() => handleSort("reach")}>
                  {thInner("Alcance/mês", "reach", "right")}
                </th>
                <th style={{ ...thStyle("tokens"), textAlign: "right" }} onClick={() => handleSort("tokens")}>
                  {thInner("Créditos", "tokens", "right")}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map(v => {
                const tkn = TIER_TOKENS[v.tier] ?? 0;
                return (
                  <tr key={v.id}>
                    <td>
                      <div className="row" style={{ gap: 12 }}>
                        <div style={{ background: TIER_COLORS[v.tier] ?? v.color, width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, color: TIER_FG[v.tier] ?? "#fff", flex: "none" }}>
                          {initials(v.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{v.name}</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--stone)" }}>{v.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{v.cat}</td>
                    <td><span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span></td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{fmtReach(v.reach)}</td>
                    <td className="num" style={{ textAlign: "right" }}>
                      {tkn > 0
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>{tkn} <span style={{ color: "var(--coral)", fontSize: 13 }}>⚡</span></span>
                        : <span style={{ fontWeight: 700 }}>0</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 20px" }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)", padding: "0 8px" }}>
              {page} / {totalPages}
            </span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
          </div>
        )}
        <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 32 }}>
          {sorted.length} veículos encontrados · alcance combinado: {fmtReach(totalReach)}
        </p>
      </div>

      {showFilter && (
        <FilterModal
          cats={filterCats} tiers={filterTiers}
          onApply={(c, t) => { setFilterCats(c); setFilterTiers(t); setPage(1); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
