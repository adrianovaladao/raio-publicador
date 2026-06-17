"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW   = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Publicado", published: "Publicado",
  SCHEDULED: "Agendado",  scheduled: "Agendado",
  DRAFT:     "Rascunho",  draft:     "Rascunho",
};

function statusClass(s: string) {
  const l = s.toLowerCase();
  if (l === "published") return "published";
  if (l === "scheduled") return "scheduled";
  return "draft";
}

interface CalEvent { id: string; title: string; status: string }

function calKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export default function CalendarioPage() {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const TODAY = calKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [events, setEvents] = useState<Record<string, CalEvent[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/releases")
      .then(r => r.json())
      .then((releases: { id: string; title: string; status: string; scheduledAt?: string | null; publishedAt?: string | null; createdAt: string }[]) => {
        const map: Record<string, CalEvent[]> = {};
        for (const r of releases) {
          const dateStr = r.scheduledAt ?? r.publishedAt ?? r.createdAt;
          const d = new Date(dateStr);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          if (!map[key]) map[key] = [];
          map[key].push({ id: r.id, title: r.title, status: r.status });
        }
        setEvents(map);
      })
      .catch(() => setEvents({}))
      .finally(() => setLoading(false));
  }, []);

  const first   = new Date(y, m, 1);
  const lead    = (first.getDay() + 6) % 7;
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

  const monthPrefix = `${y}-${String(m + 1).padStart(2,"0")}`;
  const monthEvs = Object.entries(events).filter(([k]) => k.startsWith(monthPrefix));
  const scheduledCount = monthEvs.flatMap(([,v]) => v).filter(e => e.status.toLowerCase() === "scheduled").length;

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Planejamento</p>
            <h2>Calendário de <em>publicação</em></h2>
            <p className="sub">
              {loading
                ? "Carregando…"
                : `${scheduledCount} release${scheduledCount !== 1 ? "s" : ""} agendado${scheduledCount !== 1 ? "s" : ""} em ${MESES[m].toLowerCase()}.`}
            </p>
          </div>
          <div className="actions">
            <div className="chips">
              <span className="chip"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--blue)", display: "inline-block", marginRight: 4 }} />Agendado</span>
              <span className="chip"><i style={{ width: 9, height: 9, borderRadius: 3, background: "var(--coral)", display: "inline-block", marginRight: 4 }} />Rascunho</span>
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
            <button className="btn btn-ghost btn-sm" onClick={() => { setY(now.getFullYear()); setM(now.getMonth()); }}>Hoje</button>
          </div>

          <div className="cal-dow">
            {DOW.map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="cal-grid">
            {cells.map((c, i) => {
              const k = c.out ? null : calKey(y, m, c.d);
              const evs = k ? (events[k] ?? []) : [];
              const isToday = k === TODAY;
              return (
                <div key={i} className={`cal-cell${c.out ? " out" : ""}${isToday ? " today" : ""}`}>
                  <div className="dn">{c.d}</div>
                  {evs.slice(0, 2).map(e => (
                    <span key={e.id} className={`cal-event ${statusClass(e.status)}`} title={`${STATUS_LABEL[e.status] ?? e.status}: ${e.title}`}>
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
