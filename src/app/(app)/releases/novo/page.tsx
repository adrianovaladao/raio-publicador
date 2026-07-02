"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft, ArrowRight, Check, ChevronDown,
  Rocket, Calendar, X, Search,
  List, LayoutGrid, Plus, Download, Upload, Cloud, CloudOff,
  SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  Sparkles, Loader, AlertTriangle, AlertCircle, ShieldCheck,
} from "lucide-react";
import { extractDominantColor } from "@/lib/color";
import { RichEditor } from "@/components/editor/RichEditor";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";

type VehicleItem = { id: string; name: string; domain: string; cat: string; tier: string; reach: number; logoUrl?: string | null };


const VEH_CATS_ALL  = ["Geral","Negócios","Tecnologia","Esportes","Economia","Saúde","Entretenimento","Política","Jurídico","Agronegócio"];
const VEH_TIERS_ALL = ["A","B","C","D","E"];
const PAGE_SIZE      = 25;
const TIER_TOKENS_MAP: Record<string, number> = { A: 100, B: 60, C: 40, D: 20, E: 0 };
const TIER_ORDER_MAP:  Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
const TIER_COLORS_MAP: Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017", D: "#3A7DC9", E: "#D0DFF0" };
const TIER_FG_MAP:     Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff",    D: "#fff",    E: "#3A5A80" };

type VehSortCol = "name" | "tier" | "reach" | "tokens";
type VehSortDir = "asc" | "desc";
type SubInfo = { credits: number; creditsUsed: number };


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
                <div className="foot" style={{ marginTop: 10 }} />
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
                  <td />
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

interface Content { title: string; subtitle: string; body: string; cat: string; author: string; imageUrls: string[] }

function SelectBox({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="input"
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}
        onClick={() => setOpen(o => !o)}
      >
        <span>{value}</span>
        <ChevronDown size={15} style={{ color: "var(--stone)", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden" }}>
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              style={{ width: "100%", textAlign: "left", padding: "9px 14px", background: opt === value ? "var(--cream)" : "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--ink)", fontWeight: opt === value ? 600 : 400 }}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function StepContent({ content, setContent, brand, ownerName }: { content: Content; setContent: (c: Content) => void; brand: Brand | null; ownerName: string }) {
  const brandAuthors = brand?.authors ?? [];
  const authors = brandAuthors.length > 0 ? brandAuthors : [ownerName].filter(Boolean);
  const up = (k: keyof Content, v: string | string[]) => setContent({ ...content, [k]: v });
  const cats = VEH_CATS_ALL;

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
              <SelectBox value={content.cat} options={cats} onChange={v => up("cat", v)} />
            </div>
            <div className="field-row">
              <label>Autor</label>
              <SelectBox value={content.author} options={authors} onChange={v => up("author", v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Passo 2: Veículos ────────────────────────────────────────────────────────

function VehFilterModal({ cats, tiers, onApply, onClose }: {
  cats: string[]; tiers: string[];
  onApply: (cats: string[], tiers: string[]) => void;
  onClose: () => void;
}) {
  const [selCats,  setSelCats]  = useState<string[]>(cats);
  const [selTiers, setSelTiers] = useState<string[]>(tiers);
  const toggleCat  = (c: string) => setSelCats(prev  => prev.includes(c)  ? prev.filter(x => x !== c)  : [...prev, c]);
  const toggleTier = (t: string) => setSelTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const activeCount = selCats.length + selTiers.length;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="m-head">
          <h3>Filtrar veículos</h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Categoria</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VEH_CATS_ALL.map(c => (
                <button key={c} onClick={() => toggleCat(c)} className={`chip${selCats.includes(c) ? " active" : ""}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Tier</p>
            <div style={{ display: "flex", gap: 8 }}>
              {VEH_TIERS_ALL.map(t => (
                <button key={t} onClick={() => toggleTier(t)} className={`chip${selTiers.includes(t) ? " active" : ""}`}>Tier {t}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="m-foot" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelCats([]); setSelTiers([]); }}>Limpar filtros</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={() => { onApply(selCats, selTiers); onClose(); }}>
              Aplicar {activeCount > 0 ? `(${activeCount})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehSortIcon({ col, active, dir }: { col: string; active: string; dir: VehSortDir }) {
  if (col !== active) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: 3 }} />;
  return dir === "asc"
    ? <ArrowUp size={12} style={{ marginLeft: 3, color: "var(--coral-ink)" }} />
    : <ArrowDown size={12} style={{ marginLeft: 3, color: "var(--coral-ink)" }} />;
}

function sortVeh(arr: VehicleItem[], col: VehSortCol, dir: VehSortDir) {
  return [...arr].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (col === "tokens") { va = TIER_TOKENS_MAP[a.tier] ?? 0; vb = TIER_TOKENS_MAP[b.tier] ?? 0; }
    else if (col === "tier") { va = TIER_ORDER_MAP[a.tier] ?? 99; vb = TIER_ORDER_MAP[b.tier] ?? 99; }
    else if (col === "reach") { va = a.reach; vb = b.reach; }
    else { va = (a.name ?? "").toLowerCase(); vb = (b.name ?? "").toLowerCase(); }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function StepVehicles({ selected, setSelected, vehicles, sub }: { selected: string[]; setSelected: (s: string[]) => void; vehicles: VehicleItem[]; sub: SubInfo }) {
  const [filterCats,  setFilterCats]  = useState<string[]>([]);
  const [filterTiers, setFilterTiers] = useState<string[]>([]);
  const [q,           setQ]           = useState("");
  const [page,        setPage]        = useState(1);
  const [sortCol,     setSortCol]     = useState<VehSortCol>("reach");
  const [sortDir,     setSortDir]     = useState<VehSortDir>("desc");
  const [showFilter,  setShowFilter]  = useState(false);

  const resetPage = () => setPage(1);

  function handleSort(col: VehSortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    resetPage();
  }

  const activeFilters = filterCats.length + filterTiers.length;

  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const remove = (id: string) => setSelected(selected.filter(x => x !== id));

  const baseFiltered = vehicles.filter(v =>
    (filterCats.length  === 0 || filterCats.includes(v.cat))  &&
    (filterTiers.length === 0 || filterTiers.includes(v.tier)) &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );
  const filtered   = sortVeh(baseFiltered, sortCol, sortDir);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const list       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selVehicles = selected.map(id => vehicles.find(v => v.id === id)).filter(Boolean) as VehicleItem[];
  const selTokens   = selVehicles.reduce((s, v) => s + (TIER_TOKENS_MAP[v.tier] ?? 0), 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);
  const left        = sub.credits - sub.creditsUsed;
  const over        = selTokens > left;
  const usedPct     = sub.credits > 0 ? (sub.creditsUsed / sub.credits) * 100 : 0;
  const nowPct      = sub.credits > 0 ? Math.min((selTokens / sub.credits) * 100, 100 - usedPct) : 0;

  const sortBtnStyle = (col: VehSortCol): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", background: "none", border: "none",
    cursor: "pointer", padding: "2px 4px", borderRadius: 4, fontSize: 11,
    fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase",
    color: sortCol === col ? "var(--coral-ink)" : "var(--stone)", fontWeight: sortCol === col ? 700 : 400,
  });

  return (
    <>
    <div className="veh-layout">
      {/* Lista */}
      <div className="card veh-list">
        <div className="vh-toolbar">
          <button
            className={`btn btn-ghost btn-sm${activeFilters > 0 ? " active" : ""}`}
            onClick={() => setShowFilter(true)}
            style={{ gap: 6 }}
          >
            <SlidersHorizontal size={14} />
            Filtrar
            {activeFilters > 0 && (
              <span style={{ background: "var(--coral)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px", marginLeft: 2 }}>
                {activeFilters}
              </span>
            )}
          </button>
          {activeFilters > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--stone)" }} onClick={() => { setFilterCats([]); setFilterTiers([]); resetPage(); }}>
              <X size={13} /> Limpar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <div className="search">
            <Search size={16} />
            <input placeholder="Buscar veículo…" value={q} onChange={e => { setQ(e.target.value); resetPage(); }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", borderBottom: "1px solid var(--line)" }}>
          <span className="eyebrow">{filtered.length} veículos</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={sortBtnStyle("name")} onClick={() => handleSort("name")}>
              Nome <VehSortIcon col="name" active={sortCol} dir={sortDir} />
            </button>
            <button style={sortBtnStyle("tier")} onClick={() => handleSort("tier")}>
              Tier <VehSortIcon col="tier" active={sortCol} dir={sortDir} />
            </button>
            <button style={sortBtnStyle("reach")} onClick={() => handleSort("reach")}>
              Alcance <VehSortIcon col="reach" active={sortCol} dir={sortDir} />
            </button>
            <button style={sortBtnStyle("tokens")} onClick={() => handleSort("tokens")}>
              Créditos <VehSortIcon col="tokens" active={sortCol} dir={sortDir} />
            </button>
          </div>
          <button
            className="link"
            style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              const allIds = filtered.map(v => v.id);
              const allSel = allIds.every(id => selected.includes(id));
              setSelected(allSel ? selected.filter(id => !allIds.includes(id)) : [...new Set([...selected, ...allIds])]);
            }}
          >Sel. todos</button>
        </div>

        <div>
          {list.map(v => {
            const tkn = TIER_TOKENS_MAP[v.tier] ?? 0;
            return (
              <div key={v.id} className={`veh-row${selected.includes(v.id) ? " sel" : ""}`} onClick={() => toggle(v.id)}>
                <div className="cbx">{selected.includes(v.id) && <Check size={13} />}</div>
                <div className="logo" style={{ background: TIER_COLORS_MAP[v.tier], color: TIER_FG_MAP[v.tier] ?? "#fff", overflow: "hidden" }}>
                  {v.logoUrl ? <img src={v.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(v.name)}
                </div>
                <div>
                  <div className="nm">{v.name}</div>
                  <div className="meta">
                    <span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span>
                    <span className="dom">{v.domain}</span>
                  </div>
                </div>
                <div className="reach">
                  <div className="n">{fmtReach(v.reach)}</div>
                  <div className="u">alcance/mês</div>
                </div>
                <div className="cost">
                  <span className="tk">{tkn}</span>
                  <span style={{ color: "var(--coral-ink)", fontSize: 16 }}>⚡</span>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)", padding: "0 8px" }}>
              {page} / {totalPages}
            </span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
          </div>
        )}
      </div>

      {/* Carrinho */}
      <div className="card cart">
        <div className="cart-head">
          <span className="lbl">Seleção atual</span>
          <div className="big">
            <span className="tk" style={{ color: over ? "var(--red)" : "var(--ink)" }}>{selTokens}</span>
            <span className="of">créditos</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{left.toLocaleString("pt-BR")} disponíveis · {sub.credits.toLocaleString("pt-BR")} total</div>
          <div className="meter">
            <i className="used" style={{ width: usedPct + "%" }} />
            <i className="now"  style={{ width: nowPct  + "%" }} />
          </div>
          <div className="meter-legend">
            <span><i style={{ background: "var(--ink)",   display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Já usados {sub.creditsUsed.toLocaleString("pt-BR")}</span>
            <span><i style={{ background: "var(--coral)", display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Esta seleção {selTokens}</span>
          </div>
        </div>

        {selVehicles.length === 0 ? (
          <div className="cart-empty">Selecione veículos à esquerda para montar a distribuição.</div>
        ) : (
          <div className="sel-list scroll">
            {selVehicles.map(v => (
              <div className="sel-item" key={v.id}>
                <div style={{ background: TIER_COLORS_MAP[v.tier], width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 9, fontFamily: "var(--mono)", fontWeight: 700, color: TIER_FG_MAP[v.tier] ?? "#fff", flex: "none", overflow: "hidden" }}>
                  {v.logoUrl ? <img src={v.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(v.name)}
                </div>
                <span className="nm">{v.name}</span>
                <span className="tk">{TIER_TOKENS_MAP[v.tier] ?? 0}</span>
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

    {showFilter && (
      <VehFilterModal
        cats={filterCats} tiers={filterTiers}
        onApply={(c, t) => { setFilterCats(c); setFilterTiers(t); resetPage(); }}
        onClose={() => setShowFilter(false)}
      />
    )}
    </>
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

// ── Modal de Política Editorial ───────────────────────────────────────────────

function PolicyModal({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const columns: { accent: string; dot: string; Icon: React.ElementType; label: string; items: string[] }[] = [
    {
      accent: "var(--green)", dot: "var(--green-soft)", Icon: Check,
      label: "O que explorar",
      items: [
        "Dados com fonte identificada (pesquisa, instituição, data e metodologia)",
        "Cases de sucesso com autorização das partes envolvidas",
        "Linguagem informativa, objetiva e relevante para o leitor",
        "Análises, evidências concretas e informações verificáveis",
        "Créditos de autoria em todas as imagens (fotógrafo, banco licenciado ou IA)",
      ],
    },
    {
      accent: "var(--coral-ink)", dot: "var(--amber-soft)", Icon: AlertTriangle,
      label: "Evitar",
      items: [
        'Excesso de adjetivos e slogans sem comprovação ("o maior", "líder absoluto")',
        "Referências a outros veículos como fonte (Folha, Veja, Estadão etc.)",
        "Menção a rankings ou premiações sem identificar a fonte",
        "Mensagens puramente promocionais sem dados que as sustentem",
        "Mais de 2 links externos por release",
      ],
    },
    {
      accent: "var(--red)", dot: "var(--red-soft)", Icon: X,
      label: "Proibido",
      items: [
        "Dados estatísticos sem fonte identificada",
        "Citação de concorrentes ou comparações com outras empresas",
        "Menção a clientes, parceiros ou pessoas físicas sem autorização prévia",
        "Imagens sem crédito, com marca d'água ou sem licença de uso",
        "Informações falsas, não verificáveis ou enganosas",
      ],
    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "grid", placeItems: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "var(--paper)", borderRadius: 20, width: "100%", maxWidth: 900, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <ShieldCheck size={20} color="var(--coral-ink)" />
              <h3 style={{ margin: 0, fontFamily: "var(--sans)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
                Política <em style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 400 }}>editorial</em>
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--stone)" }}>
              Os releases precisam seguir as diretrizes editoriais dos veículos parceiros. Leia com atenção antes de continuar.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)", display: "flex", padding: 4, flexShrink: 0 }}><X size={17} /></button>
        </div>

        {/* 3-col grid */}
        <div style={{ overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {columns.map(col => (
              <div key={col.label} style={{ border: "1px solid var(--line-2)", borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Column header */}
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: col.dot, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <col.Icon size={13} color={col.accent} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink)" }}>
                    {col.label}
                  </span>
                </div>
                {/* Items */}
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: col.accent, flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--bg)", borderRadius: "var(--r)", padding: "12px 16px", marginTop: 14, fontSize: 12.5, color: "var(--stone)", lineHeight: 1.6 }}>
            O anunciante é integralmente responsável pela veracidade, legalidade e autorização de uso de todas as informações, imagens e referências presentes no conteúdo. Releases em desacordo com esta política poderão ser recusados ou devolvidos para ajuste.
          </div>
        </div>

        {/* Footer: checkbox + botão */}
        <div style={{ padding: "16px 28px 22px", borderTop: "1px solid var(--line)", flexShrink: 0 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              style={{ marginTop: 3, accentColor: "var(--coral)", flexShrink: 0, width: 15, height: 15, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55 }}>
              Li e aceito a política editorial do Raio Publicador e confirmo que o conteúdo respeita as diretrizes de publicação dos veículos parceiros.
            </span>
          </label>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={!accepted}
            onClick={onAccept}
          >
            Entendi, vamos começar →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Passo 3: Revisão ─────────────────────────────────────────────────────────

interface When { mode: "now" | "schedule"; date: string }

const BOILERPLATE = (brand: Brand | null) =>
  brand
    ? `Sobre ${brand.name}: referência no segmento de ${(brand.segment ?? "").toLowerCase()}, com atuação nacional e foco em inovação e proximidade com o cliente.`
    : "";

async function downloadDocx(content: Content, selVehicles: VehicleItem[], brand: Brand | null) {
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
                    v.name, v.cat, "—", v.tier, fmtReach(v.reach),
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

interface PolicyIssue { rule: string; severity: "error" | "warning"; description: string; suggestion: string }

function StepReview({ content, selected, when, setWhen, brand, onSaveDraft, vehicles }: {
  content: Content; selected: string[]; when: When; setWhen: (w: When) => void; brand: Brand | null;
  onSaveDraft: () => Promise<void>; vehicles: VehicleItem[];
}) {
  const [validating,    setValidating]    = useState(false);
  const [policyIssues,  setPolicyIssues]  = useState<PolicyIssue[] | null>(null);
  const [policyOk,      setPolicyOk]      = useState(false);
  const [policyErr,     setPolicyErr]     = useState("");

  async function runPolicyCheck() {
    setValidating(true); setPolicyIssues(null); setPolicyOk(false); setPolicyErr("");
    try {
      const res = await fetch("/api/ai/policy-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: content.title, subtitle: content.subtitle, body: content.body }),
      });
      const data = await res.json() as { ok?: boolean; issues?: PolicyIssue[]; error?: string };
      if (!res.ok || data.error) { setPolicyErr(data.error ?? "Erro na validação."); return; }
      setPolicyIssues(data.issues ?? []);
      setPolicyOk(data.ok ?? false);
    } catch { setPolicyErr("Falha de conexão."); }
    finally { setValidating(false); }
  }

  const selVehicles = selected.map(id => vehicles.find(v => v.id === id)).filter(Boolean) as VehicleItem[];
  const selTokens   = selVehicles.reduce((s, v) => s + (TIER_TOKENS_MAP[v.tier] ?? 0), 0);
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
          {content.body
            ? <div className="tiptap-preview" style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content.body }} />
            : <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7 }}>O corpo do release aparece aqui exatamente como será distribuído aos veículos selecionados.</p>
          }
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
          </div>
        </div>

        {/* Validação com IA */}
        <div className="card side-card" style={{ marginTop: 12 }}>
          <div className="card-head">
            <h3>Validação <em>editorial</em></h3>
          </div>
          <div className="sc-body">
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", justifyContent: "center", gap: 7 }}
              onClick={runPolicyCheck}
              disabled={validating}
            >
              {validating ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
              {validating ? "Analisando…" : "Validar com IA"}
            </button>

            {policyErr && (
              <p style={{ fontSize: 12, color: "var(--red,#c0392b)", margin: "10px 0 0" }}>{policyErr}</p>
            )}

            {policyIssues !== null && (
              <div style={{ marginTop: 12 }}>
                {policyOk ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#E3F2E9", borderRadius: 8, fontSize: 13, color: "#2F8A5B", fontWeight: 600 }}>
                    <ShieldCheck size={15} /> Nenhum problema encontrado
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {policyIssues.map((issue, i) => (
                      <div key={i} style={{
                        padding: "10px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.5,
                        background: issue.severity === "error" ? "#FDECEA" : "#FEF3DC",
                        borderLeft: `3px solid ${issue.severity === "error" ? "#C0392B" : "#C07A00"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontWeight: 700, color: issue.severity === "error" ? "#C0392B" : "#C07A00" }}>
                          {issue.severity === "error"
                            ? <AlertCircle size={13} />
                            : <AlertTriangle size={13} />}
                          {issue.rule}
                        </div>
                        <p style={{ margin: "0 0 4px", color: "var(--ink-soft)" }}>{issue.description}</p>
                        <p style={{ margin: 0, color: "var(--stone)", fontStyle: "italic" }}>💡 {issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SaveDraftButton onSave={onSaveDraft} />
      </div>
    </div>
  );
}

function SaveDraftButton({ onSave }: { onSave: () => Promise<void> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await onSave();
          setToast(true);
          setTimeout(() => router.push("/releases"), 1500);
        }}
      >
        {saving ? "Salvando…" : "Salvar rascunho e fechar"}
      </button>
      {toast && (
        <div className="toast-wrap">
          <div className="toast"><span className="ic"><Check size={14} /></span>Rascunho salvo!</div>
        </div>
      )}
    </>
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

  const [sub, setSub] = useState<SubInfo>({ credits: 0, creditsUsed: 0 });
  useEffect(() => {
    fetch("/api/stripe/subscription").then(r => r.json()).then((d: SubInfo) => {
      if (d.credits != null) setSub({ credits: d.credits, creditsUsed: d.creditsUsed ?? 0 });
    }).catch(() => {});
  }, []);

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [content, setContent] = useState<Content>({ title: "", subtitle: "", body: "", cat: "Negócios", author: "", imageUrls: [] });
  const [selected, setSelected] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  useEffect(() => {
    fetch("/api/vehicles")
      .then(r => r.json())
      .then((data: { id: string; name: string; domain: string; category: string; tier: string; reach: number; logoUrl?: string | null }[]) => {
        setVehicles(data.map(v => ({ id: v.id, name: v.name, domain: v.domain, cat: v.category, tier: v.tier, reach: v.reach, logoUrl: v.logoUrl })));
      })
      .catch(() => {});
  }, []);
  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()+1).padStart(2,"0")}`;
  const [when, setWhen] = useState<When>({ mode: "schedule", date: defaultDate });
  const [submitting, setSubmitting] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // ── Autosave ─────────────────────────────────────────────────────────────
  const draftIdRef  = useRef<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null);

  const contentRef  = useRef(content);
  const brandRef    = useRef(brand);
  const selectedRef = useRef(selected);
  useEffect(() => { contentRef.current  = content;  }, [content]);
  useEffect(() => { brandRef.current    = brand;    }, [brand]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

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
        imageUrl: c.imageUrls[0] ?? null,
        vehicles: selectedRef.current,
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

  const selVehicles = selected.map(id => vehicles.find(v => v.id === id)).filter(Boolean) as VehicleItem[];
  const selTokens   = selVehicles.reduce((s, v) => s + (TIER_TOKENS_MAP[v.tier] ?? 0), 0);
  const over        = sub.credits > 0 && selTokens > (sub.credits - sub.creditsUsed);

  const canNext =
    step === 0 ? !!brand :
    step === 1 ? content.title.trim().length > 0 :
    step === 2 ? (selected.length > 0 && !over) :
    true;

  // ── Tela de sucesso ───────────────────────────────────────────────────────
  if (done) {
    const scheduled = when.mode === "schedule";
    const selVehicles = selected.map(id => vehicles.find(v => v.id === id)).filter(Boolean) as VehicleItem[];
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
              <button className="btn btn-ghost" onClick={() => router.push("/calendario")}>
                <Calendar size={15} /> Ver calendário
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
    <>
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
              <button className="btn btn-dark" disabled={!canNext} onClick={() => {
                if (step === 0) { setShowPolicyModal(true); return; }
                setStep(s => s + 1);
              }}>
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={submitting} onClick={async () => {
                if (!brand) return;
                setSubmitting(true);
                try {
                  const scheduledAt = when.date
                    ? new Date(`${when.date}T09:00:00`).toISOString()
                    : null;
                  const status = "SCHEDULED";
                  const payload = {
                    title: content.title,
                    body: content.body,
                    summary: content.subtitle,
                    status,
                    scheduledAt,
                    brandId: brand.id,
                    creditsUsed: selTokens,
                    imageUrl: content.imageUrls[0] ?? null,
                    vehicles: selected,
                  };
                  let res: Response;
                  if (draftIdRef.current) {
                    res = await fetch(`/api/releases/${draftIdRef.current}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                  } else {
                    res = await fetch("/api/releases", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                  }
                  if (!res.ok) throw new Error("Falha ao salvar");
                  setDone(true);
                } catch {
                  alert("Erro ao salvar release. Tente novamente.");
                } finally {
                  setSubmitting(false);
                }
              }}>
                {submitting ? "Salvando…" : <><Calendar size={16} /> Agendar release</>}
              </button>
            )}
          </div>
        </div>

        {step === 0 && <StepBrand selected={brand} onSelect={setBrand} brands={brands} onAddBrand={b => setBrands(prev => [...prev, b])} />}
        {step === 1 && <StepContent content={content} setContent={setContent} brand={brand} ownerName={ownerName} />}
        {step === 2 && <StepVehicles selected={selected} setSelected={setSelected} vehicles={vehicles} sub={sub} />}
        {step === 3 && <StepReview content={content} selected={selected} when={when} setWhen={setWhen} brand={brand} onSaveDraft={autosave} vehicles={vehicles} />}
      </div>
    </div>

    {showPolicyModal && (
      <PolicyModal
        onAccept={() => { setShowPolicyModal(false); setStep(1); }}
        onClose={() => setShowPolicyModal(false)}
      />
    )}
    </>
  );
}
