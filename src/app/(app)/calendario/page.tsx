"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Calendar, User, Tag, Image as ImageIcon, FileText, Tv, Zap, X, ArrowRight } from "lucide-react";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Publicado", published: "Publicado",
  SCHEDULED: "Agendado",  scheduled: "Agendado",
  DRAFT:     "Rascunho",  draft:     "Rascunho",
};

const STATUS_DOT_COLOR: Record<string, string> = {
  published: "var(--green)",
  scheduled: "var(--blue)",
  draft:     "var(--coral)",
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
  authorName?: string;
  imageUrl?: string | null;
  body?: string;
  creditsUsed?: number;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  summary?: string | null;
  brand?: { name: string; color: string; logoUrl?: string | null } | null;
}

function calKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function wordCount(html: string) {
  return html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
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
      {ev.brand && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 10px", background: "var(--cream, #FAF9F7)", borderRadius: 8 }}>
          {ev.brand.logoUrl ? (
            <img src={ev.brand.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 6, background: ev.brand.color ?? "#212121", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{ev.brand.name}</span>
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 10, lineHeight: 1.3 }}>{ev.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {dateStr && (
          <Row icon={<Calendar size={13} />} label="Agendado para" value={fmtDateTime(dateStr)} />
        )}
        {ev.authorName && (
          <Row icon={<User size={13} />} label="Autor" value={ev.authorName} />
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

function DayModal({ date, evs, onClose }: { date: string; evs: CalEvent[]; onClose: () => void }) {
  const router = useRouter();
  const [d, mes, ano] = date.split("-").reverse().map(Number);
  const mesNome = MESES[mes - 1];

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 9998, display: "grid", placeItems: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 480, maxWidth: "calc(100vw - 32px)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", margin: "0 0 2px" }}>
              {mesNome} {ano}
            </p>
            <h3 style={{ margin: 0, fontFamily: "var(--sans)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>
              {d} de {mesNome}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)", padding: 6, borderRadius: 8, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Lista com rolagem */}
        <div style={{ overflowY: "auto", padding: "8px 12px 12px", maxHeight: "calc(80vh - 140px)" }}>
          {evs.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--stone)", fontSize: 14, padding: "32px 0" }}>Nenhum release neste dia.</p>
          ) : (
            evs.map(ev => (
              <div key={ev.id}
                onClick={() => { router.push(`/releases/${ev.id}`); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: 10, cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--cream)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Logo da marca */}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: ev.brand?.color ?? "var(--line)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {ev.brand?.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={ev.brand.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                        {ev.brand?.name?.slice(0, 2).toUpperCase() ?? "—"}
                      </span>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: STATUS_DOT_COLOR[statusClass(ev.status)] ?? "var(--stone)" }} />
                    {ev.brand && <span style={{ fontSize: 11, color: "var(--stone)" }}>{ev.brand.name}</span>}
                    {ev.authorName && <span style={{ fontSize: 11, color: "var(--stone)" }}>· {ev.authorName}</span>}
                  </div>
                </div>

                <ArrowRight size={14} color="var(--stone)" style={{ flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14 }}>
          {[["scheduled","var(--blue)","Agendado"],["published","var(--green)","Publicado"],["draft","var(--coral)","Rascunho"]].map(([,color,label]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--stone)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>
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
  // Mês de assinatura ativo = mês atual
  const PLAN_YEAR  = now.getFullYear();
  const PLAN_MONTH = now.getMonth();
  const [y, setY] = useState(PLAN_YEAR);
  const [m, setM] = useState(PLAN_MONTH);
  const TODAY = calKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [events, setEvents] = useState<Record<string, CalEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<{ key: string; evs: CalEvent[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/releases").then(r => r.json()),
      fetch("/api/team").then(r => r.json()),
    ])
      .then(([releases, team]: [
        (CalEvent & { scheduledAt?: string | null; publishedAt?: string | null; createdAt: string })[],
        { id: string; name: string }[]
      ]) => {
        const nameById: Record<string, string> = {};
        for (const m of team) nameById[m.id] = m.name;

        const map: Record<string, CalEvent[]> = {};
        for (const r of releases) {
          const dateStr = r.scheduledAt ?? r.publishedAt ?? r.createdAt;
          const d = new Date(dateStr);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          if (!map[key]) map[key] = [];
          map[key].push({ ...r, authorName: r.authorId ? (nameById[r.authorId] ?? r.authorId) : "—" });
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

  const isPlanMonth = y === PLAN_YEAR && m === PLAN_MONTH;

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
            {isPlanMonth
              ? <Link href="/releases/novo" className="btn btn-primary btn-sm"><Plus size={15} /> Agendar release</Link>
              : <button className="btn btn-primary btn-sm" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}><Plus size={15} /> Agendar release</button>
            }
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
              const col = i % 7;
              const isWeekend = col === 0 || col === 6;
              const isLocked = !isPlanMonth;
              const clickable = !c.out && !isWeekend && !isLocked && k;
              return (
                <div key={i}
                  className={`cal-cell${c.out ? " out" : ""}${isToday ? " today" : ""}${isLocked ? " locked" : ""}`}
                  style={{
                    backgroundColor: isLocked ? "var(--cream)" : isWeekend ? "#ECEAE5" : undefined,
                    cursor: clickable ? "pointer" : "default",
                    opacity: isLocked ? 0.5 : 1,
                    pointerEvents: isLocked ? "none" : undefined,
                  }}
                  onClick={() => { if (clickable) setSelectedDay({ key: k!, evs }); }}
                >
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

      {selectedDay && (
        <DayModal
          date={selectedDay.key}
          evs={selectedDay.evs}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
