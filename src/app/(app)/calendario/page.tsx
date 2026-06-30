"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, X, ArrowRight } from "lucide-react";

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
  return (
    <span className={`cal-event ${statusClass(ev.status)}`}>
      {ev.title}
    </span>
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

  const prevY = m === 0 ? y - 1 : y, prevM = m === 0 ? 11 : m - 1;
  const nextY = m === 11 ? y + 1 : y, nextM = m === 11 ? 0 : m + 1;
  const cells: { d: number; out: boolean; key: string }[] = [];
  for (let i = 0; i < lead; i++) {
    const d = prevDim - lead + 1 + i;
    cells.push({ d, out: true, key: calKey(prevY, prevM, d) });
  }
  for (let d = 1; d <= dim; d++) cells.push({ d, out: false, key: calKey(y, m, d) });
  let trail = 1;
  while (cells.length % 7 !== 0) { cells.push({ d: trail, out: true, key: calKey(nextY, nextM, trail) }); trail++; }

  const renewalKey = calKey(PLAN_YEAR, PLAN_MONTH + 1, 1);

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

  // Plano: mês corrente, renovação no 1º dia do próximo mês
  const planEnd      = new Date(PLAN_YEAR, PLAN_MONTH + 1, 1);
  const daysLeft     = Math.max(0, Math.ceil((planEnd.getTime() - now.setHours(0,0,0,0)) / 86400000));
  const renewalLabel = planEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const totalDays    = new Date(PLAN_YEAR, PLAN_MONTH + 1, 0).getDate();
  const usedDays     = totalDays - daysLeft;

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

        {/* Barra de plano */}
        <div style={{ display: "flex", alignItems: "center", gap: 40, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 24px", marginBottom: 16 }}>
          <div style={{ width: 280, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)" }}>Dias utilizados</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--stone)" }}>{usedDays} / {totalDays} dias</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: "var(--line)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, background: "var(--coral)", width: `${Math.round((usedDays / totalDays) * 100)}%`, transition: "width 0.4s" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 2 }}>Dias restantes</div>
              <div style={{ fontWeight: 700, fontSize: 20, fontFamily: "var(--sans)", letterSpacing: "-0.02em", color: daysLeft <= 5 ? "var(--red)" : "var(--ink)" }}>{daysLeft}</div>
            </div>
            <div style={{ width: 1, height: 36, background: "var(--line)" }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 2 }}>Renovação</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{renewalLabel}</div>
            </div>
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
              const k = c.key;
              const evs = !c.out ? (events[k] ?? []) : [];
              const isToday = k === TODAY;
              const isRenewal = k === renewalKey;
              const col = i % 7;
              const isWeekend = col === 0 || col === 6;
              const isLocked = !isPlanMonth;
              const clickable = !c.out && !isWeekend && !isLocked;
              return (
                <div key={i}
                  className={`cal-cell${c.out ? " out" : ""}${isToday ? " today" : ""}${isLocked ? " locked" : ""}`}
                  style={{
                    backgroundColor: isLocked ? "var(--cream)" : isWeekend ? "#ECEAE5" : undefined,
                    cursor: clickable ? "pointer" : "default",
                    opacity: isLocked ? 0.5 : 1,
                    pointerEvents: isLocked ? "none" : undefined,
                    position: "relative",
                  }}
                  onClick={() => { if (clickable) setSelectedDay({ key: k, evs }); }}
                >
                  <div className="dn" style={isRenewal ? { color: "var(--coral-ink)", fontWeight: 700 } : undefined}>{c.d}</div>
                  {isRenewal && (
                    <div style={{ position: "absolute", top: 6, right: 8, fontSize: 9, fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--coral-ink)", background: "color-mix(in srgb, var(--coral) 12%, transparent)", borderRadius: 4, padding: "2px 5px", lineHeight: 1.4 }}>
                      renovação
                    </div>
                  )}
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
