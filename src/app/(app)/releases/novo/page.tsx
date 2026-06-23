"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft, ArrowRight, Check, ChevronDown,
  Image as ImageIcon, Rocket, Calendar, X, Search,
  List, LayoutGrid, Plus, Download, Upload, Cloud, CloudOff,
  SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { extractDominantColor } from "@/lib/color";
import { RichEditor } from "@/components/editor/RichEditor";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";

// ── Dados mock ──────────────────────────────────────────────────────────────

const VEHICLES = [
  { id: "v1", name: "Ge globo", domain: "ge.globo.com", cat: "Geral", uf: "—", tier: "A", reach: 203000000, tokens: 0, color: "#1A1A1A" },
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


const VEH_CATS_ALL  = ["Geral","Negócios","Tecnologia","Esportes","Economia","Saúde","Entretenimento","Política","Jurídico","Agronegócio"];
const VEH_TIERS_ALL = ["A","B","C","D","E"];
const PAGE_SIZE      = 25;
const TIER_TOKENS_MAP: Record<string, number> = { A: 250, B: 150, C: 100, D: 50, E: 0 };
const TIER_ORDER_MAP:  Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
const TIER_COLORS_MAP: Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017", D: "#3A7DC9", E: "#D0DFF0" };
const TIER_FG_MAP:     Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff",    D: "#fff",    E: "#3A5A80" };

type VehSortCol = "name" | "tier" | "reach" | "tokens";
type VehSortDir = "asc" | "desc";
const PLAN = { total: 5000, used: 3200 };


const BRAND_COLORS = ["#C25E00","#2A6FDB","#2F8A5B","#6D3BD9","#0E7C86","#B0322E","#8A6500","#1A1A1A"];
const BRAND_SEGMENTS = ["Franquias","Tecnologia","Saúde","Economia","Varejo","Negócios","Educação","Serviços","Indústria","Outro"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtReach(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const STEPS = ["Marca", "Conteúdo", "Veículos & créditos", "Revisão"];

// ── Passo 0: Marca ────────────────────────────────────────────────────────────

type Brand = { id: string; name: string; segment: string | null; color: string | null; logoUrl?: string | null; authors?: string[]; releases?: number; tone?: boolean };

function NewBrandModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: Brand) => void }) {
  const [name,    setName]    = useState("");
  const [segment, setSegment] = useState(BRAND_SEGMENTS[0]);
  const [color,   setColor]   = useState(BRAND_COLORS[0]);
  const [site,    setSite]    = useState("");
  const [contact, setContact] = useState("");
  const [desc,    setDesc]    = useState("");
  const [boiler,  setBoiler]  = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    const dominant = await extractDominantColor(file);
    setColor(dominant);
  }

  async function submit() {
    setSaving(true); setErr("");
    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        const form = new FormData();
        form.append("file", logoFile);
        const res  = await fetch("/api/upload", { method: "POST", body: form });
        const text = await res.text();
        let data: { url?: string } = {};
        try { data = JSON.parse(text); } catch { /* ignore */ }
        logoUrl = data.url ?? null;
      }
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), segment, color, site: site.trim() || null, contact: contact.trim() || null, description: desc.trim() || null, boilerplate: boiler.trim() || null, logoUrl }),
      });
      const text = await res.text();
      if (!res.ok) { setErr(`Erro ${res.status}`); return; }
      const nb: Brand = JSON.parse(text);
      onCreate(nb);
    } catch (e) { setErr(e instanceof Error ? e.message : "Falha de conexão."); }
    finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Cadastrar nova <em>marca</em></h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body">
          {/* Preview */}
          <div className="nb-preview">
            <div style={{ width: 40, height: 40, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
              {logoPreview
                ? <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "#fff" }}>{initials(name) || "?"}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
          </div>
          {/* Logo */}
          <div className="field">
            <label>Logotipo</label>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => fileRef.current?.click()} style={{ gap: 7 }}>
                <Upload size={14} /> {logoPreview ? "Trocar imagem" : "Adicionar logo"}
              </button>
              {logoPreview && (
                <button type="button" className="btn btn-quiet btn-sm" style={{ color: "var(--red,#c0392b)" }}
                  onClick={() => { setLogoPreview(""); setLogoFile(null); }}>
                  Remover
                </button>
              )}
            </div>
          </div>
          {/* Campos */}
          <div className="nb-grid2">
            <div className="field"><label>Nome da marca / cliente</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Franquia Sabor Brasil" autoFocus /></div>
            <div className="field">
              <label>Segmento / setor</label>
              <div className="select-wrap">
                <select className="input" value={segment} onChange={e => setSegment(e.target.value)}>
                  {BRAND_SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field"><label>Site</label><input className="input" value={site} onChange={e => setSite(e.target.value)} placeholder="www.exemplo.com.br" /></div>
            <div className="field"><label>Pessoa de contato</label><input className="input" value={contact} onChange={e => setContact(e.target.value)} placeholder="Nome do responsável" /></div>
          </div>
          <div className="field"><label>Descrição curta</label><textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Em uma frase, o que a marca faz." /></div>
          <div className="field"><label>Boilerplate · &ldquo;sobre a empresa&rdquo;</label><textarea className="input" rows={3} value={boiler} onChange={e => setBoiler(e.target.value)} placeholder={`A ${name || "marca"} é referência em ${segment.toLowerCase()}.`} /></div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Cor de identificação</label>
            <div className="nb-colors">
              {BRAND_COLORS.map(c => (
                <button key={c} className={`nb-color${color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} type="button">
                  {color === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 13, margin: "0 24px 12px", fontWeight: 500 }}>{err}</p>}
        <div className="m-foot" style={{ justifyContent: "flex-end" }}>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-sm" disabled={!name.trim() || saving} onClick={submit}>
              <Check size={15} /> {saving ? "Criando…" : "Criar marca"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBrand({ selected, onSelect, brands, onAddBrand }: {
  selected: Brand | null;
  onSelect: (b: Brand) => void;
  brands: Brand[];
  onAddBrand: (b: Brand) => void;
}) {
  const [mode, setMode] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = brands.filter(b =>
    !q.trim() || (b.name + b.segment).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="brand-pick">
      <div className="bp-head">
        <p className="eyebrow">Passo 1 · Marca</p>
        <h3>Para qual <em>marca</em> é este release?</h3>
        <p className="muted" style={{ fontSize: 14, maxWidth: "56ch" }}>
          O conteúdo, o tom de voz e os relatórios ficam vinculados à marca escolhida.
        </p>
      </div>

      {/* Toolbar igual à biblioteca */}
      <div className="toolbar">
        <div className="chips">
          <span className="chip active">Todas <span className="ct">{brands.length}</span></span>
        </div>
        <div className="spacer" />
        <input
          className="input"
          placeholder="Buscar marcas…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ width: 200, padding: "8px 14px", fontSize: 13 }}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova marca
        </button>
        <div className="seg">
          <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}><List size={15} /> Lista</button>
          <button className={mode === "grid" ? "active" : ""} onClick={() => setMode("grid")}><LayoutGrid size={15} /> Grade</button>
        </div>
      </div>

      {/* Grade — igual ao lib-grid dos releases */}
      {mode === "grid" && (
        <div className="lib-grid">
          {filtered.map(b => (
            <div
              key={b.id}
              className={`card lib-card${selected?.id === b.id ? " selected" : ""}`}
              style={{ cursor: "pointer", boxShadow: selected?.id === b.id ? "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)" : "none" }}
              onClick={() => onSelect(b)}
            >
              <div className="thumb" style={{ background: b.color ?? "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {b.logoUrl
                  ? <img src={b.logoUrl} alt={b.name} style={{ width: "60%", height: "60%", objectFit: "contain" }} />
                  : <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 32, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>{initials(b.name)}</span>
                }
                {selected?.id === b.id && (
                  <span style={{ position: "absolute", top: 10, right: 10, background: "var(--coral)", borderRadius: 99, width: 24, height: 24, display: "grid", placeItems: "center" }}>
                    <Check size={13} color="#fff" />
                  </span>
                )}
              </div>
              <div className="body">
                <h4>{b.name}</h4>
                <p className="ex" style={{ margin: "4px 0 0" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)" }}>{b.segment}</span>
                  {" · "}{b.releases} releases
                </p>
                <div className="foot" style={{ marginTop: 10 }} />
              </div>
            </div>
          ))}

          {/* Card "Nova marca" */}
          <div
            className="lib-card-new"
            onClick={() => setShowModal(true)}
          >
            <div className="lib-card-new-icon"><Plus size={22} /></div>
            <div className="lib-card-new-label">Nova marca</div>
            <div className="lib-card-new-sub">CADASTRAR CLIENTE</div>
          </div>
        </div>
      )}

      {/* Lista — igual ao tbl dos releases */}
      {mode === "list" && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Segmento</th>
                <th>Releases</th>
                <th>Tom de voz</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr
                  key={b.id}
                  style={{ cursor: "pointer", background: selected?.id === b.id ? "rgba(250,181,0,0.06)" : undefined }}
                  onClick={() => onSelect(b)}
                >
                  <td className="title-cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: b.color ?? "#1A1A1A", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, color: "#fff", flex: "none", overflow: "hidden" }}>
                      {b.logoUrl ? <img src={b.logoUrl} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : initials(b.name)}
                    </div>
                    {b.name}
                    {selected?.id === b.id && <Check size={14} color="var(--coral)" style={{ marginLeft: "auto" }} />}
                  </td>
                  <td className="muted">{b.segment}</td>
                  <td className="num">{b.releases}</td>
                  <td />
                </tr>
              ))}
              {/* Linha "Nova marca" */}
              <tr style={{ cursor: "pointer", background: "var(--cream)" }} onClick={() => setShowModal(true)}>
                <td style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--stone)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px dashed var(--sand)", display: "grid", placeItems: "center", flex: "none" }}>
                    <Plus size={14} color="var(--stone)" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Nova marca</span>
                </td>
                <td className="muted" style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cadastrar cliente</td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewBrandModal
          onClose={() => setShowModal(false)}
          onCreate={b => { onAddBrand(b); onSelect(b); setShowModal(false); }}
        />
      )}
    </div>
  );
}

// ── Passo 1: Conteúdo ────────────────────────────────────────────────────────

interface Content { title: string; subtitle: string; body: string; cat: string; author: string; imageUrl?: string }

function MediaCard({ imageUrl, onChange }: { imageUrl?: string; onChange: (url: string | undefined) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setErr("Apenas imagens JPG ou PNG."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Arquivo muito grande (máx. 5 MB)."); return; }
    // Valida dimensões antes de fazer upload
    const dims = await new Promise<{ w: number; h: number }>(res => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { res({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { res({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
      img.src = url;
    });
    if (dims.w < 1200 || dims.h < 630) {
      setErr(`Imagem muito pequena (${dims.w}×${dims.h}px). Mínimo: 1200×630px.`); return;
    }
    if (dims.w > 3600 || dims.h > 1890) {
      setErr(`Imagem muito grande (${dims.w}×${dims.h}px). Máximo: 3600×1890px.`); return;
    }
    setErr(""); setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(text); } catch { /* ignore */ }
      if (!res.ok || !data.url) { setErr(data.error ?? "Falha no upload."); return; }
      onChange(data.url);
    } catch { setErr("Falha de conexão."); }
    finally { setUploading(false); }
  }

  return (
    <div className="card side-card">
      <div className="card-head"><h3>Mídia</h3></div>
      <div className="sc-body">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        {imageUrl ? (
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Capa do release" style={{ width: "100%", borderRadius: 8, display: "block", maxHeight: 180, objectFit: "cover" }} />
            <button type="button" onClick={() => onChange(undefined)}
              style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", padding: "4px 8px", fontSize: 12 }}>
              Remover
            </button>
            <button type="button" className="btn btn-quiet btn-sm" style={{ marginTop: 8, width: "100%" }} onClick={() => fileRef.current?.click()}>
              Trocar imagem
            </button>
          </div>
        ) : (
          <div
            className={`attach${dragging ? " drag-over" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ cursor: "pointer" }}
          >
            {uploading
              ? <><ImageIcon size={22} /><div className="t">Enviando…</div></>
              : <><ImageIcon size={22} /><div className="t">Arraste imagens aqui</div><div className="h">JPG ou PNG · até 5 MB</div></>}
          </div>
        )}
        {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 12, margin: "6px 0 0" }}>{err}</p>}
      </div>
    </div>
  );
}

function StepContent({ content, setContent, brand, ownerName }: { content: Content; setContent: (c: Content) => void; brand: Brand | null; ownerName: string }) {
  const brandAuthors = brand?.authors ?? [];
  const authors = brandAuthors.length > 0 ? brandAuthors : [ownerName].filter(Boolean);
  const up = (k: keyof Content, v: string) => setContent({ ...content, [k]: v });
  const cats = VEH_CATS_ALL;

  return (
    <div className="composer-grid">
      <RichEditor
        title={content.title}
        onTitleChange={v => up("title", v)}
        subtitle={content.subtitle}
        onSubtitleChange={v => up("subtitle", v)}
        content={content.body}
        onContentChange={v => up("body", v)}
        brandName={brand?.name}
      />

      <div>
        <div className="card side-card">
          <div className="card-head"><h3>Detalhes</h3></div>
          <div className="sc-body">
            <div className="field-row">
              <label>Categoria</label>
              <div className="select-wrap">
                <select className="input" value={content.cat} onChange={e => up("cat", e.target.value)}>
                  {cats.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field-row">
              <label>Autor</label>
              <div className="select-wrap">
                <select className="input" value={content.author} onChange={e => up("author", e.target.value)}>
                  {authors.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        <MediaCard imageUrl={content.imageUrl} onChange={url => up("imageUrl", url ?? "")} />
      </div>
    </div>
  );
}

// ── Passo 2: Veículos ────────────────────────────────────────────────────────

function VehFilterModal({ cats, tiers, onApply, onClose }: {
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
              {VEH_CATS_ALL.map(c => (
                <button key={c} onClick={() => toggleCat(c)} className={`chip${selCats.includes(c) ? " active" : ""}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Tier</p>
            <div style={{ display: "flex", gap: 8 }}>
              {VEH_TIERS_ALL.map(t => (
                <button key={t} onClick={() => toggleTier(t)} className={`chip${selTiers.includes(t) ? " active" : ""}`}>Tier {t}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="m-foot" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelCats([]); setSelTiers([]); }}>Limpar filtros</button>
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

function VehSortIcon({ col, active, dir }: { col: string; active: string; dir: VehSortDir }) {
  if (col !== active) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: 3 }} />;
  return dir === "asc"
    ? <ArrowUp size={12} style={{ marginLeft: 3, color: "var(--coral-ink)" }} />
    : <ArrowDown size={12} style={{ marginLeft: 3, color: "var(--coral-ink)" }} />;
}

function sortVeh(arr: typeof VEHICLES, col: VehSortCol, dir: VehSortDir) {
  return [...arr].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (col === "tokens") { va = TIER_TOKENS_MAP[a.tier] ?? 0; vb = TIER_TOKENS_MAP[b.tier] ?? 0; }
    else if (col === "tier") { va = TIER_ORDER_MAP[a.tier] ?? 99; vb = TIER_ORDER_MAP[b.tier] ?? 99; }
    else if (col === "reach") { va = a.reach; vb = b.reach; }
    else { va = (a.name ?? "").toLowerCase(); vb = (b.name ?? "").toLowerCase(); }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function StepVehicles({ selected, setSelected }: { selected: string[]; setSelected: (s: string[]) => void }) {
  const [filterCats,  setFilterCats]  = useState<string[]>([]);
  const [filterTiers, setFilterTiers] = useState<string[]>([]);
  const [q,           setQ]           = useState("");
  const [page,        setPage]        = useState(1);
  const [sortCol,     setSortCol]     = useState<VehSortCol>("reach");
  const [sortDir,     setSortDir]     = useState<VehSortDir>("desc");
  const [showFilter,  setShowFilter]  = useState(false);

  const resetPage = () => setPage(1);

  function handleSort(col: VehSortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    resetPage();
  }

  const activeFilters = filterCats.length + filterTiers.length;

  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const remove = (id: string) => setSelected(selected.filter(x => x !== id));

  const baseFiltered = VEHICLES.filter(v =>
    (filterCats.length  === 0 || filterCats.includes(v.cat))  &&
    (filterTiers.length === 0 || filterTiers.includes(v.tier)) &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );
  const filtered   = sortVeh(baseFiltered, sortCol, sortDir);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const list       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + (TIER_TOKENS_MAP[v.tier] ?? 0), 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);
  const left        = PLAN.total - PLAN.used;
  const over        = selTokens > left;
  const usedPct     = (PLAN.used / PLAN.total) * 100;
  const nowPct      = Math.min((selTokens / PLAN.total) * 100, 100 - usedPct);

  const sortBtnStyle = (col: VehSortCol): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", background: "none", border: "none",
    cursor: "pointer", padding: "2px 4px", borderRadius: 4, fontSize: 11,
    fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase",
    color: sortCol === col ? "var(--coral-ink)" : "var(--stone)", fontWeight: sortCol === col ? 700 : 400,
  });

  return (
    <>
    <div className="veh-layout">
      {/* Lista */}
      <div className="card veh-list">
        <div className="vh-toolbar">
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
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--stone)" }} onClick={() => { setFilterCats([]); setFilterTiers([]); resetPage(); }}>
              <X size={13} /> Limpar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <div className="search">
            <Search size={16} />
            <input placeholder="Buscar veículo…" value={q} onChange={e => { setQ(e.target.value); resetPage(); }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", borderBottom: "1px solid var(--line)" }}>
          <span className="eyebrow">{filtered.length} veículos</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={sortBtnStyle("name")} onClick={() => handleSort("name")}>
              Nome <VehSortIcon col="name" active={sortCol} dir={sortDir} />
            </button>
            <button style={sortBtnStyle("tier")} onClick={() => handleSort("tier")}>
              Tier <VehSortIcon col="tier" active={sortCol} dir={sortDir} />
            </button>
            <button style={sortBtnStyle("reach")} onClick={() => handleSort("reach")}>
              Alcance <VehSortIcon col="reach" active={sortCol} dir={sortDir} />
            </button>
            <button style={sortBtnStyle("tokens")} onClick={() => handleSort("tokens")}>
              Créditos <VehSortIcon col="tokens" active={sortCol} dir={sortDir} />
            </button>
          </div>
          <button
            className="link"
            style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              const allIds = filtered.map(v => v.id);
              const allSel = allIds.every(id => selected.includes(id));
              setSelected(allSel ? selected.filter(id => !allIds.includes(id)) : [...new Set([...selected, ...allIds])]);
            }}
          >Sel. todos</button>
        </div>

        <div>
          {list.map(v => {
            const tkn = TIER_TOKENS_MAP[v.tier] ?? 0;
            return (
              <div key={v.id} className={`veh-row${selected.includes(v.id) ? " sel" : ""}`} onClick={() => toggle(v.id)}>
                <div className="cbx">{selected.includes(v.id) && <Check size={13} />}</div>
                <div className="logo" style={{ background: TIER_COLORS_MAP[v.tier] ?? v.color, color: TIER_FG_MAP[v.tier] ?? "#fff" }}>{initials(v.name)}</div>
                <div>
                  <div className="nm">{v.name}</div>
                  <div className="meta">
                    <span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span>
                    <span className="dom">{v.domain}</span>
                  </div>
                </div>
                <div className="reach">
                  <div className="n">{fmtReach(v.reach)}</div>
                  <div className="u">alcance/mês</div>
                </div>
                <div className="cost">
                  <span className="tk">{tkn}</span>
                  <span style={{ color: "var(--coral-ink)", fontSize: 16 }}>⚡</span>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)", padding: "0 8px" }}>
              {page} / {totalPages}
            </span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
          </div>
        )}
      </div>

      {/* Carrinho */}
      <div className="card cart">
        <div className="cart-head">
          <span className="lbl">Seleção atual</span>
          <div className="big">
            <span className="tk" style={{ color: over ? "var(--red)" : "var(--ink)" }}>{selTokens}</span>
            <span className="of">créditos</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{left.toLocaleString("pt-BR")} disponíveis no plano</div>
          <div className="meter">
            <i className="used" style={{ width: usedPct + "%" }} />
            <i className="now"  style={{ width: nowPct  + "%" }} />
          </div>
          <div className="meter-legend">
            <span><i style={{ background: "var(--ink)",   display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Já usados {PLAN.used.toLocaleString("pt-BR")}</span>
            <span><i style={{ background: "var(--coral)", display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Esta seleção {selTokens}</span>
          </div>
        </div>

        {selVehicles.length === 0 ? (
          <div className="cart-empty">Selecione veículos à esquerda para montar a distribuição.</div>
        ) : (
          <div className="sel-list scroll">
            {selVehicles.map(v => (
              <div className="sel-item" key={v.id}>
                <div style={{ background: TIER_COLORS_MAP[v.tier] ?? v.color, width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 9, fontFamily: "var(--mono)", fontWeight: 700, color: TIER_FG_MAP[v.tier] ?? "#fff", flex: "none" }}>{initials(v.name)}</div>
                <span className="nm">{v.name}</span>
                <span className="tk">{TIER_TOKENS_MAP[v.tier] ?? 0}</span>
                <button className="rm" onClick={() => remove(v.id)} title="Remover"><X size={15} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="cart-eoot">
          {over && (
            <div className="savings" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
              <span>Faltam <b>{(selTokens - left).toLocaleString("pt-BR")} créditos</b>. Remova veículos ou faça upgrade.</span>
            </div>
          )}
          {!over && selVehicles.length > 0 && (
            <div className="savings">
              <span>Tudo no seu plano. {selVehicles.length} veículo{selVehicles.length !== 1 ? "s" : ""} selecionado{selVehicles.length !== 1 ? "s" : ""}.</span>
            </div>
          )}
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <span className="muted" style={{ fontSize: 13 }}>Alcance somado</span>
            <span style={{ fontWeight: 700 }}>{fmtReach(selReach)}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="muted" style={{ fontSize: 13 }}>Veículos</span>
            <span style={{ fontWeight: 700 }}>{selVehicles.length}</span>
          </div>
        </div>
      </div>
    </div>

    {showFilter && (
      <VehFilterModal
        cats={filterCats} tiers={filterTiers}
        onApply={(c, t) => { setFilterCats(c); setFilterTiers(t); resetPage(); }}
        onClose={() => setShowFilter(false)}
      />
    )}
    </>
  );
}

// ── DatePicker customizado ───────────────────────────────────────────────────

const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW_SHORT  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// Feriados nacionais fixos (MM-DD) e variáveis por ano
function getBrHolidays(year: number): Set<string> {
  // Cálculo da Páscoa (algoritmo de Meeus/Jones/Butcher)
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const add = (d: Date, days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };

  const holidays = new Set<string>([
    `${year}-01-01`, // Confraternização Universal
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Dia do Trabalho
    `${year}-09-07`, // Independência do Brasil
    `${year}-10-12`, // Nossa Senhora Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-11-20`, // Consciência Negra
    `${year}-12-25`, // Natal
    fmt(add(easter, -48)), // Segunda de Carnaval
    fmt(add(easter, -47)), // Terça de Carnaval
    fmt(add(easter, -2)),  // Sexta-feira Santa
    fmt(easter),            // Páscoa
    fmt(add(easter, 60)),  // Corpus Christi
  ]);
  return holidays;
}

function isBlockedDate(key: string): boolean {
  const d = new Date(key + "T12:00:00");
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return true; // domingo ou sábado
  const holidays = getBrHolidays(d.getFullYear());
  return holidays.has(key);
}

function DatePicker({ value, onChange, minDate, maxDate }: {
  value: string;
  onChange: (d: string) => void;
  minDate: string;
  maxDate: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const parsed = value ? new Date(value + "T12:00:00") : new Date();
  const [viewY, setViewY] = useState(parsed.getFullYear());
  const [viewM, setViewM] = useState(parsed.getMonth());

  const fmtDisplay = (iso: string) => {
    const d = new Date(iso + "T12:00:00");
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  const closeOnOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [open, closeOnOutside]);

  const firstDay = new Date(viewY, viewM, 1);
  const lead = firstDay.getDay();
  const dim = new Date(viewY, viewM + 1, 0).getDate();
  const prevDim = new Date(viewY, viewM, 0).getDate();
  const cells: { d: number; out: boolean; key: string }[] = [];
  for (let i = 0; i < lead; i++) {
    const d = new Date(viewY, viewM - 1, prevDim - lead + 1 + i);
    cells.push({ d: d.getDate(), out: true, key: toKey(d) });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ d, out: false, key: toKey(new Date(viewY, viewM, d)) });
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(viewY, viewM + 1, cells.length - (lead + dim) + 1);
    cells.push({ d: d.getDate(), out: true, key: toKey(d) });
  }

  function shiftMonth(dir: number) {
    let nm = viewM + dir, ny = viewY;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setViewM(nm); setViewY(ny);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input"
        style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}
      >
        <span style={{ color: value ? "var(--ink)" : "var(--stone)" }}>
          {value ? fmtDisplay(value) : "Selecione uma data"}
        </span>
        <Calendar size={15} style={{ color: "var(--stone)", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 999,
          background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)", padding: 16, width: 280,
        }}>
          {/* cabeçalho mês/ano */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "var(--stone)" }}>
              <ArrowLeft size={14} />
            </button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
              {MESES_FULL[viewM]} {viewY}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "var(--stone)" }}>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* dias da semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DOW_SHORT.map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, paddingBottom: 6, color: i === 0 || i === 6 ? "#E0B0A0" : "var(--stone)" }}>{d}</div>
            ))}
          </div>

          {/* células */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((c, i) => {
              const blocked  = !c.out && isBlockedDate(c.key);
              const disabled = c.out || c.key < minDate || c.key > maxDate || blocked;
              const selected = c.key === value;
              const isToday  = c.key === toKey(new Date());
              const isWeekend = !c.out && (() => { const dow = new Date(c.key + "T12:00:00").getDay(); return dow === 0 || dow === 6; })();
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(c.key); setOpen(false); }}
                  title={blocked && !isWeekend ? "Feriado nacional" : isWeekend ? "Fim de semana" : undefined}
                  style={{
                    border: isToday && !selected ? "1.5px solid var(--ink)" : "1.5px solid transparent",
                    borderRadius: 8,
                    background: selected ? "var(--ink)" : "none",
                    color: selected ? "#fff" : (c.out || disabled) ? "var(--line)" : "var(--ink)",
                    fontSize: 12,
                    fontWeight: selected ? 700 : 400,
                    padding: "6px 0",
                    cursor: disabled ? "default" : "pointer",
                    textAlign: "center",
                    opacity: blocked && !c.out ? 0.35 : 1,
                  }}
                >
                  {c.d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Passo 3: Revisão ─────────────────────────────────────────────────────────

interface When { mode: "now" | "schedule"; date: string }

const BOILERPLATE = (brand: Brand | null) =>
  brand
    ? `Sobre ${brand.name}: referência no segmento de ${(brand.segment ?? "").toLowerCase()}, com atuação nacional e foco em inovação e proximidade com o cliente.`
    : "";

async function downloadDocx(content: Content, selVehicles: typeof VEHICLES, brand: Brand | null) {
  const brandName = brand?.name ?? "Marca";
  const slug = content.title.slice(0, 40).replace(/\s+/g, "-").toLowerCase() || "release";

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 24 } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      children: [
        // Cabeçalho — marca
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: brandName.toUpperCase(), bold: true, size: 18, color: "848484", font: "Calibri" }),
            new TextRun({ text: `  ·  ${content.cat}`, size: 18, color: "848484", font: "Calibri" }),
          ],
        }),

        // Título
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 160 },
          children: [new TextRun({ text: content.title || "Título do release", bold: true, size: 52, font: "Calibri" })],
        }),

        // Subtítulo
        ...(content.subtitle ? [new Paragraph({
          spacing: { after: 320 },
          children: [new TextRun({ text: content.subtitle, italics: true, size: 30, color: "555555", font: "Calibri" })],
        })] : []),

        // Divisor
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
          spacing: { after: 320 },
          children: [],
        }),

        // Corpo
        ...content.body.split("\n").filter(Boolean).map(line =>
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: line, size: 24, font: "Calibri" })],
            alignment: AlignmentType.JUSTIFIED,
          })
        ),

        // Boilerplate
        ...(brand ? [
          new Paragraph({ spacing: { after: 120, before: 400 }, children: [] }),
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 160 },
            children: [new TextRun({ text: "SOBRE A EMPRESA", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          new Paragraph({
            spacing: { after: 320 },
            children: [new TextRun({ text: BOILERPLATE(brand), size: 22, color: "555555", font: "Calibri" })],
          }),
        ] : []),

        // Veículos
        ...(selVehicles.length > 0 ? [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 160 },
            children: [new TextRun({ text: "VEÍCULOS SELECIONADOS", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Veículo", "Editoria", "UF", "Tier", "Alcance"].map(h =>
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: "F1F0EC" },
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri" })] })],
                  })
                ),
              }),
              ...selVehicles.map(v =>
                new TableRow({
                  children: [
                    v.name, v.cat, v.uf, v.tier, fmtReach(v.reach),
                  ].map(val =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: val, size: 18, font: "Calibri" })] })],
                    })
                  ),
                })
              ),
            ],
          }),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug}.docx`);
}

function StepReview({ content, selected, when, setWhen, brand, onSaveDraft }: {
  content: Content; selected: string[]; when: When; setWhen: (w: When) => void; brand: Brand | null;
  onSaveDraft: () => Promise<void>;
}) {
  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="composer-grid">
      <div className="card">
        <div className="card-head">
          <h3>Pré-visualização do <em>release</em></h3>
          <div className="row" style={{ gap: 10 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => downloadDocx(content, selVehicles, brand)}
              title="Baixar como Word"
            >
              <Download size={14} /> Baixar .docx
            </button>
          </div>
        </div>
        <div className="card-pad">
          {brand && (
            <div className="review-brand">
              <span className="bc-av" style={{ background: brand.color ?? "#1A1A1A", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : initials(brand.name)}
              </span>
              <div className="bc-meta">
                <span className="bc-lbl">Marca</span>
                <span className="bc-nm">{brand.name}</span>
              </div>
            </div>
          )}
          <p className="eyebrow" style={{ marginBottom: 14 }}>{content.cat} · {content.author}</p>
          <h2 style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.025em", lineHeight: 1.12, margin: "0 0 10px" }}>
            {content.title || "Título do release"}
          </h2>
          <p className="serif-it" style={{ fontSize: 18, color: "var(--ink-soft)", margin: "0 0 18px" }}>
            {content.subtitle || "Subtítulo / linha de apoio do release."}
          </p>
          {content.body
            ? <div className="tiptap-preview" style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.body }} />
            : <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7 }}>O corpo do release aparece aqui exatamente como será distribuído aos veículos selecionados.</p>
          }
        </div>
      </div>

      <div>
        <div className="card side-card">
          <div className="card-head"><h3>Distribuição</h3></div>
          <div className="sc-body">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Veículos</span><span style={{ fontWeight: 700 }}>{selVehicles.length}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Alcance estimado</span><span style={{ fontWeight: 700 }}>{fmtReach(selReach)}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 13 }}>Créditos</span>
              <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>{selTokens} <span style={{ color: "var(--coral)", fontSize: 14 }}>⚡</span></span>
            </div>
          </div>
        </div>

        <div className="card side-card">
          <div className="card-head"><h3>Quando publicar</h3></div>
          <div className="sc-body">
            {when.mode === "schedule" && (() => {
              const today = new Date();
              const minDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
              const lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
              const maxDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
              return (
                <div className="field-row" style={{ marginBottom: 0 }}>
                  <label>Data</label>
                  <DatePicker value={when.date} onChange={d => setWhen({ ...when, date: d })} minDate={minDate} maxDate={maxDate} />
                </div>
              );
            })()}
          </div>
        </div>

        <SaveDraftButton onSave={onSaveDraft} />
      </div>
    </div>
  );
}

function SaveDraftButton({ onSave }: { onSave: () => Promise<void> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
      disabled={saving}
      onClick={async () => {
        setSaving(true);
        await onSave();
        router.push("/releases");
      }}
    >
      {saving ? "Salvando…" : "Salvar rascunho e fechar"}
    </button>
  );
}

// ── Página raiz ───────────────────────────────────────────────────────────────

export default function NovoReleasePage() {
  const router  = useRouter();
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    fetch("/api/team")
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { if (data[0]) setOwnerName(data[0].name); })
      .catch(() => {});
  }, []);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [content, setContent] = useState<Content>({ title: "", subtitle: "", body: "", cat: "Negócios", author: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()+1).padStart(2,"0")}`;
  const [when, setWhen] = useState<When>({ mode: "schedule", date: defaultDate });
  const [submitting, setSubmitting] = useState(false);

  // ── Autosave ─────────────────────────────────────────────────────────────
  const draftIdRef  = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null);

  const contentRef  = useRef(content);
  const brandRef    = useRef(brand);
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { brandRef.current   = brand;   }, [brand]);

  async function autosave() {
    const c = contentRef.current;
    const b = brandRef.current;
    if (!b || !c.title.trim()) return;
    setSaveStatus("saving");
    try {
      const payload = {
        title:   c.title,
        body:    c.body,
        summary: c.subtitle,
        status:  "DRAFT",
        scheduledAt: null,
        brandId: b.id,
        creditsUsed: 0,
        imageUrl: c.imageUrl || null,
      };
      if (draftIdRef.current) {
        await fetch(`/api/releases/${draftIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res  = await fetch("/api/releases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as { id: string };
        draftIdRef.current = data.id;
      }
      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch {
      setSaveStatus("error");
    }
  }

  useEffect(() => {
    const id = setInterval(autosave, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/brands")
      .then(r => r.json())
      .then((data: unknown) => {
        setBrands(Array.isArray(data) ? (data as Brand[]) : []);
      })
      .catch(() => setBrands([]));
  }, []);

  const last = STEPS.length - 1;

  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const over        = selTokens > (PLAN.total - PLAN.used);

  const canNext =
    step === 0 ? !!brand :
    step === 1 ? content.title.trim().length > 0 :
    step === 2 ? (selected.length > 0 && !over) :
    true;

  // ── Tela de sucesso ───────────────────────────────────────────────────────
  if (done) {
    const scheduled = when.mode === "schedule";
    const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
    const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);
    return (
      <div className="content scroll">
        <div className="content-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>
            {/* Ícone */}
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: scheduled ? "var(--amber-soft)" : "var(--green-soft)", display: "grid", placeItems: "center", margin: "0 auto 28px" }}>
              {scheduled
                ? <Calendar size={32} color="var(--coral-ink)" />
                : <Rocket size={32} color="var(--green)" />}
            </div>

            {/* Título */}
            <h2 style={{ fontFamily: "var(--sans)", fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
              {scheduled ? "Release agendado!" : "Release publicado!"}
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 32px" }}>
              {scheduled
                ? <>O release <strong style={{ color: "var(--ink)" }}>&ldquo;{content.title}&rdquo;</strong> será enviado em {when.date.split("-").reverse().join("/")} para <strong style={{ color: "var(--ink)" }}>{selVehicles.length} veículos</strong>.</>
                : <>O release <strong style={{ color: "var(--ink)" }}>&ldquo;{content.title}&rdquo;</strong> está sendo distribuído agora para <strong style={{ color: "var(--ink)" }}>{selVehicles.length} veículos</strong>, com alcance estimado de <strong style={{ color: "var(--ink)" }}>{fmtReach(selReach)}</strong>.</>}
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 36 }}>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Veículos</div>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>{selVehicles.length}</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Alcance</div>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>{fmtReach(selReach)}</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Marca</div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", marginTop: 6 }}>{brand?.name ?? "—"}</div>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => router.push("/releases")}>
                Ver biblioteca
              </button>
              <button className="btn btn-ghost" onClick={() => router.push("/calendario")}>
                <Calendar size={15} /> Ver calendário
              </button>
              <button className="btn btn-dark" onClick={() => router.push("/dashboard")}>
                Ir para o dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content scroll">
      <div className="content-inner">
        {/* Stepper + ações */}
        <div className="page-head" style={{ marginBottom: 28 }}>
          <div className="steps">
            {STEPS.map((s, i) => (
              <span key={s} style={{ display: "contents" }}>
                {i > 0 && <span className={`bar${i <= step ? " done" : ""}`} />}
                <div
                  className={`step${i === step ? " active" : i < step ? " done" : ""}`}
                  onClick={() => i < step && setStep(i)}
                  style={{ cursor: i < step ? "pointer" : "default" }}
                >
                  <span className="n">{i < step ? <Check size={13} /> : i + 1}</span>
                  <span className="lbl">{s}</span>
                </div>
              </span>
            ))}
          </div>
          <div className="actions" style={{ alignItems: "center" }}>
            {content.title.trim() && content.subtitle.trim() && (
              <span className="badge-status review">Rascunho</span>
            )}
            <button className="btn btn-quiet btn-sm" onClick={() => router.back()}>Cancelar</button>
            {/* Indicador de autosave */}
            {saveStatus !== "idle" && (
              <span style={{ fontSize: 12, color: saveStatus === "error" ? "var(--coral)" : "var(--stone)", display: "flex", alignItems: "center", gap: 5 }}>
                {saveStatus === "saving" && <><Cloud size={13} style={{ opacity: 0.6 }} /> Salvando…</>}
                {saveStatus === "saved"  && <><Cloud size={13} /> Salvo {lastSaved ? `às ${String(lastSaved.getHours()).padStart(2,"0")}:${String(lastSaved.getMinutes()).padStart(2,"0")}` : ""}</>}
                {saveStatus === "error"  && <><CloudOff size={13} /> Erro ao salvar</>}
              </span>
            )}
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            {step < last ? (
              <button className="btn btn-dark" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={submitting} onClick={async () => {
                if (!brand) return;
                setSubmitting(true);
                try {
                  const scheduledAt = when.date
                    ? new Date(`${when.date}T09:00:00`).toISOString()
                    : null;
                  const status = "SCHEDULED";
                  const payload = {
                    title: content.title,
                    body: content.body,
                    summary: content.subtitle,
                    status,
                    scheduledAt,
                    brandId: brand.id,
                    creditsUsed: 0,
                    imageUrl: content.imageUrl || null,
                  };
                  let res: Response;
                  if (draftIdRef.current) {
                    res = await fetch(`/api/releases/${draftIdRef.current}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                  } else {
                    res = await fetch("/api/releases", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                  }
                  if (!res.ok) throw new Error("Falha ao salvar");
                  setDone(true);
                } catch {
                  alert("Erro ao salvar release. Tente novamente.");
                } finally {
                  setSubmitting(false);
                }
              }}>
                {submitting ? "Salvando…" : <><Calendar size={16} /> Agendar release</>}
              </button>
            )}
          </div>
        </div>

        {step === 0 && <StepBrand selected={brand} onSelect={setBrand} brands={brands} onAddBrand={b => setBrands(prev => [...prev, b])} />}
        {step === 1 && <StepContent content={content} setContent={setContent} brand={brand} ownerName={ownerName} />}
        {step === 2 && <StepVehicles selected={selected} setSelected={setSelected} />}
        {step === 3 && <StepReview content={content} selected={selected} when={when} setWhen={setWhen} brand={brand} onSaveDraft={autosave} />}
      </div>
    </div>
  );
}
