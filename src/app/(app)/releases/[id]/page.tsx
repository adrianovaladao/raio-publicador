"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Image as ImageIcon,
  Rocket, Calendar, X, Search, Trash2, Plus,
} from "lucide-react";
import { RichEditor } from "@/components/editor/RichEditor";

// ── Mock vehicles ─────────────────────────────────────────────────────────────

const VEHICLES = [
  { id: "v1",  name: "Capital Econômica",      domain: "capitaleconomica.com.br",  cat: "Economia",   uf: "SP", reach: 8400000, tier: "AAA", tokens: 320, color: "#1A1A1A" },
  { id: "v2",  name: "Portal Mercado Hoje",    domain: "mercadohoje.com.br",       cat: "Negócios",   uf: "SP", reach: 6100000, tier: "AAA", tokens: 280, color: "#2A6FDB" },
  { id: "v3",  name: "Diário Nacional",        domain: "diarionacional.com.br",    cat: "Geral",      uf: "DF", reach: 5200000, tier: "AAA", tokens: 260, color: "#C2452E" },
  { id: "v4",  name: "TechBrasil",             domain: "techbrasil.com.br",        cat: "Tecnologia", uf: "SP", reach: 3900000, tier: "AA",  tokens: 180, color: "#2F8A5B" },
  { id: "v5",  name: "Franquia & Negócio",     domain: "franquianegocio.com.br",   cat: "Franquias",  uf: "SP", reach: 1450000, tier: "AA",  tokens: 150, color: "#8A6500" },
  { id: "v6",  name: "Varejo em Foco",         domain: "varejoemfoco.com.br",      cat: "Varejo",     uf: "RJ", reach: 2200000, tier: "AA",  tokens: 160, color: "#6D3BD9" },
  { id: "v7",  name: "Gazeta do Investidor",   domain: "gazetainvestidor.com.br",  cat: "Economia",   uf: "RJ", reach: 2800000, tier: "AA",  tokens: 190, color: "#0E7C86" },
  { id: "v8",  name: "Tribuna Empreendedora",  domain: "tribunaemp.com.br",        cat: "Negócios",   uf: "MG", reach: 1100000, tier: "A",   tokens: 90,  color: "#C25E00" },
  { id: "v9",  name: "InfoNegócios Sul",       domain: "infonegociossul.com.br",   cat: "Negócios",   uf: "RS", reach: 980000,  tier: "A",   tokens: 80,  color: "#1F6FB2" },
  { id: "v10", name: "Nordeste Econômico",     domain: "nordesteeconomico.com.br", cat: "Economia",   uf: "PE", reach: 1300000, tier: "A",   tokens: 95,  color: "#B0322E" },
  { id: "v11", name: "Diário do Comércio",     domain: "diariodocomercio.com.br",  cat: "Varejo",     uf: "MG", reach: 760000,  tier: "A",   tokens: 70,  color: "#3A3A3A" },
  { id: "v12", name: "Capital Norte",          domain: "capitalnorte.com.br",      cat: "Geral",      uf: "AM", reach: 540000,  tier: "A",   tokens: 60,  color: "#16794E" },
  { id: "v13", name: "Tecnologia & Cia",       domain: "tecnologiaecia.com.br",    cat: "Tecnologia", uf: "SP", reach: 1650000, tier: "AA",  tokens: 140, color: "#5B53D9" },
  { id: "v16", name: "Jornal Metrópole",       domain: "jornalmetropole.com.br",   cat: "Geral",      uf: "RJ", reach: 4300000, tier: "AAA", tokens: 240, color: "#0E1A2B" },
];

const VEH_CATS = ["Todos", "Economia", "Negócios", "Franquias", "Varejo", "Tecnologia", "Geral"];
const VEH_UFS  = ["Todas", "SP", "RJ", "MG", "RS", "PE", "DF", "GO", "AM"];
const CONTENT_CATS = ["Economia", "Negócios", "Franquias", "Varejo", "Tecnologia", "Geral"];
const PLAN = { total: 5000, used: 3200 };
const STEPS = ["Conteúdo", "Veículos", "Agendamento"];

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Brand {
  id: string;
  name: string;
  segment: string | null;
  color: string | null;
  logoUrl?: string | null;
}

interface ReleaseData {
  id: string;
  title: string;
  body: string;
  summary: string | null;
  status: string;
  scheduledAt: string | null;
  imageUrl: string | null;
  creditsUsed: number;
  brandId: string;
  brand: Brand;
}

// ── Step 0: Conteúdo ──────────────────────────────────────────────────────────

function MediaGallery({ images, onAdd, onRemove }: {
  images: string[];
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setErr("Apenas imagens JPG ou PNG."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Arquivo muito grande (máx. 5 MB)."); return; }
    const dims = await new Promise<{ w: number; h: number }>(res => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { res({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { res({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
      img.src = url;
    });
    if (dims.w < 1200 || dims.h < 630) { setErr(`Mínimo: 1200×630px (atual: ${dims.w}×${dims.h}px).`); return; }
    if (dims.w > 3600 || dims.h > 1890) { setErr(`Máximo: 3600×1890px (atual: ${dims.w}×${dims.h}px).`); return; }
    setErr(""); setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(text); } catch { /* ignore */ }
      if (!res.ok || !data.url) { setErr(data.error ?? "Falha no upload."); return; }
      onAdd(data.url);
    } catch { setErr("Falha de conexão."); }
    finally { setUploading(false); }
  }

  return (
    <div className="card side-card">
      <div className="card-head"><h3>Mídia</h3></div>
      <div style={{ padding: "12px 20px 20px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        {images.map(url => (
          <div key={url} style={{ position: "relative", width: 120, height: 76, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--line)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <button onClick={() => onRemove(url)}
              style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 5, color: "#fff", cursor: "pointer", padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>
              Remover
            </button>
          </div>
        ))}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{ width: 120, height: 76, borderRadius: 8, border: "1.5px dashed var(--sand)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: uploading ? "default" : "pointer", color: "var(--stone)", flexShrink: 0 }}
        >
          {uploading
            ? <><ImageIcon size={16} /><span style={{ fontSize: 10 }}>Enviando…</span></>
            : <><Plus size={16} /><span style={{ fontSize: 10, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>Adicionar imagem</span></>}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
      {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 12, margin: "-8px 20px 12px", fontWeight: 500 }}>{err}</p>}
    </div>
  );
}

function StepContent({
  title, setTitle, subtitle, setSubtitle, body, setBody,
  cat, setCat, author, setAuthor, images, onAddImage, onRemoveImage, brand, authors,
}: {
  title: string; setTitle: (v: string) => void;
  subtitle: string; setSubtitle: (v: string) => void;
  body: string; setBody: (v: string) => void;
  cat: string; setCat: (v: string) => void;
  author: string; setAuthor: (v: string) => void;
  images: string[]; onAddImage: (url: string) => void; onRemoveImage: (url: string) => void;
  brand: Brand | null;
  authors: { id: string; name: string }[];
}) {
  return (
    <div className="composer-grid">
      {/* Editor */}
      <RichEditor
        title={title} onTitleChange={setTitle}
        subtitle={subtitle} onSubtitleChange={setSubtitle}
        content={body} onContentChange={setBody}
        brandName={brand?.name}
      />

      {/* Sidebar */}
      <div>
        {/* Marca (read-only) */}
        {brand && (
          <div className="card side-card" style={{ marginBottom: 16 }}>
            <div className="card-head"><h3>Marca</h3></div>
            <div className="sc-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: brand.color ?? "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {brand.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={brand.logoUrl} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "#fff" }}>{initials(brand.name)}</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{brand.name}</div>
                  <div style={{ fontSize: 12, color: "var(--stone)" }}>{brand.segment}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detalhes */}
        <div className="card side-card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>Detalhes</h3></div>
          <div className="sc-body">
            <div className="field-row">
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)" }}>Categoria</label>
              <div className="select-wrap">
                <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
                  {CONTENT_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field-row">
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)" }}>Autor</label>
              <div className="select-wrap">
                <select className="input" value={author} onChange={e => setAuthor(e.target.value)}>
                  {authors.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Mídia */}
        <MediaGallery images={images} onAdd={onAddImage} onRemove={onRemoveImage} />
      </div>
    </div>
  );
}

// ── Step 1: Veículos ──────────────────────────────────────────────────────────

function StepVehicles({ selected, setSelected }: { selected: string[]; setSelected: (s: string[]) => void }) {
  const [cat, setCat] = useState("Todos");
  const [uf,  setUf]  = useState("Todas");
  const [q,   setQ]   = useState("");

  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const remove = (id: string) => setSelected(selected.filter(x => x !== id));

  const list = VEHICLES.filter(v =>
    (cat === "Todos" || v.cat === cat) &&
    (uf  === "Todas" || v.uf  === uf)  &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );

  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);
  const left        = PLAN.total - PLAN.used;
  const over        = selTokens > left;
  const usedPct     = (PLAN.used / PLAN.total) * 100;
  const nowPct      = Math.min((selTokens / PLAN.total) * 100, 100 - usedPct);

  return (
    <div className="veh-layout">
      <div className="card veh-list">
        <div className="vh-toolbar">
          <div className="search" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input placeholder="Buscar veículo…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="select-wrap" style={{ width: 150 }}>
            <select className="input" value={cat} onChange={e => setCat(e.target.value)} style={{ padding: "8px 32px 8px 12px", fontSize: 13 }}>
              {VEH_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="select-wrap" style={{ width: 100 }}>
            <select className="input" value={uf} onChange={e => setUf(e.target.value)} style={{ padding: "8px 32px 8px 12px", fontSize: 13 }}>
              {VEH_UFS.map(u => <option key={u}>{u}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid var(--line)" }}>
          <span className="eyebrow">{list.length} veículos</span>
          <button className="link"
            style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              const allIds = list.map(v => v.id);
              const allSel = allIds.every(id => selected.includes(id));
              setSelected(allSel ? selected.filter(id => !allIds.includes(id)) : [...new Set([...selected, ...allIds])]);
            }}>
            Selecionar todos
          </button>
        </div>

        <div className="scroll" style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
          {list.map(v => (
            <div key={v.id} className={`veh-row${selected.includes(v.id) ? " sel" : ""}`} onClick={() => toggle(v.id)}>
              <div className="cbx">{selected.includes(v.id) && <Check size={13} />}</div>
              <div className="logo" style={{ background: v.color }}>{initials(v.name)}</div>
              <div>
                <div className="nm">{v.name}</div>
                <div className="meta">
                  <span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span>
                  <span className="dom">{v.domain}</span>
                  <span className="dom">· {v.uf}</span>
                </div>
              </div>
              <div className="reach"><div className="n">{fmtReach(v.reach)}</div><div className="u">alcance/mês</div></div>
              <div className="cost"><span className="tk">{v.tokens}</span><span style={{ color: "var(--coral-ink)", fontSize: 16 }}>⚡</span></div>
            </div>
          ))}
        </div>
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
            <span><i style={{ background: "var(--ink)", display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Já usados {PLAN.used.toLocaleString("pt-BR")}</span>
            <span><i style={{ background: "var(--coral)", display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Esta seleção {selTokens}</span>
          </div>
        </div>

        {selVehicles.length === 0 ? (
          <div className="cart-empty">Selecione veículos à esquerda para montar a distribuição.</div>
        ) : (
          <div className="sel-list scroll">
            {selVehicles.map(v => (
              <div className="sel-item" key={v.id}>
                <div style={{ background: v.color, width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 9, fontFamily: "var(--mono)", fontWeight: 700, color: "#fff", flex: "none" }}>{initials(v.name)}</div>
                <span className="nm">{v.name}</span>
                <span className="tk">{v.tokens}</span>
                <button className="rm" onClick={() => remove(v.id)} title="Remover"><X size={15} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="cart-foot">
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
  );
}

// ── Step 2: Agendamento ───────────────────────────────────────────────────────

function StepSchedule({
  status, setStatus, schedDate, setSchedDate, schedTime, setSchedTime,
  title, body, subtitle, cat, selectedVeh, brand,
}: {
  status: string; setStatus: (v: string) => void;
  schedDate: string; setSchedDate: (v: string) => void;
  schedTime: string; setSchedTime: (v: string) => void;
  title: string; body: string; subtitle: string; cat: string;
  selectedVeh: string[]; brand: Brand | null;
}) {
  const selVehicles = selectedVeh.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="composer-grid">
      {/* Pré-visualização */}
      <div className="card">
        <div className="card-head">
          <h3>Pré-visualização do <em>release</em></h3>
          <span className={`badge-status ${status === "PUBLISHED" ? "published" : status === "SCHEDULED" ? "scheduled" : "draft"}`}>
            {status === "PUBLISHED" ? "Publicado" : status === "SCHEDULED" ? "Agendado" : "Rascunho"}
          </span>
        </div>
        <div className="card-pad">
          {brand && (
            <div className="review-brand">
              <span className="bc-av" style={{ background: brand.color ?? "#1A1A1A", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {brand.logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={brand.logoUrl} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : initials(brand.name)}
              </span>
              <div className="bc-meta">
                <span className="bc-lbl">Marca</span>
                <span className="bc-nm">{brand.name}</span>
              </div>
            </div>
          )}
          <p className="eyebrow" style={{ marginBottom: 14 }}>{cat}</p>
          <h2 style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.025em", lineHeight: 1.12, margin: "0 0 10px" }}>
            {title || "Título do release"}
          </h2>
          <p className="serif-it" style={{ fontSize: 18, color: "var(--ink-soft)", margin: "0 0 18px" }}>
            {subtitle || "Subtítulo do release."}
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {body || "O corpo do release aparece aqui."}
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div>
        {/* Distribuição */}
        <div className="card side-card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>Distribuição</h3></div>
          <div className="sc-body">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Veículos</span>
              <span style={{ fontWeight: 700 }}>{selVehicles.length}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Alcance estimado</span>
              <span style={{ fontWeight: 700 }}>{fmtReach(selReach)}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 13 }}>Créditos</span>
              <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>{selTokens} <span style={{ color: "var(--coral)", fontSize: 14 }}>⚡</span></span>
            </div>
          </div>
        </div>

        {/* Quando publicar */}
        <div className="card side-card">
          <div className="card-head"><h3>Quando publicar</h3></div>
          <div className="sc-body">
            <div className="seg" style={{ width: "100%", marginBottom: 14 }}>
              <button className={status === "DRAFT" ? "active" : ""} style={{ flex: 1, justifyContent: "center" }} onClick={() => setStatus("DRAFT")}>
                Rascunho
              </button>
              <button className={status === "SCHEDULED" ? "active" : ""} style={{ flex: 1, justifyContent: "center" }} onClick={() => setStatus("SCHEDULED")}>
                <Calendar size={14} /> Agendar
              </button>
              <button className={status === "PUBLISHED" ? "active" : ""} style={{ flex: 1, justifyContent: "center" }} onClick={() => setStatus("PUBLISHED")}>
                <Rocket size={14} /> Publicar
              </button>
            </div>
            {status === "SCHEDULED" && (
              <div style={{ display: "flex", gap: 10 }}>
                <div className="field-row" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Data</label>
                  <input className="input" type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} />
                </div>
                <div className="field-row" style={{ width: 110, marginBottom: 0 }}>
                  <label>Hora</label>
                  <input className="input" type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} />
                </div>
              </div>
            )}
            {status === "PUBLISHED" && (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>O release entra na fila de envio ao salvar.</p>
            )}
            {status === "DRAFT" && (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>Salvo como rascunho — não será distribuído.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DeleteModal ───────────────────────────────────────────────────────────────

function DeleteModal({ title, onConfirm, onClose, deleting }: {
  title: string; onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="m-head">
          <h3>Excluir release</h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body">
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)" }}>
            Tem certeza que deseja excluir <strong style={{ color: "var(--ink)" }}>&ldquo;{title}&rdquo;</strong>? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-sm" style={{ background: "var(--red,#c0392b)", color: "#fff" }} disabled={deleting} onClick={onConfirm}>
            <Trash2 size={14} /> {deleting ? "Excluindo…" : "Excluir release"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditReleasePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [step,       setStep]       = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [err,        setErr]        = useState("");

  const [release,    setRelease]    = useState<ReleaseData | null>(null);
  const [title,      setTitle]      = useState("");
  const [subtitle,   setSubtitle]   = useState("");
  const [body,       setBody]       = useState("");
  const [cat,        setCat]        = useState("Negócios");
  const [authors,    setAuthors]    = useState<{ id: string; name: string }[]>([]);
  const [author,     setAuthor]     = useState("");
  const [images,     setImages]     = useState<string[]>([]);
  const [status,     setStatus]     = useState("SCHEDULED");
  const [schedDate,  setSchedDate]  = useState("");
  const [schedTime,  setSchedTime]  = useState("09:00");
  const [selectedVeh, setSelectedVeh] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/team")
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => {
        setAuthors(data);
        setAuthor(a => a || data[0]?.name || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/releases/${id}`)
      .then(r => r.json())
      .then((data: ReleaseData) => {
        setRelease(data);
        setTitle(data.title ?? "");
        setSubtitle(data.summary ?? "");
        setBody(data.body ?? "");
        if (data.imageUrl) setImages([data.imageUrl]);
        setStatus(data.status ?? "SCHEDULED");
        if (data.scheduledAt) {
          const d = new Date(data.scheduledAt);
          setSchedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
          setSchedTime(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
        }
      })
      .catch(() => setErr("Não foi possível carregar o release."))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!title.trim()) return;
    setSaving(true); setErr("");
    try {
      const scheduledAt = status === "SCHEDULED" && schedDate
        ? new Date(`${schedDate}T${schedTime || "09:00"}:00`).toISOString()
        : null;
      const res = await fetch(`/api/releases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body,
          summary: subtitle.trim() || null,
          status,
          scheduledAt,
          imageUrl: images[0] ?? null,
        }),
      });
      if (!res.ok) { setErr("Erro ao salvar. Tente novamente."); return; }
      router.push("/releases");
    } catch { setErr("Falha de conexão."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/releases/${id}`, { method: "DELETE" });
      router.replace("/releases");
    } catch { setDeleting(false); }
  }

  if (loading) {
    return (
      <div className="content scroll">
        <div className="content-inner">
          <div className="card empty"><div className="muted">Carregando…</div></div>
        </div>
      </div>
    );
  }

  if (err && !release) {
    return (
      <div className="content scroll">
        <div className="content-inner">
          <div className="card empty"><div className="t">{err}</div></div>
        </div>
      </div>
    );
  }

  const brand = release?.brand ?? null;
  const selVehicles = selectedVeh.map(vid => VEHICLES.find(v => v.id === vid)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const over        = selTokens > (PLAN.total - PLAN.used);
  const last        = STEPS.length - 1;

  const canNext =
    step === 0 ? title.trim().length > 0 :
    step === 1 ? (selectedVeh.length > 0 && !over) :
    true;

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

          <div className="actions">
            <button className="btn btn-quiet btn-sm" onClick={() => router.back()}>Cancelar</button>
            {step > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            {step < last ? (
              <button className="btn btn-dark btn-sm" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" disabled={!title.trim() || saving} onClick={save}>
                {saving ? "Salvando…" : <><Check size={15} /> Salvar alterações</>}
              </button>
            )}
          </div>
        </div>

        {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{err}</p>}

        {step === 0 && (
          <StepContent
            title={title} setTitle={setTitle}
            subtitle={subtitle} setSubtitle={setSubtitle}
            body={body} setBody={setBody}
            cat={cat} setCat={setCat}
            author={author} setAuthor={setAuthor}
            images={images}
            onAddImage={url => setImages(prev => [...prev, url])}
            onRemoveImage={url => setImages(prev => prev.filter(u => u !== url))}
            brand={brand}
            authors={authors}
          />
        )}
        {step === 1 && <StepVehicles selected={selectedVeh} setSelected={setSelectedVeh} />}
        {step === 2 && (
          <StepSchedule
            status={status} setStatus={setStatus}
            schedDate={schedDate} setSchedDate={setSchedDate}
            schedTime={schedTime} setSchedTime={setSchedTime}
            title={title} body={body} subtitle={subtitle} cat={cat}
            selectedVeh={selectedVeh} brand={brand}
          />
        )}
      </div>

      {showDelete && (
        <DeleteModal
          title={title}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
