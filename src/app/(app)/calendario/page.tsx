"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW   = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const TODAY = "2026-06-15";

const CAL_EVENTS: Record<string, { id: string; title: string; status: string }[]> = {
  "2026-06-03": [{ id: "r5", title: "Pesquisa franquias +23%",        status: "review" }],
  "2026-06-05": [{ id: "r2", title: "Fintech capta R$ 45 mi",         status: "scheduled" }],
  "2026-06-09": [{ id: "x1", title: "Balanço trimestral cliente X",   status: "scheduled" }],
  "2026-06-11": [{ id: "r4", title: "Startup logística no Sul",        status: "scheduled" }],
  "2026-06-12": [{ id: "x2", title: "Nota — nova diretoria",          status: "review" }],
  "2026-06-15": [{ id: "x0", title: "Relatório de impacto Q2",        status: "review" }],
  "2026-06-18": [{ id: "r9", title: "Shoppings R$ 1,2 bi",            status: "scheduled" }],
  "2026-06-23": [{ id: "x3", title: "Lançamento app cliente Y",       status: "scheduled" }],
  "2026-06-25": [{ id: "x4", title: "Release resultados 1S",          status: "scheduled" }, { id: "x5", title: "Pauta ESG", status: "review" }],
  "2026-05-28": [{ id: "r1", title: "Expansão 120 franquias",         status: "published" }],
  "2026-05-30": [{ id: "x6", title: "Nota institucional",             status: "published" }],
};

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado", scheduled: "Agendado", draft: "Rascunho", review: "Em revisão",
};

function calKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export default function CalendarioPage() {
  const [y, setY] = useState(2026);
  const [m, setM] = useState(5); // junho (0-indexed)

  const first   = new Date(y, m, 1);
  const lead    = (first.getDay() + 6) % 7; // seg=0
  const dim     = new Date(y, m + 1, 0).getDate();
  const prevDim = new Date(y, m, 0).getDate();

  const cells: { d: number; out: boolean }[] = [];
  for (let i = 0; i < lead; i++) cells.push({ d: prevDim - lead + 1 + i, out: true });
  for (let d = 1; d <= dim; d++) cells.push({ d, out: false });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - (lead + dim) + 1, out: true });

  function shift(dir: number) {
    let nm = m + dir, ny = y;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setM(nm); setY(ny);
  }

  const monthEvs = Object.entries(CAL_EVENTS).filter(([k]) => k.startsWith(`${y}-${String(m + 1).padStart(2,"0")}`));
  const scheduledCount = monthEvs.flatMap(([,v]) => v).filter(e => e.status === "scheduled").length;

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Planejamento</p>
            <h2>Calendário de <em>publicação</em></h2>
            <p className="sub">{scheduledCount} release{scheduledCount !== 1 ? "s" : ""} agendado{scheduledCount !== 1 ? "s" : ""} em {MESES[m].toLowerCase()}. Clique em um evento para abrir o release.</p>
          </div>
          <div className="actions">
            <div className="chips">
              <span className="chip"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--blue)", display: "inline-block", marginRight: 4 }} />Agendado</span>
              <span className="chip"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--coral)", display: "inline-block", marginRight: 4 }} />Em revisão</span>
              <span className="chip"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--green)", display: "inline-block", marginRight: 4 }} />Publicado</span>
            </div>
            <Link href="/releases/novo" className="btn btn-primary btn-sm">
              <Plus size={15} /> Agendar release
            </Link>
          </div>
        </div>

        <div className="card cal">
          <div className="cal-head">
            <div className="mo"><em>{MESES[m]}</em> {y}</div>
            <div className="cal-nav">
              <button onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
              <button onClick={() => shift(1)}><ChevronRight size={16} /></button>
            </div>
            <div style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => { setY(2026); setM(5); }}>Hoje</button>
          </div>

          <div className="cal-dow">
            {DOW.map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="cal-grid">
            {cells.map((c, i) => {
              const k = c.out ? null : calKey(y, m, c.d);
              const evs = k ? (CAL_EVENTS[k] ?? []) : [];
              const isToday = k === TODAY;
              return (
                <div key={i} className={`cal-cell${c.out ? " out" : ""}${isToday ? " today" : ""}`}>
                  <div className="dn">{c.d}</div>
                  {evs.slice(0, 2).map(e => (
                    <span key={e.id} className={`cal-event ${e.status}`} title={`${STATUS_LABEL[e.status]}: ${e.title}`}>
                      {e.title}
                    </span>
                  ))}
                  {evs.length > 2 && <div className="cal-more">+{evs.length - 2} mais</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
