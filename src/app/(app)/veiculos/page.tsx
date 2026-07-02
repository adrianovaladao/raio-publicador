"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, X } from "lucide-react";

type VehicleItem = { id: string; name: string; domain: string; cat: string; tier: string; reach: number; logoUrl?: string | null };



const VEH_CATS  = ["Geral","Negócios","Tecnologia","Esportes","Economia","Saúde","Entretenimento","Política","Jurídico","Agronegócio"];
const VEH_TIERS = ["A","B","C","D","E"];

const TIER_TOKENS:  Record<string, number> = { A: 100, B: 60, C: 40, D: 20, E: 0 };
const TIER_COLORS:  Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017", D: "#3A7DC9", E: "#D0DFF0" };
const TIER_FG:      Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff",    D: "#fff",    E: "#3A5A80" };

const TIER_INFO = [
  { t: "A", label: "Grande portal nacional", range: "10 mi+ leitores/mês",  tokens: 100, cls: "t-a" },
  { t: "B", label: "Portal regional forte",  range: "100 mil–10 mi/mês",    tokens: 60,  cls: "t-b" },
  { t: "C", label: "Portal médio / nicho",   range: "10 mil–100 mil/mês",   tokens: 40,  cls: "t-c" },
  { t: "D", label: "Blog / portal local",    range: "1 mil–10 mil/mês",     tokens: 20,  cls: "t-d" },
  { t: "E", label: "Site emergente",         range: "Até 1 mil/mês",        tokens: 0,   cls: "t-e" },
];

type SortCol = "name" | "cat" | "tier" | "reach" | "tokens";
type SortDir = "asc" | "desc";

function fmtReach(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const TIER_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

function sortVehicles(arr: VehicleItem[], col: SortCol, dir: SortDir) {
  return [...arr].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (col === "tokens") { va = TIER_TOKENS[a.tier] ?? 0; vb = TIER_TOKENS[b.tier] ?? 0; }
    else if (col === "tier") { va = TIER_ORDER[a.tier] ?? 99; vb = TIER_ORDER[b.tier] ?? 99; }
    else if (col === "reach") { va = a.reach; vb = b.reach; }
    else { va = (a[col] as string).toLowerCase(); vb = (b[col] as string).toLowerCase(); }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown size={13} style={{ opacity: 0.3, marginLeft: 4 }} />;
  return dir === "asc"
    ? <ArrowUp size={13} style={{ marginLeft: 4, color: "var(--coral-ink)" }} />
    : <ArrowDown size={13} style={{ marginLeft: 4, color: "var(--coral-ink)" }} />;
}

function FilterModal({ cats, tiers, onApply, onClose }: {
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
              {VEH_CATS.map(c => (
                <button key={c} onClick={() => toggleCat(c)}
                  className={`chip${selCats.includes(c) ? " active" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Tier</p>
            <div style={{ display: "flex", gap: 8 }}>
              {VEH_TIERS.map(t => (
                <button key={t} onClick={() => toggleTier(t)}
                  className={`chip${selTiers.includes(t) ? " active" : ""}`}>
                  Tier {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="m-foot" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelCats([]); setSelTiers([]); }}>
            Limpar filtros
          </button>
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

export default function VeiculosPage() {
  const [q,           setQ]          = useState("");
  const [filterCats,  setFilterCats] = useState<string[]>([]);
  const [filterTiers, setFilterTiers] = useState<string[]>([]);
  const [sortCol,     setSortCol]    = useState<SortCol>("reach");
  const [sortDir,     setSortDir]    = useState<SortDir>("desc");
  const [showFilter,  setShowFilter] = useState(false);
  const [page,        setPage]       = useState(1);


  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  useEffect(() => {
    fetch("/api/vehicles")
      .then(r => r.json())
      .then((data: { id: string; name: string; domain: string; category: string; tier: string; reach: number; logoUrl?: string | null }[]) => {
        setVehicles(data.map(v => ({ id: v.id, name: v.name, domain: v.domain, cat: v.category, tier: v.tier, reach: v.reach, logoUrl: v.logoUrl })));
      })
      .catch(() => {});
  }, []);

  const PAGE_SIZE     = 25;
  const activeFilters = filterCats.length + filterTiers.length;

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  }

  const thStyle = (col: SortCol): React.CSSProperties => ({
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    color: sortCol === col ? "var(--coral-ink)" : undefined,
    verticalAlign: "middle",
  });

  const thInner = (label: string, col: SortCol, align: "left" | "right" = "left") => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: align === "right" ? "flex-end" : "flex-start", width: "100%" }}>
      {label}
      <SortIcon col={col} active={sortCol} dir={sortDir} />
    </span>
  );

  const filtered = vehicles.filter(v =>
    (filterCats.length  === 0 || filterCats.includes(v.cat))  &&
    (filterTiers.length === 0 || filterTiers.includes(v.tier)) &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );

  const sorted     = sortVehicles(filtered, sortCol, sortDir);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const list       = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalReach = sorted.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Rede</p>
            <h2><em>Centenas</em> de veículos parceiros</h2>
            <p className="sub">Do grande portal nacional ao blog regional. Escolha os veículos certos para cada release no momento de agendar.</p>
          </div>
        </div>

        {/* Cards de tier */}
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 24 }}>
          {TIER_INFO.map(ti => (
            <div className="card kpi" key={ti.t} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span className={`tier ${ti.cls}`} style={{ fontSize: 11, padding: "4px 10px" }}>{ti.t}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--ink)" }}>
                  {ti.tokens > 0 ? `${ti.tokens}` : "0"}
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--stone)", marginLeft: 4 }}>créditos</span>
                </span>
              </div>
              <div className="lbl">{ti.label}</div>
              <div className="val" style={{ fontSize: 13, marginTop: 4, fontWeight: 700 }}>{ti.range}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ marginBottom: 18, gap: 8 }}>
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
            <button className="btn btn-ghost btn-sm" style={{ color: "var(--stone)" }} onClick={() => { setFilterCats([]); setFilterTiers([]); }}>
              <X size={13} /> Limpar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <input
            className="input"
            placeholder="Buscar veículo…"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            style={{ width: 220, padding: "8px 14px", fontSize: 13 }}
          />
        </div>

        {/* Tabela */}
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ ...thStyle("name"), width: "36%" }} onClick={() => handleSort("name")}>
                  {thInner("Veículo", "name")}
                </th>
                <th style={thStyle("cat")} onClick={() => handleSort("cat")}>
                  {thInner("Categoria", "cat")}
                </th>
                <th style={thStyle("tier")} onClick={() => handleSort("tier")}>
                  {thInner("Tier", "tier")}
                </th>
                <th style={{ ...thStyle("reach"), textAlign: "right" }} onClick={() => handleSort("reach")}>
                  {thInner("Alcance/mês", "reach", "right")}
                </th>
                <th style={{ ...thStyle("tokens"), textAlign: "right" }} onClick={() => handleSort("tokens")}>
                  {thInner("Créditos", "tokens", "right")}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map(v => {
                const tkn = TIER_TOKENS[v.tier] ?? 0;
                return (
                  <tr key={v.id}>
                    <td>
                      <div className="row" style={{ gap: 12 }}>
                        <div style={{ background: TIER_COLORS[v.tier], width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, color: TIER_FG[v.tier] ?? "#fff", flex: "none", overflow: "hidden" }}>
                          {v.logoUrl
                            ? <img src={v.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : initials(v.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{v.name}</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--stone)" }}>{v.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{v.cat}</td>
                    <td><span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span></td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{fmtReach(v.reach)}</td>
                    <td className="num" style={{ textAlign: "right" }}>
                      {tkn > 0
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>{tkn} <span style={{ color: "var(--coral)", fontSize: 13 }}>⚡</span></span>
                        : <span style={{ fontWeight: 700 }}>0</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 20px" }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--stone)", padding: "0 8px" }}>
              {page} / {totalPages}
            </span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
          </div>
        )}
        <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 32 }}>
          {sorted.length} veículos encontrados · alcance combinado: {fmtReach(totalReach)}
        </p>
      </div>

      {showFilter && (
        <FilterModal
          cats={filterCats} tiers={filterTiers}
          onApply={(c, t) => { setFilterCats(c); setFilterTiers(t); setPage(1); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
