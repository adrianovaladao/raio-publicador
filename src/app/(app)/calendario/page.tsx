"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Calendar, User, Tag, Image as ImageIcon, FileText, Tv, Zap } from "lucide-react";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

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

interface CalEvent {
  id: string;
  title: string;
  status: string;
  authorId?: string;
  imageUrl?: string | null;
  body?: string;
  creditsUsed?: number;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  summary?: string | null;
}

function calKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function wordCount(html: string) {
  return html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d.getDate()).padStart(2,"0")} ${meses[d.getMonth()]} ${d.getFullYear()} às ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function EventTooltip({ ev, anchorRef }: { ev: CalEvent; anchorRef: React.RefObject<HTMLSpanElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current || !ref.current) return;
    const a = anchorRef.current.getBoundingClientRect();
    const t = ref.current;
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = a.left + a.width / 2 - tw / 2;
    let top  = a.bottom + 8;

    if (left + tw > vw - 12) left = vw - tw - 12;
    if (left < 12) left = 12;
    if (top + th > vh - 12) top = a.top - th - 8;

    setPos({ top, left });
  }, [anchorRef]);

  const dateStr = ev.scheduledAt ?? ev.publishedAt ?? ev.createdAt ?? "";
  const words   = ev.body ? wordCount(ev.body) : 0;
  const images  = ev.imageUrl ? 1 : 0;

  return (
    <div ref={ref} style={{
      position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
      background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: "16px 18px", width: 260,
      pointerEvents: "none",
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 10, lineHeight: 1.3 }}>{ev.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {dateStr && (
          <Row icon={<Calendar size={13} />} label="Agendado para" value={fmtDateTime(dateStr)} />
        )}
        {ev.authorId && (
          <Row icon={<User size={13} />} label="Autor" value={ev.authorId} />
        )}
        <Row icon={<FileText size={13} />} label="Palavras" value={`${words}`} />
        <Row icon={<ImageIcon size={13} />} label="Imagens" value={`${images}`} />
        <Row icon={<Zap size={13} />} label="Créditos usados" value={`${ev.creditsUsed ?? 0}`} />
        <Row icon={<Tv size={13} />} label="Veículos" value="—" />
        <Row icon={<Tag size={13} />} label="Status" value={STATUS_LABEL[ev.status] ?? ev.status} />
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span style={{ color: "var(--stone)", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: "var(--stone)", flexShrink: 0, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500, textAlign: "right", flex: 1 }}>{value}</span>
    </div>
  );
}

function CalEventChip({ ev }: { ev: CalEvent }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <>
      <span
        ref={ref}
        className={`cal-event ${statusClass(ev.status)}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {ev.title}
      </span>
      {hovered && <EventTooltip ev={ev} anchorRef={ref} />}
    </>
  );
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
      .then((releases: CalEvent & { scheduledAt?: string | null; publishedAt?: string | null; createdAt: string }[]) => {
        const map: Record<string, CalEvent[]> = {};
        for (const r of releases) {
          const dateStr = r.scheduledAt ?? r.publishedAt ?? r.createdAt;
          const d = new Date(dateStr);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          if (!map[key]) map[key] = [];
          map[key].push(r);
        }
        setEvents(map);
      })
      .catch(() => setEvents({}))
      .finally(() => setLoading(false));
  }, []);

  const first   = new Date(y, m, 1);
  const lead    = first.getDay();
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
                    <CalEventChip key={e.id} ev={e} />
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
