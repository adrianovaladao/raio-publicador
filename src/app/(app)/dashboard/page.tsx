"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  TrendingUp,
  TrendingDown,
  Send,
  Eye,
  Newspaper,
  Zap,
  ChevronDown,
  Check,
} from "lucide-react";

// ── BrandSwitcher local ──────────────────────────────────────────────────────

const BRANDS = [
  { id: "b1", name: "Franquia Sabor Brasil", segment: "Franquias",  color: "#C25E00" },
  { id: "b2", name: "TechNova Sistemas",     segment: "Tecnologia", color: "#2A6FDB" },
  { id: "b3", name: "Rede Bem Estar",        segment: "Saúde",      color: "#2F8A5B" },
];

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function DashBrandSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(BRANDS[0]);
  return (
    <div className="tb-brandsel" style={{ position: "relative" }}>
      <button className="tbb-btn" onClick={() => setOpen(o => !o)}>
        <span className="tbb-av" style={{ background: active.color }}>{getInitials(active.name)}</span>
        <span className="tbb-meta">
          <span className="tbb-lbl">Marca ativa</span>
          <span className="tbb-nm">{active.name}</span>
        </span>
        <ChevronDown size={15} className={`tbb-chev${open ? " open" : ""}`} />
      </button>
      {open && (
        <>
          <div className="tbb-backdrop" onClick={() => setOpen(false)} />
          <div className="tbb-menu">
            <div className="tbb-menu-label">Trocar de marca</div>
            {BRANDS.map(b => (
              <button key={b.id} className={`tbb-opt${b.id === active.id ? " on" : ""}`}
                onClick={() => { setActive(b); setOpen(false); }}>
                <span className="tbb-av" style={{ background: b.color }}>{getInitials(b.name)}</span>
                <span className="tbb-opt-meta">
                  <span className="tbb-nm">{b.name}</span>
                  <span className="tbb-sg">{b.segment}</span>
                </span>
                {b.id === active.id && <Check size={15} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Dados mock ──────────────────────────────────────────────────────────────

const KPIS = [
  { id: "k1", icon: Send,      label: "Releases publicados", val: "42",    suffix: "",    delta: +18, period: "vs. mês anterior", accent: true },
  { id: "k2", icon: Eye,       label: "Alcance estimado",    val: "64,2",  suffix: " mi", delta: +24, period: "vs. mês anterior" },
  { id: "k3", icon: Newspaper, label: "Veículos ativos",     val: "318",   suffix: "",    delta: +9,  period: "de centenas na rede" },
  { id: "k4", icon: Zap,       label: "Créditos restantes",  val: "1.800", suffix: "",    delta: -36, period: "de 5.000 do plano" },
];


const TOP_VEHICLES = [
  { id: "v1",  name: "Capital Econômica",   meta: "18 releases", n: "14,2", color: "#1A1A1A" },
  { id: "v16", name: "Jornal Metrópole",    meta: "15 releases", n: "11,8", color: "#0E1A2B" },
  { id: "v2",  name: "Portal Mercado Hoje", meta: "12 releases", n: "9,4",  color: "#2A6FDB" },
  { id: "v3",  name: "Diário Nacional",     meta: "11 releases", n: "8,1",  color: "#C2452E" },
  { id: "v7",  name: "Gazeta do Investidor",meta: "9 releases",  n: "5,7",  color: "#0E7C86" },
];

const RELEASES = [
  { id: "r1", title: "Rede de franquias de alimentação anuncia expansão de 120 unidades em 2026", cat: "Franquias", author: "Liliane Pires",   status: "published", date: "2026-05-28", vehicles: 18, reach: 12400000 },
  { id: "r2", title: "Fintech de crédito para PMEs capta R$ 45 milhões em rodada Série A",        cat: "Negócios",  author: "Analina Arouche", status: "scheduled", date: "2026-06-05", vehicles: 12, reach: 0 },
  { id: "r3", title: "Varejista lança programa de logística reversa em 200 lojas",                 cat: "Varejo",    author: "Daiana Napoleão", status: "published", date: "2026-05-21", vehicles: 9,  reach: 6300000 },
  { id: "r6", title: "Indústria de bebidas inaugura fábrica carbono neutro no interior de SP",     cat: "Negócios",  author: "Daiana Napoleão", status: "published", date: "2026-05-14", vehicles: 15, reach: 9800000 },
  { id: "r9", title: "Grupo de shoppings anuncia R$ 1,2 bi em investimentos para 2026",            cat: "Economia",  author: "Daiana Napoleão", status: "scheduled", date: "2026-06-18", vehicles: 14, reach: 0 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d).padStart(2,"0")} ${meses[m - 1]} ${y}`;
}

function fmtReach(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  scheduled: "Agendado",
  draft: "Rascunho",
  review: "Em revisão",
};

// ── Sub-componentes ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge-status ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

function KpiCard({ k }: { k: typeof KPIS[number] }) {
  const up = k.delta >= 0;
  const Icon = k.icon;
  return (
    <div className={`card kpi${k.accent ? " accent" : ""}`}>
      <div className="ic"><Icon size={19} /></div>
      <div className="lbl">{k.label}</div>
      <div className="val">{k.val}{k.suffix && <small>{k.suffix}</small>}</div>
      <div className={`delta ${up ? "up" : "down"}`}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {up ? "+" : ""}{k.delta}% <span className="muted">· {k.period}</span>
      </div>
    </div>
  );
}

function PerformanceDonut() {
  const data = TOP_VEHICLES.map(v => ({ ...v, value: parseFloat(v.n.replace(",", ".")) }));
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 70, C = 2 * Math.PI * r;
  let acc = 0;
  const segs = data.map(d => {
    const frac = d.value / total;
    const len = frac * C;
    const seg = { ...d, frac, len, offset: -acc };
    acc += len;
    return seg;
  });
  // top5pct reserved for future dynamic calculation
  return (
    <div className="card">
      <div className="card-head">
        <h3>Distribuição de releases por <em>veículo</em></h3>
        <span className="eyebrow">Top 5 · alcance entregue</span>
      </div>
      <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 180, height: 180, flex: "none" }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <g transform="rotate(-90 90 90)">
              <circle cx="90" cy="90" r={r} fill="none" stroke="var(--cream)" strokeWidth="22" />
              {segs.map(s => (
                <circle key={s.id} cx="90" cy="90" r={r} fill="none" stroke={s.color} strokeWidth="22"
                  strokeDasharray={`${Math.max(s.len - 2, 0)} ${C - Math.max(s.len - 2, 0)}`}
                  strokeDashoffset={s.offset} strokeLinecap="butt" />
              ))}
            </g>
            <text x="90" y="86" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 30, letterSpacing: "-0.03em", fill: "var(--ink)" }}>{total.toFixed(1).replace(".", ",")}</text>
            <text x="90" y="108" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.14em", fill: "var(--stone)" }}>MILHÕES</text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {segs.map(s => (
            <div className="row" key={s.id} style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div className="row" style={{ gap: 10, minWidth: 0 }}>
                <i style={{ width: 11, height: 11, borderRadius: 3, background: s.color, flex: "none" }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)", width: 38, textAlign: "right", fontWeight: 600 }}>{Math.round(s.frac * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "14px 22px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="muted" style={{ fontSize: 13 }}>Top 5 veículos concentram</span>
        <span style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>77% do alcance do período</span>
      </div>
    </div>
  );
}

function TopVehicles() {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Veículos com maior <em>entrega</em></h3>
        <a href="/veiculos" className="link">Ver todos</a>
      </div>
      <div className="rank">
        {TOP_VEHICLES.map(v => (
          <div className="rank-row" key={v.id}>
            <div className="logo" style={{ background: v.color }}>{initials(v.name)}</div>
            <div>
              <div className="nm">{v.name}</div>
              <div className="meta">{v.meta}</div>
            </div>
            <div className="val">
              <div className="n">{v.n} <span style={{ fontSize: 11, color: "var(--stone)", fontWeight: 400 }}>mi</span></div>
              <div className="u">alcance</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName ?? "Usuário";

  return (
    <div className="content scroll">
      <div className="content-inner">
        {/* Cabeçalho */}
        <div className="page-head">
          <div>
            <p className="eyebrow">Painel · Markable</p>
            <h2>Olá, {firstName} 👋</h2>
            <p className="sub">
              Os releases de <b style={{ color: "var(--ink)" }}>sua marca</b> alcançaram{" "}
              <b style={{ color: "var(--ink)" }}>64,2 milhões</b> de pessoas neste mês — 24% acima do anterior.
            </p>
          </div>
          <div className="actions">
            <DashBrandSwitcher />
          </div>
        </div>


        {/* KPIs */}
        <div className="kpi-grid">
          {KPIS.map(k => <KpiCard k={k} key={k.id} />)}
        </div>

        {/* Gráfico + ranking */}
        <div className="dash-2col">
          <PerformanceDonut />
          <TopVehicles />
        </div>

        {/* Atividade recente */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-head">
            <h3>Atividade <em>recente</em></h3>
            <a href="/releases" className="link">Abrir biblioteca</a>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "44%" }}>Release</th>
                <th>Status</th>
                <th>Data</th>
                <th>Veículos</th>
                <th style={{ textAlign: "right" }}>Alcance</th>
              </tr>
            </thead>
            <tbody>
              {RELEASES.map(r => (
                <tr key={r.id}>
                  <td className="title-cell">
                    {r.title.length > 64 ? r.title.slice(0, 64) + "…" : r.title}
                    <span className="ph">{r.cat} · {r.author}</span>
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="muted num">{fmtDate(r.date)}</td>
                  <td className="num">{r.vehicles || "—"}</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{fmtReach(r.reach)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
