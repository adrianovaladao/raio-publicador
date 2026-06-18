"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Send, Eye, Newspaper, Zap,
  ChevronDown, Check, Building2, X, Plus,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Brand {
  id: string;
  name: string;
  segment: string | null;
  color: string | null;
  site: string | null;
  contact: string | null;
  description: string | null;
  releases: number;
}

interface DashboardData {
  stats: { total: number; published: number; scheduled: number; draft: number };
  brands: Brand[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_COLORS = ["#C25E00","#2A6FDB","#2F8A5B","#6D3BD9","#0E7C86","#B0322E","#8A6500","#1A1A1A"];
const BRAND_SEGMENTS = ["Franquias","Tecnologia","Saúde","Economia","Varejo","Negócios","Educação","Serviços","Indústria","Outro"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── EditBrandModal ────────────────────────────────────────────────────────────

function EditBrandModal({ brand, onClose, onSave }: { brand: Brand; onClose: () => void; onSave: () => void }) {
  const [name, setName]       = useState(brand.name);
  const [segment, setSegment] = useState(brand.segment ?? "Franquias");
  const [site, setSite]       = useState(brand.site ?? "");
  const [contact, setContact] = useState(brand.contact ?? "");
  const [desc, setDesc]       = useState(brand.description ?? "");
  const [color, setColor]     = useState(brand.color ?? BRAND_COLORS[7]);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function save() {
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), segment, color, site: site.trim() || null, contact: contact.trim() || null, description: desc.trim() || null }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Erro ${res.status}`;
        try { msg = JSON.parse(text)?.error ?? msg; } catch { /* ignore */ }
        setErr(msg); return;
      }
      onSave(); onClose();
    } catch { setErr("Falha de conexão. Tente novamente."); }
    finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Editar <em>marca</em></h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body">
          <div className="nb-preview">
            <span className="nb-av" style={{ background: color }}>{getInitials(name)}</span>
            <div>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
          </div>
          <div className="field">
            <label>Nome da marca / cliente</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="nb-grid2">
            <div className="field">
              <label>Segmento / setor</label>
              <div className="select-wrap">
                <select className="input" value={segment} onChange={e => setSegment(e.target.value)}>
                  {BRAND_SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field">
              <label>Site</label>
              <input className="input" value={site} onChange={e => setSite(e.target.value)} placeholder="www.exemplo.com.br" />
            </div>
          </div>
          <div className="field">
            <label>Pessoa de contato / responsável</label>
            <input className="input" value={contact} onChange={e => setContact(e.target.value)} placeholder="Nome do contato" />
          </div>
          <div className="field">
            <label>Descrição curta</label>
            <textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Em uma frase, o que a marca faz." />
          </div>
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
        {err && <p style={{ color: "var(--red, #c0392b)", fontSize: 13, margin: "0 24px 12px", fontWeight: 500 }}>{err}</p>}
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!name.trim() || saving} onClick={save}>
            <Check size={15} /> {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NewBrandModal ─────────────────────────────────────────────────────────────

function NewBrandModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName]       = useState("");
  const [segment, setSegment] = useState("Franquias");
  const [site, setSite]       = useState("");
  const [contact, setContact] = useState("");
  const [desc, setDesc]       = useState("");
  const [color, setColor]     = useState(BRAND_COLORS[0]);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function submit() {
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), segment, color, site: site.trim() || undefined, contact: contact.trim() || undefined, description: desc.trim() || undefined }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Erro ${res.status}`;
        try { msg = JSON.parse(text)?.error ?? msg; } catch { /* ignore */ }
        setErr(msg); return;
      }
      onSave(); onClose();
    } catch { setErr("Falha de conexão. Tente novamente."); }
    finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="m-head">
          <h3>Cadastrar nova <em>marca</em></h3>
        </div>
        <div className="m-body">
          <div className="nb-preview">
            <span className="nb-av" style={{ background: color }}>{name.trim() ? getInitials(name) : "?"}</span>
            <div>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
          </div>
          <div className="field">
            <label>Nome da marca / cliente</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Franquia Sabor Brasil" autoFocus />
          </div>
          <div className="nb-grid2">
            <div className="field">
              <label>Segmento / setor</label>
              <div className="select-wrap">
                <select className="input" value={segment} onChange={e => setSegment(e.target.value)}>
                  {BRAND_SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field">
              <label>Site</label>
              <input className="input" value={site} onChange={e => setSite(e.target.value)} placeholder="www.exemplo.com.br" />
            </div>
          </div>
          <div className="field">
            <label>Pessoa de contato / responsável</label>
            <input className="input" value={contact} onChange={e => setContact(e.target.value)} placeholder="Nome do contato na marca" />
          </div>
          <div className="field">
            <label>Descrição curta</label>
            <textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Em uma frase, o que a marca faz." />
          </div>
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
        {err && <p style={{ color: "var(--red, #c0392b)", fontSize: 13, margin: "0 24px 12px", fontWeight: 500 }}>{err}</p>}
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!name.trim() || saving} onClick={submit}>
            <Check size={15} /> {saving ? "Criando…" : "Criar marca"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BrandSwitcher ─────────────────────────────────────────────────────────────

function DashBrandSwitcher({ brands, onNewBrand }: { brands: Brand[]; onNewBrand: () => void }) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  if (brands.length === 0) return null;
  const active = brands[activeIdx] ?? brands[0];

  return (
    <div className="tb-brandsel" style={{ position: "relative" }}>
      <button className="tbb-btn" onClick={() => setOpen(o => !o)}>
        <span className="tbb-av" style={{ background: active.color ?? "#1A1A1A" }}>{getInitials(active.name)}</span>
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
            <button className="tbb-opt tbb-new" onClick={() => { setOpen(false); onNewBrand(); }}>
              <span className="tbb-av" style={{ background: "var(--line)", color: "var(--tx-3)" }}><Plus size={14} /></span>
              <span className="tbb-opt-meta">
                <span className="tbb-nm">Nova marca</span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, val, delta, period, accent }: {
  icon: React.ElementType; label: string; val: string;
  delta?: number; period?: string; accent?: boolean;
}) {
  const hasComparison = delta !== undefined && period !== undefined;
  const up = (delta ?? 0) >= 0;
  return (
    <div className={`card kpi${accent ? " accent" : ""}`}>
      <div className="ic"><Icon size={19} /></div>
      <div className="lbl">{label}</div>
      <div className="val">{val}</div>
      {hasComparison ? (
        <div className={`delta ${up ? "up" : "down"}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {up ? "+" : ""}{delta}% <span className="muted">· {period}</span>
        </div>
      ) : (
        <div className="delta muted" style={{ fontSize: 12 }}>Sem dados comparativos ainda</div>
      )}
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
      <Link href="/configuracoes?tab=marcas" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
        Cadastrar marca
      </Link>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName ?? "Usuário";

  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [showNew, setShowNew]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats    = data?.stats;
  const brands   = data?.brands ?? [];
  const hasBrands   = brands.length > 0;
  const hasReleases = (stats?.total ?? 0) > 0;

  const KPIS = [
    { id: "k1", icon: Send,      label: "Releases publicados", val: String(stats?.published ?? 0), accent: true },
    { id: "k2", icon: Eye,       label: "Alcance estimado",    val: "—" },
    { id: "k3", icon: Newspaper, label: "Veículos ativos",     val: "—" },
    { id: "k4", icon: Zap,       label: "Créditos restantes",  val: "1.800" },
  ];

  return (
    <div className="content scroll">
      <div className="content-inner">
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
            {hasBrands && <DashBrandSwitcher brands={brands} onNewBrand={() => setShowNew(true)} />}
          </div>
        </div>

        {loading ? (
          <div className="card empty"><div className="muted">Carregando…</div></div>
        ) : !hasBrands ? (
          <EmptyState />
        ) : (
          <>
            <div className="kpi-grid">
              {KPIS.map(k => <KpiCard key={k.id} {...k} />)}
            </div>

            {hasReleases && (
              <div className="dash-2col">
                <PerformanceDonut />
                <TopVehicles />
              </div>
            )}

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
                    <tr key={b.id} onClick={() => setEditBrand(b)}
                      style={{ cursor: "pointer" }}
                      className="tbl-row-hover">
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

      {editBrand && (
        <EditBrandModal
          brand={editBrand}
          onClose={() => setEditBrand(null)}
          onSave={load}
        />
      )}
      {showNew && (
        <NewBrandModal
          onClose={() => setShowNew(false)}
          onSave={load}
        />
      )}
    </div>
  );
}

// ── Mock charts (só aparecem com releases) ────────────────────────────────────

const TOP_VEHICLES = [
  { id: "v1",  name: "Capital Econômica",    meta: "18 releases", n: "14,2", color: "#1A1A1A" },
  { id: "v16", name: "Jornal Metrópole",     meta: "15 releases", n: "11,8", color: "#0E1A2B" },
  { id: "v2",  name: "Portal Mercado Hoje",  meta: "12 releases", n: "9,4",  color: "#2A6FDB" },
  { id: "v3",  name: "Diário Nacional",      meta: "11 releases", n: "8,1",  color: "#C2452E" },
  { id: "v7",  name: "Gazeta do Investidor", meta: "9 releases",  n: "5,7",  color: "#0E7C86" },
];

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
            <div className="logo" style={{ background: v.color }}>{getInitials(v.name)}</div>
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
