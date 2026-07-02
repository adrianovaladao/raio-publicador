"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown,
  Calendar, X, Search, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal,
} from "lucide-react";
import { RichEditor } from "@/components/editor/RichEditor";
import { UpgradeModal } from "@/components/UpgradeModal";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";

// ── DatePicker customizado ────────────────────────────────────────────────────

const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW_SHORT  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function getBrHolidays(year: number): Set<string> {
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
  return new Set<string>([
    `${year}-01-01`, `${year}-04-21`, `${year}-05-01`, `${year}-09-07`,
    `${year}-10-12`, `${year}-11-02`, `${year}-11-15`, `${year}-11-20`, `${year}-12-25`,
    fmt(add(easter, -48)), fmt(add(easter, -47)), fmt(add(easter, -2)),
    fmt(easter), fmt(add(easter, 60)),
  ]);
}

function isBlockedDate(key: string): boolean {
  const d = new Date(key + "T12:00:00");
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return true;
  return getBrHolidays(d.getFullYear()).has(key);
}

function DatePicker({ value, onChange, minDate, maxDate }: {
  value: string; onChange: (d: string) => void; minDate: string; maxDate: string;
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
  for (let i = 0; i < lead; i++) { const d = new Date(viewY, viewM - 1, prevDim - lead + 1 + i); cells.push({ d: d.getDate(), out: true, key: toKey(d) }); }
  for (let d = 1; d <= dim; d++) cells.push({ d, out: false, key: toKey(new Date(viewY, viewM, d)) });
  while (cells.length % 7 !== 0) { const d = new Date(viewY, viewM + 1, cells.length - (lead + dim) + 1); cells.push({ d: d.getDate(), out: true, key: toKey(d) }); }
  function shiftMonth(dir: number) {
    let nm = viewM + dir, ny = viewY;
    if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; }
    setViewM(nm); setViewY(ny);
  }
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="input"
        style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
        <span style={{ color: value ? "var(--ink)" : "var(--stone)" }}>{value ? fmtDisplay(value) : "Selecione uma data"}</span>
        <Calendar size={15} style={{ color: "var(--stone)", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 999, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.10)", padding: 16, width: 280 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "var(--stone)" }}>‹</button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{MESES_FULL[viewM]} {viewY}</span>
            <button type="button" onClick={() => shiftMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "var(--stone)" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DOW_SHORT.map((d, i) => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, paddingBottom: 6, color: i === 0 || i === 6 ? "#E0B0A0" : "var(--stone)" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((c, i) => {
              const blocked = !c.out && isBlockedDate(c.key);
              const disabled = c.out || c.key < minDate || c.key > maxDate || blocked;
              const selected = c.key === value;
              const isToday = c.key === toKey(new Date());
              return (
                <button key={i} type="button" disabled={disabled}
                  onClick={() => { onChange(c.key); setOpen(false); }}
                  style={{ border: isToday && !selected ? "1.5px solid var(--ink)" : "1.5px solid transparent", borderRadius: 8, background: selected ? "var(--ink)" : "none", color: selected ? "#fff" : (c.out || disabled) ? "var(--line)" : "var(--ink)", fontSize: 12, fontWeight: selected ? 700 : 400, padding: "6px 0", cursor: disabled ? "default" : "pointer", textAlign: "center", opacity: blocked && !c.out ? 0.35 : 1 }}>
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

type VehicleItem = { id: string; name: string; domain: string; cat: string; tier: string; reach: number; logoUrl?: string | null };


type VehSortCol = "name" | "tier" | "reach" | "tokens";
type VehSortDir = "asc" | "desc";

const VEH_CATS_ALL  = ["Geral","Negócios","Tecnologia","Esportes","Economia","Saúde","Entretenimento","Política","Jurídico","Agronegócio"];
const VEH_TIERS_ALL = ["A","B","C"];
const PAGE_SIZE      = 25;
const TIER_TOKENS_MAP: Record<string, number> = { A: 100, B: 50, C: 25 };
const TIER_ORDER_MAP:  Record<string, number> = { A: 0, B: 1, C: 2 };
const TIER_COLORS_MAP: Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017" };
const TIER_FG_MAP:     Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff"    };

const CONTENT_CATS = ["Geral","Negócios","Tecnologia","Esportes","Economia","Saúde","Entretenimento","Política","Jurídico","Agronegócio"];
// PLAN é substituído por estado real — ver useState sub abaixo
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
  authors?: string[];
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
  vehicles: string[];
  brandId: string;
  brand: Brand;
}

// ── Step 0: Conteúdo ──────────────────────────────────────────────────────────

function StepContent({
  title, setTitle, subtitle, setSubtitle, body, setBody,
  cat, setCat, author, setAuthor, brand,
}: {
  title: string; setTitle: (v: string) => void;
  subtitle: string; setSubtitle: (v: string) => void;
  body: string; setBody: (v: string) => void;
  cat: string; setCat: (v: string) => void;
  author: string; setAuthor: (v: string) => void;
  brand: Brand | null;
}) {
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/team").then(r => r.json()).then((data: { id: string; name?: string; firstName?: string; lastName?: string }[]) => {
      const members = data.map(m => ({ id: m.id, name: m.name ?? ([m.firstName, m.lastName].filter(Boolean).join(" ") || m.id) }));
      setTeamMembers(members);
      if (!author && members.length > 0) setAuthor(members[0].id);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const authors = teamMembers.length > 0 ? teamMembers : (brand?.authors ?? []).map(a => ({ id: a, name: a }));
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
                  {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Step 1: Veículos ──────────────────────────────────────────────────────────

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

function StepVehicles({ selected, setSelected, vehicles, sub, onUpgrade, onBuyCredits }: { selected: string[]; setSelected: (s: string[]) => void; vehicles: VehicleItem[]; sub: { credits: number; creditsUsed: number; plan?: string | null }; onUpgrade?: () => void; onBuyCredits?: () => void }) {
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

  const hasSelectedTierA = selected.some(id => vehicles.find(v => v.id === id)?.tier === "A");

  const toggle = (id: string) => {
    if (selected.includes(id)) { setSelected(selected.filter(x => x !== id)); return; }
    const v = vehicles.find(x => x.id === id);
    if (v?.tier === "A" && hasSelectedTierA) return; // só um tier A por release
    setSelected([...selected, id]);
  };
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
            const isSel = selected.includes(v.id);
            const isDisabled = !isSel && hasSelectedTierA && v.tier === "A";
            return (
              <div key={v.id}
                className={`veh-row${isSel ? " sel" : ""}`}
                onClick={() => !isDisabled && toggle(v.id)}
                style={isDisabled ? { opacity: 0.35, cursor: "not-allowed", pointerEvents: "none" } : undefined}
              >
                <div className="cbx">{isSel && <Check size={13} />}</div>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

      {over && (
        <div style={{ background: "var(--red-soft)", color: "var(--red)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 2 }}>
          <span style={{ fontSize: 13 }}>Faltam <b>{(selTokens - left).toLocaleString("pt-BR")} créditos</b>. Remova veículos ou adquira mais créditos.</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {onBuyCredits && (
              <button
                className="btn btn-sm"
                style={{ background: "var(--red)", color: "#fff", border: "none", fontSize: 12 }}
                onClick={onBuyCredits}
              >
                Comprar créditos avulsos
              </button>
            )}
            {onUpgrade && sub.plan !== "PROFESSIONAL" && (
              <button
                className="btn btn-sm"
                style={{ background: "transparent", color: "var(--red)", border: "1.5px solid var(--red)", fontSize: 12 }}
                onClick={onUpgrade}
              >
                Fazer upgrade de plano
              </button>
            )}
          </div>
        </div>
      )}
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

function StepSchedule({
  schedDate, setSchedDate,
  title, body, subtitle, cat, selectedVeh, brand,
  releaseStatus, onSaveDraft, saving, vehicles,
}: {
  schedDate: string; setSchedDate: (v: string) => void;
  title: string; body: string; subtitle: string; cat: string;
  selectedVeh: string[]; brand: Brand | null;
  releaseStatus: string; onSaveDraft: () => Promise<void>; saving: boolean; vehicles: VehicleItem[];
}) {
  const selVehicles = selectedVeh.map(id => vehicles.find(v => v.id === id)).filter(Boolean) as VehicleItem[];
  const selTokens   = selVehicles.reduce((s, v) => s + (TIER_TOKENS_MAP[v.tier] ?? 0), 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="composer-grid">
      {/* Pré-visualização */}
      <div className="card">
        <div className="card-head">
          <h3>Pré-visualização do <em>release</em></h3>
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
          {body
            ? <div className="tiptap-preview" style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: body }} />
            : <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7 }}>O corpo do release aparece aqui.</p>
          }
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
            {(() => {
              const today = new Date();
              const pad = (n: number) => String(n).padStart(2, "0");
              const minDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
              const lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
              const maxDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(lastDay)}`;
              return (
                <div className="field-row" style={{ marginBottom: 0 }}>
                  <label style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)" }}>Data</label>
                  <DatePicker value={schedDate} onChange={setSchedDate} minDate={minDate} maxDate={maxDate} />
                </div>
              );
            })()}
          </div>
        </div>

        {releaseStatus === "SCHEDULED" && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
            disabled={saving}
            onClick={onSaveDraft}
          >
            {saving ? "Salvando…" : "Cancelar agendamento e salvar rascunho"}
          </button>
        )}
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [err,        setErr]        = useState("");
  const [toast,      setToast]      = useState<string | null>(null);
  const [sub, setSub] = useState({ credits: 0, creditsUsed: 0, plan: null as string | null });
  useEffect(() => {
    fetch("/api/stripe/subscription").then(r => r.json())
      .then((d: { credits?: number; creditsUsed?: number; plan?: string | null }) => {
        setSub({ credits: d.credits ?? 0, creditsUsed: d.creditsUsed ?? 0, plan: d.plan ?? null });
      }).catch(() => {});
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const [release,    setRelease]    = useState<ReleaseData | null>(null);
  const [title,      setTitle]      = useState("");
  const [subtitle,   setSubtitle]   = useState("");
  const [body,       setBody]       = useState("");
  const [cat,        setCat]        = useState("Negócios");
  const [author,     setAuthor]     = useState("");
  const [schedDate,  setSchedDate]  = useState("");
  const [selectedVeh, setSelectedVeh] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  useEffect(() => {
    fetch("/api/vehicles")
      .then(r => r.json())
      .then((data: { id: string; name: string; domain: string; category: string; tier: string; reach: number; logoUrl?: string | null }[]) => {
        setVehicles(data.map(v => ({ id: v.id, name: v.name, domain: v.domain, cat: v.category, tier: v.tier, reach: v.reach, logoUrl: v.logoUrl })));
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
        if (data.vehicles?.length) setSelectedVeh(data.vehicles);
        setAuthor(a => a || data.brand?.authors?.[0] || "");
        if (data.scheduledAt) {
          const d = new Date(data.scheduledAt);
          setSchedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
        }
      })
      .catch(() => setErr("Não foi possível carregar o release."))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!title.trim()) return;
    setSaving(true); setErr("");
    try {
      const scheduledAt = schedDate
        ? new Date(`${schedDate}T09:00:00`).toISOString()
        : null;
      const creditsUsed = selectedVeh.reduce((s, vid) => {
        const v = vehicles.find(x => x.id === vid);
        return s + (v ? (TIER_TOKENS_MAP[v.tier] ?? 0) : 0);
      }, 0);
      const res = await fetch(`/api/releases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body,
          summary: subtitle.trim() || null,
          status: "SCHEDULED",
          scheduledAt,
          imageUrl: null,
          vehicles: selectedVeh,
          creditsUsed,
        }),
      });
      if (!res.ok) { setErr("Erro ao salvar. Tente novamente."); return; }
      window.dispatchEvent(new Event("credits-changed"));
      showToast("Release agendado com sucesso!");
      setTimeout(() => router.push("/releases"), 1500);
    } catch { setErr("Falha de conexão."); }
    finally { setSaving(false); }
  }

  async function saveDraft() {
    if (!title.trim()) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/releases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body,
          summary: subtitle.trim() || null,
          status: "DRAFT",
          scheduledAt: null,
          imageUrl: null,
          vehicles: selectedVeh,
        }),
      });
      if (!res.ok) { setErr("Erro ao salvar. Tente novamente."); return; }
      if (release?.status === "SCHEDULED") window.dispatchEvent(new Event("credits-changed"));
      showToast("Rascunho salvo!");
      setTimeout(() => router.push("/releases"), 1500);
    } catch { setErr("Falha de conexão."); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/releases/${id}`, { method: "DELETE" });
      if (release?.status === "SCHEDULED") window.dispatchEvent(new Event("credits-changed"));
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
  const selVehicles = selectedVeh.map(vid => vehicles.find(v => v.id === vid)).filter(Boolean) as VehicleItem[];
  const selTokens   = selVehicles.reduce((s, v) => s + (TIER_TOKENS_MAP[v.tier] ?? 0), 0);
  const over        = selTokens > (sub.credits - sub.creditsUsed);
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
            brand={brand}
          />
        )}
        {step === 1 && <StepVehicles selected={selectedVeh} setSelected={setSelectedVeh} vehicles={vehicles} sub={sub} onBuyCredits={() => setShowBuyCreditsModal(true)} onUpgrade={() => setShowUpgradeModal(true)} />}
        {step === 2 && (
          <StepSchedule
            schedDate={schedDate} setSchedDate={setSchedDate}
            title={title} body={body} subtitle={subtitle} cat={cat}
            selectedVeh={selectedVeh} brand={brand}
            releaseStatus={release?.status ?? "DRAFT"}
            onSaveDraft={saveDraft}
            saving={saving}
          vehicles={vehicles}
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

      {toast && (
        <div className="toast-wrap">
          <div className="toast"><span className="ic"><Check size={14} /></span>{toast}</div>
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          currentPlan={sub.plan ?? "BASIC"}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
      {showBuyCreditsModal && (
        <BuyCreditsModal
          currentPlan={sub.plan ?? "BASIC"}
          onClose={() => setShowBuyCreditsModal(false)}
        />
      )}
    </div>
  );
}
