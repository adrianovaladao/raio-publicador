"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft, ArrowRight, Check, ChevronDown,
  Image as ImageIcon, Rocket, Calendar, X, Search,
  List, LayoutGrid, Plus, Download, Upload, Cloud, CloudOff,
} from "lucide-react";
import { extractDominantColor } from "@/lib/color";
import { RichEditor } from "@/components/editor/RichEditor";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";

// ── Dados mock ──────────────────────────────────────────────────────────────

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

const VEH_CATS = ["Todos","Economia","Negócios","Franquias","Varejo","Tecnologia","Geral"];
const VEH_UFS  = ["Todas","SP","RJ","MG","RS","PE","DF","GO","AM"];
const PLAN = { total: 5000, used: 3200 };


const BRAND_COLORS = ["#C25E00","#2A6FDB","#2F8A5B","#6D3BD9","#0E7C86","#B0322E","#8A6500","#1A1A1A"];
const BRAND_SEGMENTS = ["Franquias","Tecnologia","Saúde","Economia","Varejo","Negócios","Educação","Serviços","Indústria","Outro"];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const STEPS = ["Marca", "Conteúdo", "Veículos & créditos", "Revisão"];

// ── Passo 0: Marca ────────────────────────────────────────────────────────────

type Brand = { id: string; name: string; segment: string | null; color: string | null; logoUrl?: string | null; authors?: string[]; releases?: number; tone?: boolean };

function NewBrandModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: Brand) => void }) {
  const [name,    setName]    = useState("");
  const [segment, setSegment] = useState(BRAND_SEGMENTS[0]);
  const [color,   setColor]   = useState(BRAND_COLORS[0]);
  const [site,    setSite]    = useState("");
  const [contact, setContact] = useState("");
  const [desc,    setDesc]    = useState("");
  const [boiler,  setBoiler]  = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
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
      let logoUrl: string | null = null;
      if (logoFile) {
        const form = new FormData();
        form.append("file", logoFile);
        const res  = await fetch("/api/upload", { method: "POST", body: form });
        const text = await res.text();
        let data: { url?: string } = {};
        try { data = JSON.parse(text); } catch { /* ignore */ }
        logoUrl = data.url ?? null;
      }
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), segment, color, site: site.trim() || null, contact: contact.trim() || null, description: desc.trim() || null, boilerplate: boiler.trim() || null, logoUrl }),
      });
      const text = await res.text();
      if (!res.ok) { setErr(`Erro ${res.status}`); return; }
      const nb: Brand = JSON.parse(text);
      onCreate(nb);
    } catch (e) { setErr(e instanceof Error ? e.message : "Falha de conexão."); }
    finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Cadastrar nova <em>marca</em></h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body">
          {/* Preview */}
          <div className="nb-preview">
            <div style={{ width: 40, height: 40, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
              {logoPreview
                ? <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "#fff" }}>{initials(name) || "?"}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="nb-pv-nm">{name.trim() || "Nome da marca"}</div>
              <div className="nb-pv-sg">{segment}{site.trim() ? ` · ${site.trim()}` : ""}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
          </div>
          {/* Logo */}
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
          {/* Campos */}
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
        {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 13, margin: "0 24px 12px", fontWeight: 500 }}>{err}</p>}
        <div className="m-foot" style={{ justifyContent: "flex-end" }}>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-sm" disabled={!name.trim() || saving} onClick={submit}>
              <Check size={15} /> {saving ? "Criando…" : "Criar marca"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBrand({ selected, onSelect, brands, onAddBrand }: {
  selected: Brand | null;
  onSelect: (b: Brand) => void;
  brands: Brand[];
  onAddBrand: (b: Brand) => void;
}) {
  const [mode, setMode] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = brands.filter(b =>
    !q.trim() || (b.name + b.segment).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="brand-pick">
      <div className="bp-head">
        <p className="eyebrow">Passo 1 · Marca</p>
        <h3>Para qual <em>marca</em> é este release?</h3>
        <p className="muted" style={{ fontSize: 14, maxWidth: "56ch" }}>
          O conteúdo, o tom de voz e os relatórios ficam vinculados à marca escolhida.
        </p>
      </div>

      {/* Toolbar igual à biblioteca */}
      <div className="toolbar">
        <div className="chips">
          <span className="chip active">Todas <span className="ct">{brands.length}</span></span>
        </div>
        <div className="spacer" />
        <input
          className="input"
          placeholder="Buscar marcas…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ width: 200, padding: "8px 14px", fontSize: 13 }}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova marca
        </button>
        <div className="seg">
          <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}><List size={15} /> Lista</button>
          <button className={mode === "grid" ? "active" : ""} onClick={() => setMode("grid")}><LayoutGrid size={15} /> Grade</button>
        </div>
      </div>

      {/* Grade — igual ao lib-grid dos releases */}
      {mode === "grid" && (
        <div className="lib-grid">
          {filtered.map(b => (
            <div
              key={b.id}
              className={`card lib-card${selected?.id === b.id ? " selected" : ""}`}
              style={{ cursor: "pointer", boxShadow: selected?.id === b.id ? "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)" : "none" }}
              onClick={() => onSelect(b)}
            >
              <div className="thumb" style={{ background: b.color ?? "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {b.logoUrl
                  ? <img src={b.logoUrl} alt={b.name} style={{ width: "60%", height: "60%", objectFit: "contain" }} />
                  : <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 32, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>{initials(b.name)}</span>
                }
                {selected?.id === b.id && (
                  <span style={{ position: "absolute", top: 10, right: 10, background: "var(--coral)", borderRadius: 99, width: 24, height: 24, display: "grid", placeItems: "center" }}>
                    <Check size={13} color="#fff" />
                  </span>
                )}
              </div>
              <div className="body">
                <h4>{b.name}</h4>
                <p className="ex" style={{ margin: "4px 0 0" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)" }}>{b.segment}</span>
                  {" · "}{b.releases} releases
                </p>
                <div className="foot" style={{ marginTop: 10 }}>
                  {b.tone
                    ? <span className="badge-status published">tom configurado</span>
                    : <span className="badge-status review">tom pendente</span>}
                </div>
              </div>
            </div>
          ))}

          {/* Card "Nova marca" */}
          <div
            className="lib-card-new"
            onClick={() => setShowModal(true)}
          >
            <div className="lib-card-new-icon"><Plus size={22} /></div>
            <div className="lib-card-new-label">Nova marca</div>
            <div className="lib-card-new-sub">CADASTRAR CLIENTE</div>
          </div>
        </div>
      )}

      {/* Lista — igual ao tbl dos releases */}
      {mode === "list" && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Segmento</th>
                <th>Releases</th>
                <th>Tom de voz</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr
                  key={b.id}
                  style={{ cursor: "pointer", background: selected?.id === b.id ? "rgba(250,181,0,0.06)" : undefined }}
                  onClick={() => onSelect(b)}
                >
                  <td className="title-cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: b.color ?? "#1A1A1A", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, color: "#fff", flex: "none", overflow: "hidden" }}>
                      {b.logoUrl ? <img src={b.logoUrl} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : initials(b.name)}
                    </div>
                    {b.name}
                    {selected?.id === b.id && <Check size={14} color="var(--coral)" style={{ marginLeft: "auto" }} />}
                  </td>
                  <td className="muted">{b.segment}</td>
                  <td className="num">{b.releases}</td>
                  <td>
                    {b.tone
                      ? <span className="badge-status published">configurado</span>
                      : <span className="badge-status review">pendente</span>}
                  </td>
                </tr>
              ))}
              {/* Linha "Nova marca" */}
              <tr style={{ cursor: "pointer", background: "var(--cream)" }} onClick={() => setShowModal(true)}>
                <td style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--stone)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px dashed var(--sand)", display: "grid", placeItems: "center", flex: "none" }}>
                    <Plus size={14} color="var(--stone)" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Nova marca</span>
                </td>
                <td className="muted" style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cadastrar cliente</td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewBrandModal
          onClose={() => setShowModal(false)}
          onCreate={b => { onAddBrand(b); onSelect(b); setShowModal(false); }}
        />
      )}
    </div>
  );
}

// ── Passo 1: Conteúdo ────────────────────────────────────────────────────────

interface Content { title: string; subtitle: string; body: string; cat: string; author: string; imageUrl?: string }

function MediaCard({ imageUrl, onChange }: { imageUrl?: string; onChange: (url: string | undefined) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setErr("Apenas imagens JPG ou PNG."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Arquivo muito grande (máx. 5 MB)."); return; }
    // Valida dimensões antes de fazer upload
    const dims = await new Promise<{ w: number; h: number }>(res => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { res({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { res({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
      img.src = url;
    });
    if (dims.w < 1200 || dims.h < 630) {
      setErr(`Imagem muito pequena (${dims.w}×${dims.h}px). Mínimo: 1200×630px.`); return;
    }
    if (dims.w > 3600 || dims.h > 1890) {
      setErr(`Imagem muito grande (${dims.w}×${dims.h}px). Máximo: 3600×1890px.`); return;
    }
    setErr(""); setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const text = await res.text();
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(text); } catch { /* ignore */ }
      if (!res.ok || !data.url) { setErr(data.error ?? "Falha no upload."); return; }
      onChange(data.url);
    } catch { setErr("Falha de conexão."); }
    finally { setUploading(false); }
  }

  return (
    <div className="card side-card">
      <div className="card-head"><h3>Mídia</h3></div>
      <div className="sc-body">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        {imageUrl ? (
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Capa do release" style={{ width: "100%", borderRadius: 8, display: "block", maxHeight: 180, objectFit: "cover" }} />
            <button type="button" onClick={() => onChange(undefined)}
              style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", padding: "4px 8px", fontSize: 12 }}>
              Remover
            </button>
            <button type="button" className="btn btn-quiet btn-sm" style={{ marginTop: 8, width: "100%" }} onClick={() => fileRef.current?.click()}>
              Trocar imagem
            </button>
          </div>
        ) : (
          <div
            className={`attach${dragging ? " drag-over" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ cursor: "pointer" }}
          >
            {uploading
              ? <><ImageIcon size={22} /><div className="t">Enviando…</div></>
              : <><ImageIcon size={22} /><div className="t">Arraste imagens aqui</div><div className="h">JPG ou PNG · até 5 MB</div></>}
          </div>
        )}
        {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 12, margin: "6px 0 0" }}>{err}</p>}
      </div>
    </div>
  );
}

function StepContent({ content, setContent, brand, ownerName }: { content: Content; setContent: (c: Content) => void; brand: Brand | null; ownerName: string }) {
  const brandAuthors = brand?.authors ?? [];
  const authors = brandAuthors.length > 0 ? brandAuthors : [ownerName].filter(Boolean);
  const up = (k: keyof Content, v: string) => setContent({ ...content, [k]: v });
  const cats = VEH_CATS.filter(c => c !== "Todos");

  return (
    <div className="composer-grid">
      <RichEditor
        title={content.title}
        onTitleChange={v => up("title", v)}
        subtitle={content.subtitle}
        onSubtitleChange={v => up("subtitle", v)}
        content={content.body}
        onContentChange={v => up("body", v)}
        brandName={brand?.name}
      />

      <div>
        <div className="card side-card">
          <div className="card-head"><h3>Detalhes</h3></div>
          <div className="sc-body">
            <div className="field-row">
              <label>Categoria</label>
              <div className="select-wrap">
                <select className="input" value={content.cat} onChange={e => up("cat", e.target.value)}>
                  {cats.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field-row">
              <label>Autor</label>
              <div className="select-wrap">
                <select className="input" value={content.author} onChange={e => up("author", e.target.value)}>
                  {authors.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        <MediaCard imageUrl={content.imageUrl} onChange={url => up("imageUrl", url ?? "")} />
      </div>
    </div>
  );
}

// ── Passo 2: Veículos ────────────────────────────────────────────────────────

function StepVehicles({ selected, setSelected }: { selected: string[]; setSelected: (s: string[]) => void }) {
  const [cat, setCat] = useState("Todos");
  const [uf, setUf]   = useState("Todas");
  const [q, setQ]     = useState("");

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
      {/* Lista */}
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
          <button
            className="link"
            style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              const allIds = list.map(v => v.id);
              const allSel = allIds.every(id => selected.includes(id));
              setSelected(allSel ? selected.filter(id => !allIds.includes(id)) : [...new Set([...selected, ...allIds])]);
            }}
          >Selecionar todos</button>
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
              <div className="reach">
                <div className="n">{fmtReach(v.reach)}</div>
                <div className="u">alcance/mês</div>
              </div>
              <div className="cost">
                <span className="tk">{v.tokens}</span>
                <span style={{ color: "var(--coral-ink)", fontSize: 16 }}>⚡</span>
              </div>
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
            <span><i style={{ background: "var(--ink)",   display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Já usados {PLAN.used.toLocaleString("pt-BR")}</span>
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

// ── DatePicker customizado ───────────────────────────────────────────────────

const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW_SHORT  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// Feriados nacionais fixos (MM-DD) e variáveis por ano
function getBrHolidays(year: number): Set<string> {
  // Cálculo da Páscoa (algoritmo de Meeus/Jones/Butcher)
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const add = (d: Date, days: number) => { const r = new Date(d); r.setDate(r.getDate() + days); return r; };

  const holidays = new Set<string>([
    `${year}-01-01`, // Confraternização Universal
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Dia do Trabalho
    `${year}-09-07`, // Independência do Brasil
    `${year}-10-12`, // Nossa Senhora Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-11-20`, // Consciência Negra
    `${year}-12-25`, // Natal
    fmt(add(easter, -48)), // Segunda de Carnaval
    fmt(add(easter, -47)), // Terça de Carnaval
    fmt(add(easter, -2)),  // Sexta-feira Santa
    fmt(easter),            // Páscoa
    fmt(add(easter, 60)),  // Corpus Christi
  ]);
  return holidays;
}

function isBlockedDate(key: string): boolean {
  const d = new Date(key + "T12:00:00");
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return true; // domingo ou sábado
  const holidays = getBrHolidays(d.getFullYear());
  return holidays.has(key);
}

function DatePicker({ value, onChange, minDate, maxDate }: {
  value: string;
  onChange: (d: string) => void;
  minDate: string;
  maxDate: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const parsed = value ? new Date(value + "T12:00:00") : new Date();
  const [viewY, setViewY] = useState(parsed.getFullYear());
  const [viewM, setViewM] = useState(parsed.getMonth());

  const fmtDisplay = (iso: string) => {
    const d = new Date(iso + "T12:00:00");
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  const closeOnOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [open, closeOnOutside]);

  const firstDay = new Date(viewY, viewM, 1);
  const lead = firstDay.getDay();
  const dim = new Date(viewY, viewM + 1, 0).getDate();
  const prevDim = new Date(viewY, viewM, 0).getDate();
  const cells: { d: number; out: boolean; key: string }[] = [];
  for (let i = 0; i < lead; i++) {
    const d = new Date(viewY, viewM - 1, prevDim - lead + 1 + i);
    cells.push({ d: d.getDate(), out: true, key: toKey(d) });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ d, out: false, key: toKey(new Date(viewY, viewM, d)) });
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(viewY, viewM + 1, cells.length - (lead + dim) + 1);
    cells.push({ d: d.getDate(), out: true, key: toKey(d) });
  }

  function shiftMonth(dir: number) {
    let nm = viewM + dir, ny = viewY;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setViewM(nm); setViewY(ny);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input"
        style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}
      >
        <span style={{ color: value ? "var(--ink)" : "var(--stone)" }}>
          {value ? fmtDisplay(value) : "Selecione uma data"}
        </span>
        <Calendar size={15} style={{ color: "var(--stone)", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 999,
          background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)", padding: 16, width: 280,
        }}>
          {/* cabeçalho mês/ano */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "var(--stone)" }}>
              <ArrowLeft size={14} />
            </button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
              {MESES_FULL[viewM]} {viewY}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "var(--stone)" }}>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* dias da semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DOW_SHORT.map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, paddingBottom: 6, color: i === 0 || i === 6 ? "#E0B0A0" : "var(--stone)" }}>{d}</div>
            ))}
          </div>

          {/* células */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((c, i) => {
              const blocked  = !c.out && isBlockedDate(c.key);
              const disabled = c.out || c.key < minDate || c.key > maxDate || blocked;
              const selected = c.key === value;
              const isToday  = c.key === toKey(new Date());
              const isWeekend = !c.out && (() => { const dow = new Date(c.key + "T12:00:00").getDay(); return dow === 0 || dow === 6; })();
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(c.key); setOpen(false); }}
                  title={blocked && !isWeekend ? "Feriado nacional" : isWeekend ? "Fim de semana" : undefined}
                  style={{
                    border: isToday && !selected ? "1.5px solid var(--ink)" : "1.5px solid transparent",
                    borderRadius: 8,
                    background: selected ? "var(--ink)" : "none",
                    color: selected ? "#fff" : (c.out || disabled) ? "var(--line)" : "var(--ink)",
                    fontSize: 12,
                    fontWeight: selected ? 700 : 400,
                    padding: "6px 0",
                    cursor: disabled ? "default" : "pointer",
                    textAlign: "center",
                    opacity: blocked && !c.out ? 0.35 : 1,
                  }}
                >
                  {c.d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Passo 3: Revisão ─────────────────────────────────────────────────────────

interface When { mode: "now" | "schedule"; date: string }

const BOILERPLATE = (brand: Brand | null) =>
  brand
    ? `Sobre ${brand.name}: referência no segmento de ${(brand.segment ?? "").toLowerCase()}, com atuação nacional e foco em inovação e proximidade com o cliente.`
    : "";

async function downloadDocx(content: Content, selVehicles: typeof VEHICLES, brand: Brand | null) {
  const brandName = brand?.name ?? "Marca";
  const slug = content.title.slice(0, 40).replace(/\s+/g, "-").toLowerCase() || "release";

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 24 } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      children: [
        // Cabeçalho — marca
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: brandName.toUpperCase(), bold: true, size: 18, color: "848484", font: "Calibri" }),
            new TextRun({ text: `  ·  ${content.cat}`, size: 18, color: "848484", font: "Calibri" }),
          ],
        }),

        // Título
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 160 },
          children: [new TextRun({ text: content.title || "Título do release", bold: true, size: 52, font: "Calibri" })],
        }),

        // Subtítulo
        ...(content.subtitle ? [new Paragraph({
          spacing: { after: 320 },
          children: [new TextRun({ text: content.subtitle, italics: true, size: 30, color: "555555", font: "Calibri" })],
        })] : []),

        // Divisor
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
          spacing: { after: 320 },
          children: [],
        }),

        // Corpo
        ...content.body.split("\n").filter(Boolean).map(line =>
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: line, size: 24, font: "Calibri" })],
            alignment: AlignmentType.JUSTIFIED,
          })
        ),

        // Boilerplate
        ...(brand ? [
          new Paragraph({ spacing: { after: 120, before: 400 }, children: [] }),
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 160 },
            children: [new TextRun({ text: "SOBRE A EMPRESA", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          new Paragraph({
            spacing: { after: 320 },
            children: [new TextRun({ text: BOILERPLATE(brand), size: 22, color: "555555", font: "Calibri" })],
          }),
        ] : []),

        // Veículos
        ...(selVehicles.length > 0 ? [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 160 },
            children: [new TextRun({ text: "VEÍCULOS SELECIONADOS", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Veículo", "Editoria", "UF", "Tier", "Alcance"].map(h =>
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: "F1F0EC" },
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri" })] })],
                  })
                ),
              }),
              ...selVehicles.map(v =>
                new TableRow({
                  children: [
                    v.name, v.cat, v.uf, v.tier, fmtReach(v.reach),
                  ].map(val =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: val, size: 18, font: "Calibri" })] })],
                    })
                  ),
                })
              ),
            ],
          }),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug}.docx`);
}

function StepReview({ content, selected, when, setWhen, brand }: {
  content: Content; selected: string[]; when: When; setWhen: (w: When) => void; brand: Brand | null;
}) {
  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="composer-grid">
      <div className="card">
        <div className="card-head">
          <h3>Pré-visualização do <em>release</em></h3>
          <div className="row" style={{ gap: 10 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => downloadDocx(content, selVehicles, brand)}
              title="Baixar como Word"
            >
              <Download size={14} /> Baixar .docx
            </button>
          </div>
        </div>
        <div className="card-pad">
          {brand && (
            <div className="review-brand">
              <span className="bc-av" style={{ background: brand.color ?? "#1A1A1A", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : initials(brand.name)}
              </span>
              <div className="bc-meta">
                <span className="bc-lbl">Marca</span>
                <span className="bc-nm">{brand.name}</span>
              </div>
            </div>
          )}
          <p className="eyebrow" style={{ marginBottom: 14 }}>{content.cat} · {content.author}</p>
          <h2 style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.025em", lineHeight: 1.12, margin: "0 0 10px" }}>
            {content.title || "Título do release"}
          </h2>
          <p className="serif-it" style={{ fontSize: 18, color: "var(--ink-soft)", margin: "0 0 18px" }}>
            {content.subtitle || "Subtítulo / linha de apoio do release."}
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {content.body || "O corpo do release aparece aqui exatamente como será distribuído aos veículos selecionados."}
          </p>
        </div>
      </div>

      <div>
        <div className="card side-card">
          <div className="card-head"><h3>Distribuição</h3></div>
          <div className="sc-body">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Veículos</span><span style={{ fontWeight: 700 }}>{selVehicles.length}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Alcance estimado</span><span style={{ fontWeight: 700 }}>{fmtReach(selReach)}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 13 }}>Créditos</span>
              <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>{selTokens} <span style={{ color: "var(--coral)", fontSize: 14 }}>⚡</span></span>
            </div>
          </div>
        </div>

        <div className="card side-card">
          <div className="card-head"><h3>Quando publicar</h3></div>
          <div className="sc-body">
            <div className="seg" style={{ width: "100%", marginBottom: 14 }}>
              <button className={when.mode === "now" ? "active" : ""} style={{ flex: 1, justifyContent: "center" }} onClick={() => setWhen({ ...when, mode: "now" })}>
                <Rocket size={15} /> Agora
              </button>
              <button className={when.mode === "schedule" ? "active" : ""} style={{ flex: 1, justifyContent: "center" }} onClick={() => setWhen({ ...when, mode: "schedule" })}>
                <Calendar size={15} /> Agendar
              </button>
            </div>
            {when.mode === "schedule" && (() => {
              const today = new Date();
              const minDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
              const lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
              const maxDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
              return (
                <div className="field-row" style={{ marginBottom: 0 }}>
                  <label>Data</label>
                  <DatePicker value={when.date} onChange={d => setWhen({ ...when, date: d })} minDate={minDate} maxDate={maxDate} />
                </div>
              );
            })()}
            {when.mode === "now" && (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                O release entra na fila de envio e começa a ser distribuído em poucos minutos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página raiz ───────────────────────────────────────────────────────────────

export default function NovoReleasePage() {
  const router  = useRouter();
  const [ownerName, setOwnerName] = useState("");

  useEffect(() => {
    fetch("/api/team")
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { if (data[0]) setOwnerName(data[0].name); })
      .catch(() => {});
  }, []);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [content, setContent] = useState<Content>({ title: "", subtitle: "", body: "", cat: "Negócios", author: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()+1).padStart(2,"0")}`;
  const [when, setWhen] = useState<When>({ mode: "schedule", date: defaultDate });
  const [submitting, setSubmitting] = useState(false);

  // ── Autosave ─────────────────────────────────────────────────────────────
  const draftIdRef  = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null);

  const contentRef  = useRef(content);
  const brandRef    = useRef(brand);
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { brandRef.current   = brand;   }, [brand]);

  async function autosave() {
    const c = contentRef.current;
    const b = brandRef.current;
    if (!b || !c.title.trim()) return;
    setSaveStatus("saving");
    try {
      const payload = {
        title:   c.title,
        body:    c.body,
        summary: c.subtitle,
        status:  "DRAFT",
        scheduledAt: null,
        brandId: b.id,
        creditsUsed: 0,
        imageUrl: c.imageUrl || null,
      };
      if (draftIdRef.current) {
        await fetch(`/api/releases/${draftIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res  = await fetch("/api/releases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as { id: string };
        draftIdRef.current = data.id;
      }
      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch {
      setSaveStatus("error");
    }
  }

  useEffect(() => {
    const id = setInterval(autosave, 2 * 60 * 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/brands")
      .then(r => r.json())
      .then((data: unknown) => {
        setBrands(Array.isArray(data) ? (data as Brand[]) : []);
      })
      .catch(() => setBrands([]));
  }, []);

  const last = STEPS.length - 1;

  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const over        = selTokens > (PLAN.total - PLAN.used);

  const canNext =
    step === 0 ? !!brand :
    step === 1 ? content.title.trim().length > 0 :
    step === 2 ? (selected.length > 0 && !over) :
    true;

  // ── Tela de sucesso ───────────────────────────────────────────────────────
  if (done) {
    const scheduled = when.mode === "schedule";
    const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
    const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);
    return (
      <div className="content scroll">
        <div className="content-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>
            {/* Ícone */}
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: scheduled ? "var(--amber-soft)" : "var(--green-soft)", display: "grid", placeItems: "center", margin: "0 auto 28px" }}>
              {scheduled
                ? <Calendar size={32} color="var(--coral-ink)" />
                : <Rocket size={32} color="var(--green)" />}
            </div>

            {/* Título */}
            <h2 style={{ fontFamily: "var(--sans)", fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
              {scheduled ? "Release agendado!" : "Release publicado!"}
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 32px" }}>
              {scheduled
                ? <>O release <strong style={{ color: "var(--ink)" }}>&ldquo;{content.title}&rdquo;</strong> será enviado em {when.date.split("-").reverse().join("/")} para <strong style={{ color: "var(--ink)" }}>{selVehicles.length} veículos</strong>.</>
                : <>O release <strong style={{ color: "var(--ink)" }}>&ldquo;{content.title}&rdquo;</strong> está sendo distribuído agora para <strong style={{ color: "var(--ink)" }}>{selVehicles.length} veículos</strong>, com alcance estimado de <strong style={{ color: "var(--ink)" }}>{fmtReach(selReach)}</strong>.</>}
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 36 }}>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Veículos</div>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>{selVehicles.length}</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Alcance</div>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>{fmtReach(selReach)}</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Marca</div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", marginTop: 6 }}>{brand?.name ?? "—"}</div>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => router.push("/releases")}>
                Ver biblioteca
              </button>
              <button className="btn btn-dark" onClick={() => router.push("/dashboard")}>
                Ir para o dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="actions" style={{ alignItems: "center" }}>
            {content.title.trim() && content.subtitle.trim() && (
              <span className="badge-status review">Rascunho</span>
            )}
            <button className="btn btn-quiet btn-sm" onClick={() => router.back()}>Cancelar</button>
            {/* Indicador de autosave */}
            {saveStatus !== "idle" && (
              <span style={{ fontSize: 12, color: saveStatus === "error" ? "var(--coral)" : "var(--stone)", display: "flex", alignItems: "center", gap: 5 }}>
                {saveStatus === "saving" && <><Cloud size={13} style={{ opacity: 0.6 }} /> Salvando…</>}
                {saveStatus === "saved"  && <><Cloud size={13} /> Salvo {lastSaved ? `às ${String(lastSaved.getHours()).padStart(2,"0")}:${String(lastSaved.getMinutes()).padStart(2,"0")}` : ""}</>}
                {saveStatus === "error"  && <><CloudOff size={13} /> Erro ao salvar</>}
              </span>
            )}
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            {step < last ? (
              <button className="btn btn-dark" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={submitting} onClick={async () => {
                if (!brand) return;
                setSubmitting(true);
                try {
                  const scheduledAt = when.mode === "schedule" && when.date
                    ? new Date(`${when.date}T12:00:00`).toISOString()
                    : null;
                  const status = when.mode === "now" ? "PUBLISHED" : "SCHEDULED";
                  const payload = {
                    title: content.title,
                    body: content.body,
                    summary: content.subtitle,
                    status,
                    scheduledAt,
                    brandId: brand.id,
                    creditsUsed: 0,
                    imageUrl: content.imageUrl || null,
                  };
                  if (draftIdRef.current) {
                    await fetch(`/api/releases/${draftIdRef.current}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                  } else {
                    await fetch("/api/releases", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                  }
                  setDone(true);
                } catch {
                  alert("Erro ao salvar release. Tente novamente.");
                } finally {
                  setSubmitting(false);
                }
              }}>
                {submitting
                  ? "Salvando…"
                  : when.mode === "now"
                    ? <><Rocket size={16} /> Publicar agora</>
                    : <><Calendar size={16} /> Agendar release</>}
              </button>
            )}
          </div>
        </div>

        {step === 0 && <StepBrand selected={brand} onSelect={setBrand} brands={brands} onAddBrand={b => setBrands(prev => [...prev, b])} />}
        {step === 1 && <StepContent content={content} setContent={setContent} brand={brand} ownerName={ownerName} />}
        {step === 2 && <StepVehicles selected={selected} setSelected={setSelected} />}
        {step === 3 && <StepReview content={content} selected={selected} when={when} setWhen={setWhen} brand={brand} />}
      </div>
    </div>
  );
}
