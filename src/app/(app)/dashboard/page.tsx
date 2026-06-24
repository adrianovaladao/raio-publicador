"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Send, Eye, Newspaper, Zap,
  ChevronDown, Check, Building2, X, Plus, ImageIcon, Upload,
} from "lucide-react";
import Image from "next/image";
import { extractDominantColor, extractDominantColorFromUrl } from "@/lib/color";

// ── Types ────────────────────────────────────────────────────────────────────

interface Brand {
  id: string;
  name: string;
  segment: string | null;
  color: string | null;
  site: string | null;
  contact: string | null;
  description: string | null;
  logoUrl: string | null;
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

function BrandAvatar({ name, color, logoUrl, size = 28 }: { name: string | null | undefined; color: string | null | undefined; logoUrl?: string | null; size?: number }) {
  const bg = color ?? "#1A1A1A";
  const r  = Math.round(size * 0.286); // ~8px for 28px
  if (logoUrl) {
    return (
      <span style={{ width: size, height: size, borderRadius: r, overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", background: bg, flex: "none" }}>
        <Image src={logoUrl} alt={name ?? ""} width={size} height={size} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
      </span>
    );
  }
  return (
    <span style={{ width: size, height: size, borderRadius: r, background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: Math.round(size * 0.39), color: "#fff", flex: "none" }}>
      {getInitials(name)}
    </span>
  );
}

async function uploadLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const text = await res.text();
  let data: { url?: string; error?: string } = {};
  try { data = JSON.parse(text); } catch { /* ignore */ }
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status} no upload`);
  if (!data.url) throw new Error("Upload falhou: URL não retornada");
  return data.url;
}

// ── EditBrandModal ────────────────────────────────────────────────────────────

function EditBrandModal({ brand, onClose, onSave }: { brand: Brand; onClose: () => void; onSave: () => void }) {
  const [name, setName]         = useState(brand.name);
  const [segment, setSegment]   = useState(brand.segment ?? "Franquias");
  const [site, setSite]         = useState(brand.site ?? "");
  const [contact, setContact]   = useState(brand.contact ?? "");
  const [desc, setDesc]         = useState(brand.description ?? "");
  const [color, setColor]       = useState(brand.color ?? BRAND_COLORS[7]);
  const [logoUrl, setLogoUrl]   = useState(brand.logoUrl ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(brand.logoUrl ?? "");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Ao abrir modal de edição com logo já salvo, extrai a cor dominante automaticamente
  useEffect(() => {
    if (brand.logoUrl) {
      extractDominantColorFromUrl(brand.logoUrl).then(setColor);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    const dominant = await extractDominantColor(file);
    setColor(dominant);
  }

  async function save() {
    setSaving(true); setErr("");
    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) finalLogoUrl = await uploadLogo(logoFile);
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), segment, color, site: site.trim() || null, contact: contact.trim() || null, description: desc.trim() || null, logoUrl: finalLogoUrl || null }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Erro ${res.status}`;
        try { msg = JSON.parse(text)?.error ?? msg; } catch { /* ignore */ }
        setErr(msg); return;
      }
      onSave(); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : "Falha de conexão."); }
    finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Editar <em>marca</em></h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body">
          <div className="nb-preview">
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()} title="Trocar logo">
              <BrandAvatar name={name} color={color} logoUrl={logoPreview || null} size={40} />
              <span style={{ position: "absolute", inset: 0, borderRadius: 6, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
                <ImageIcon size={14} color="#fff" />
              </span>
            </div>
            <div>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
          </div>
          <div className="field">
            <label>Logotipo</label>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => fileRef.current?.click()} style={{ gap: 7 }}>
                <Upload size={14} /> {logoPreview ? "Trocar imagem" : "Adicionar logo"}
              </button>
              {logoPreview && (
                <button type="button" className="btn btn-quiet btn-sm" style={{ color: "var(--red,#c0392b)" }}
                  onClick={() => { setLogoPreview(""); setLogoFile(null); setLogoUrl(""); }}>
                  Remover
                </button>
              )}
            </div>
          </div>
          <div className="nb-grid2">
            <div className="field"><label>Nome da marca / cliente</label><input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
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
  const [name,    setName]    = useState("");
  const [segment, setSegment] = useState("Franquias");
  const [site,    setSite]    = useState("");
  const [contact, setContact] = useState("");
  const [desc,    setDesc]    = useState("");
  const [boiler,  setBoiler]  = useState("");
  const [color,   setColor]   = useState(BRAND_COLORS[0]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
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
      let logoUrl: string | undefined;
      if (logoFile) logoUrl = await uploadLogo(logoFile);
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), segment, color, site: site.trim() || null, contact: contact.trim() || null, description: desc.trim() || null, boilerplate: boiler.trim() || null, logoUrl }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `Erro ${res.status}`;
        try { msg = JSON.parse(text)?.error ?? msg; } catch { /* ignore */ }
        setErr(msg); return;
      }
      onSave(); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : "Falha de conexão."); }
    finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head">
          <h3>Cadastrar nova <em>marca</em></h3>
        </div>
        <div className="m-body">
          <div className="nb-preview">
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()} title="Adicionar logo">
              <BrandAvatar name={name || "?"} color={color} logoUrl={logoPreview || null} size={40} />
              <span style={{ position: "absolute", inset: 0, borderRadius: 6, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
                <ImageIcon size={14} color="#fff" />
              </span>
            </div>
            <div>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
          </div>
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
        <BrandAvatar name={active.name} color={active.color} logoUrl={active.logoUrl} size={26} />
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
                <BrandAvatar name={b.name} color={b.color} logoUrl={b.logoUrl} size={26} />
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
      .then(async (d: DashboardData) => {
        setData(d);
        // Sincroniza cores dos logos em segundo plano
        for (const b of d.brands ?? []) {
          if (!b.logoUrl) continue;
          const dominant = await extractDominantColorFromUrl(b.logoUrl);
          if (dominant === (b.color ?? "").toLowerCase()) continue;
          fetch(`/api/brands/${b.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ color: dominant }),
          }).then(() => {
            setData(prev => prev ? {
              ...prev,
              brands: prev.brands.map(x => x.id === b.id ? { ...x, color: dominant } : x),
            } : prev);
          }).catch(() => { /* silencioso */ });
        }
      })
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
                <a href="/configuracoes?tab=marcas" className="link">Gerenciar</a>
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
                        <BrandAvatar name={b.name} color={b.color} logoUrl={b.logoUrl} size={28} />
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

// ── Vehicle charts ────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017", D: "#3A7DC9", E: "#D0DFF0" };
const TIER_FG:     Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff",    D: "#fff",    E: "#3A5A80" };
const TIER_TOKENS: Record<string, number> = { A: 250, B: 150, C: 100, D: 50, E: 0 };

// Minimal vehicle lookup map (id → name, domain, tier, reach)
// Generated from the same source as the full VEHICLES list
const VEH_MAP: Record<string, { name: string; domain: string; tier: string; reach: number }> = {
  "v1":   { name: "Ge Globo",        domain: "ge.globo.com",              tier: "A", reach: 100000000 },
  "v2":   { name: "G1 Globo",        domain: "g1.globo.com",              tier: "A", reach: 70000000  },
  "v3":   { name: "Terra",            domain: "terra.com.br",              tier: "A", reach: 61000000  },
  "v4":   { name: "Oglobo Globo",    domain: "oglobo.globo.com",          tier: "A", reach: 19000000  },
  "v5":   { name: "Ig",              domain: "ig.com.br",                 tier: "A", reach: 8400000   },
  "v6":   { name: "Revistakdea360",  domain: "revistakdea360.com.br",     tier: "D", reach: 5614333   },
  "v7":   { name: "Gazetadopovo",    domain: "gazetadopovo.com.br",       tier: "A", reach: 5500000   },
  "v8":   { name: "Correiobraziliense", domain: "correiobraziliense.com.br", tier: "A", reach: 5400000 },
  "v9":   { name: "Band",            domain: "band.com.br",               tier: "A", reach: 5000000   },
  "v10":  { name: "Valor Globo",     domain: "valor.globo.com",           tier: "A", reach: 4200000   },
  "v11":  { name: "Mixvale",         domain: "mixvale.com.br",            tier: "C", reach: 3700000   },
  "v12":  { name: "Uai",             domain: "uai.com.br",                tier: "A", reach: 3600000   },
  "v13":  { name: "Rollingstone",    domain: "rollingstone.com.br",       tier: "B", reach: 2700000   },
  "v14":  { name: "Odia Ig",         domain: "odia.ig.com.br",            tier: "A", reach: 2500000   },
  "v15":  { name: "Em",              domain: "em.com.br",                 tier: "A", reach: 2400000   },
  "v16":  { name: "Brasil247",       domain: "brasil247.com",             tier: "A", reach: 1700000   },
  "v17":  { name: "Egobrazil",       domain: "egobrazil.com.br",          tier: "A", reach: 1254000   },
  "v18":  { name: "Recreio",         domain: "recreio.com.br",            tier: "C", reach: 1200000   },
  "v19":  { name: "Folhavitoria",    domain: "folhavitoria.com.br",       tier: "B", reach: 1000000   },
  "v20":  { name: "Futebolinterior", domain: "futebolinterior.com.br",    tier: "B", reach: 956000    },
  "v117": { name: "Revistadetetive", domain: "revistadetetive.com.br",    tier: "E", reach: 22000     },
  "v124": { name: "Celebs",          domain: "celebs.com.br",             tier: "E", reach: 19500     },
};

type VehStat = { id: string; name: string; domain: string; tier: string; reach: number; count: number };

function PerformanceDonut() {
  const [data,   setData]   = useState<VehStat[]>([]);
  const [total,  setTotal]  = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles-stats")
      .then(r => r.json())
      .then((res: { ranked: { id: string; count: number }[]; totalReleases: number }) => {
        const top5 = res.ranked.slice(0, 5).map(r => {
          const v = VEH_MAP[r.id] ?? { name: r.id, domain: "", tier: "E", reach: 0 };
          return { id: r.id, ...v, count: r.count };
        });
        setData(top5);
        setTotal(res.totalReleases);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const r = 70, C = 2 * Math.PI * r;
  let acc = 0;
  const segs = data.map(d => {
    const frac = totalCount > 0 ? d.count / totalCount : 0;
    const len = frac * C;
    const seg = { ...d, frac, len, offset: -acc };
    acc += len;
    return seg;
  });

  return (
    <div className="card">
      <div className="card-head">
        <h3>Distribuição de releases por <em>veículo</em></h3>
        <span className="eyebrow">Top 5 · mais selecionados</span>
      </div>
      {loading ? (
        <div className="card-pad" style={{ textAlign: "center", color: "var(--stone)", padding: "40px 0" }}>Carregando…</div>
      ) : data.length === 0 ? (
        <div className="card-pad" style={{ textAlign: "center", color: "var(--stone)", padding: "40px 0" }}>Nenhum veículo selecionado ainda.</div>
      ) : (
        <>
          <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 180, height: 180, flex: "none" }}>
              <svg width="180" height="180" viewBox="0 0 180 180">
                <g transform="rotate(-90 90 90)">
                  <circle cx="90" cy="90" r={r} fill="none" stroke="var(--cream)" strokeWidth="22" />
                  {segs.map(s => (
                    <circle key={s.id} cx="90" cy="90" r={r} fill="none" stroke={TIER_COLORS[s.tier] ?? "#ccc"} strokeWidth="22"
                      strokeDasharray={`${Math.max(s.len - 2, 0)} ${C - Math.max(s.len - 2, 0)}`}
                      strokeDashoffset={s.offset} strokeLinecap="butt" />
                  ))}
                </g>
                <text x="90" y="84" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em", fill: "var(--ink)" }}>{totalCount}</text>
                <text x="90" y="106" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: "0.14em", fill: "var(--stone)" }}>SELEÇÕES</text>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {segs.map(s => (
                <div className="row" key={s.id} style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                  <div className="row" style={{ gap: 10, minWidth: 0 }}>
                    <i style={{ width: 11, height: 11, borderRadius: 3, background: TIER_COLORS[s.tier] ?? "#ccc", flex: "none" }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--stone)" }}>{s.count}×</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)", width: 38, textAlign: "right", fontWeight: 600 }}>{Math.round(s.frac * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "14px 22px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 13 }}>Top 5 veículos concentram</span>
            <span style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>{totalCount} seleções em {total} release{total !== 1 ? "s" : ""}</span>
          </div>
        </>
      )}
    </div>
  );
}

function TopVehicles() {
  const [data,    setData]    = useState<VehStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles-stats")
      .then(r => r.json())
      .then((res: { ranked: { id: string; count: number }[] }) => {
        // Top vehicle per tier
        const byTier: Record<string, VehStat> = {};
        for (const r of res.ranked) {
          const v = VEH_MAP[r.id];
          if (!v) continue;
          const entry = { id: r.id, ...v, count: r.count };
          if (!byTier[v.tier]) byTier[v.tier] = entry;
        }
        const ordered = ["A","B","C","D","E"].map(t => byTier[t]).filter(Boolean) as VehStat[];
        setData(ordered);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <div className="card-head">
        <h3>Veículos com maior entrega <em>por tier</em></h3>
        <a href="/veiculos" className="link">Ver todos</a>
      </div>
      {loading ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--stone)" }}>Carregando…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--stone)" }}>Nenhum veículo selecionado ainda.</div>
      ) : (
        <div className="rank">
          {data.map(v => (
            <div className="rank-row" key={v.id}>
              <div className="logo" style={{ background: TIER_COLORS[v.tier] ?? "#ccc", color: TIER_FG[v.tier] ?? "#fff" }}>{getInitials(v.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div className="nm">{v.name}</div>
                <div className="meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className={`tier t-${v.tier.toLowerCase()}`} style={{ fontSize: 9, padding: "1px 5px" }}>{v.tier}</span>
                  <span>{v.domain}</span>
                  <span>·</span>
                  <span>{v.count} release{v.count !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="val">
                <div className="n">{TIER_TOKENS[v.tier]} <span style={{ fontSize: 11, color: "var(--stone)", fontWeight: 400 }}>créditos</span></div>
                <div className="u">por envio</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
