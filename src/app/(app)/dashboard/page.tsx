"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Send,
  Eye,
  Newspaper,
  Zap,
  ChevronDown,
  Check,
  Building2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface BrandWithCount {
  id: string;
  name: string;
  segment: string | null;
  color: string | null;
  releases: number;
}

interface DashboardData {
  stats: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
  };
  brands: BrandWithCount[];
}

// ── BrandSwitcher local ──────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function DashBrandSwitcher({ brands }: { brands: BrandWithCount[] }) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  if (brands.length === 0) return null;

  const active = brands[activeIdx] ?? brands[0];
  const color = active.color ?? "#1A1A1A";

  return (
    <div className="tb-brandsel" style={{ position: "relative" }}>
      <button className="tbb-btn" onClick={() => setOpen(o => !o)}>
        <span className="tbb-av" style={{ background: color }}>{getInitials(active.name)}</span>
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
            {brands.map((b, i) => (
              <button key={b.id} className={`tbb-opt${i === activeIdx ? " on" : ""}`}
                onClick={() => { setActiveIdx(i); setOpen(false); }}>
                <span className="tbb-av" style={{ background: b.color ?? "#1A1A1A" }}>{getInitials(b.name)}</span>
                <span className="tbb-opt-meta">
                  <span className="tbb-nm">{b.name}</span>
                  <span className="tbb-sg">{b.segment ?? ""}</span>
                </span>
                {i === activeIdx && <Check size={15} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Dados mock (veículos — permanecem estáticos) ──────────────────────────────

const TOP_VEHICLES = [
  { id: "v1",  name: "Capital Econômica",   meta: "18 releases", n: "14,2", color: "#1A1A1A" },
  { id: "v16", name: "Jornal Metrópole",    meta: "15 releases", n: "11,8", color: "#0E1A2B" },
  { id: "v2",  name: "Portal Mercado Hoje", meta: "12 releases", n: "9,4",  color: "#2A6FDB" },
  { id: "v3",  name: "Diário Nacional",     meta: "11 releases", n: "8,1",  color: "#C2452E" },
  { id: "v7",  name: "Gazeta do Investidor",meta: "9 releases",  n: "5,7",  color: "#0E7C86" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function KpiCard({ icon: Icon, label, val, suffix, delta, period, accent }: {
  icon: React.ElementType; label: string; val: string; suffix?: string;
  delta: number; period: string; accent?: boolean;
}) {
  const up = delta >= 0;
  return (
    <div className={`card kpi${accent ? " accent" : ""}`}>
      <div className="ic"><Icon size={19} /></div>
      <div className="lbl">{label}</div>
      <div className="val">{val}{suffix && <small>{suffix}</small>}</div>
      <div className={`delta ${up ? "up" : "down"}`}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {up ? "+" : ""}{delta}% <span className="muted">· {period}</span>
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

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="card empty" style={{ marginTop: 32 }}>
      <Building2 size={34} />
      <div className="t">Nenhuma marca cadastrada ainda</div>
      <div className="h">Cadastre sua primeira marca para começar a distribuir releases.</div>
      <Link href="/configuracoes" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
        Cadastrar marca
      </Link>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName ?? "Usuário";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const brands = data?.brands ?? [];
  const hasBrands = brands.length > 0;

  const KPIS = [
    { id: "k1", icon: Send,      label: "Releases publicados", val: String(stats?.published ?? "—"), suffix: "",    delta: +18, period: "vs. mês anterior", accent: true },
    { id: "k2", icon: Eye,       label: "Alcance estimado",    val: "—",                             suffix: "",    delta: +24, period: "vs. mês anterior" },
    { id: "k3", icon: Newspaper, label: "Veículos ativos",     val: "—",                             suffix: "",    delta: +9,  period: "de centenas na rede" },
    { id: "k4", icon: Zap,       label: "Créditos restantes",  val: "1.800",                         suffix: "",    delta: -36, period: "de 5.000 do plano" },
  ];

  return (
    <div className="content scroll">
      <div className="content-inner">
        {/* Cabeçalho */}
        <div className="page-head">
          <div>
            <p className="eyebrow">Painel · Raio Publicador</p>
            <h2>Olá, {firstName} 👋</h2>
            <p className="sub">
              {hasBrands
                ? <>Você tem <b style={{ color: "var(--ink)" }}>{brands.length} marca{brands.length !== 1 ? "s" : ""}</b> e <b style={{ color: "var(--ink)" }}>{stats?.total ?? 0} release{(stats?.total ?? 0) !== 1 ? "s" : ""}</b> no total.</>
                : "Bem-vindo! Cadastre sua primeira marca para começar."}
            </p>
          </div>
          <div className="actions">
            {hasBrands && <DashBrandSwitcher brands={brands} />}
          </div>
        </div>

        {loading ? (
          <div className="card empty"><div className="muted">Carregando…</div></div>
        ) : !hasBrands ? (
          <EmptyState />
        ) : (
          <>
            {/* KPIs */}
            <div className="kpi-grid">
              {KPIS.map(k => <KpiCard key={k.id} {...k} />)}
            </div>

            {/* Gráfico + ranking */}
            <div className="dash-2col">
              <PerformanceDonut />
              <TopVehicles />
            </div>

            {/* Atividade recente — marcas */}
            <div className="card" style={{ marginBottom: 32 }}>
              <div className="card-head">
                <h3>Suas <em>marcas</em></h3>
                <a href="/configuracoes" className="link">Gerenciar</a>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: "44%" }}>Marca</th>
                    <th>Segmento</th>
                    <th style={{ textAlign: "right" }}>Releases</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(b => (
                    <tr key={b.id}>
                      <td className="title-cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: b.color ?? "#1A1A1A", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, color: "#fff", flex: "none" }}>
                          {getInitials(b.name)}
                        </div>
                        {b.name}
                      </td>
                      <td className="muted">{b.segment ?? "—"}</td>
                      <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{b.releases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
