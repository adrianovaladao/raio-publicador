"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Plus, Upload, SlidersHorizontal, X, Pencil, Trash2,
  ArrowUp, ArrowDown, ArrowUpDown, Check, Camera, Crown,
} from "lucide-react";

const TIER_TOKENS: Record<string, number> = { A: 100, B: 50, C: 25 };
const TIER_COLORS: Record<string, string> = { A: "#C0392B", B: "#E07B2A", C: "#D4A017" };
const TIER_FG:     Record<string, string> = { A: "#fff",    B: "#fff",    C: "#fff"    };
const VEH_CATS = ["Negócios","Tecnologia","Cultura","Esportes","Saúde","Entretenimento","Política","Educação","Lifestyle","Gastronomia","Moda","Sustentabilidade","Finanças","Variedades","Automotivo","Imóveis"];
const TIERS = ["A","B","C"];
const TIER_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };
const PAGE_SIZE = 30;

interface VehicleRow { id: string; name: string; domain: string; category: string; tier: string; reach: number; logoUrl?: string | null }
type SortCol = "name" | "category" | "tier" | "reach";
type SortDir = "asc" | "desc";

function fmtReach(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function sortVehicles(arr: VehicleRow[], col: SortCol, dir: SortDir) {
  return [...arr].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (col === "tier")  { va = TIER_ORDER[a.tier] ?? 99; vb = TIER_ORDER[b.tier] ?? 99; }
    else if (col === "reach") { va = a.reach; vb = b.reach; }
    else { va = (a[col] as string).toLowerCase(); vb = (b[col] as string).toLowerCase(); }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ── Vehicle Modal ──────────────────────────────────────────────────────────────

function VehicleModal({ initial, onSave, onClose }: {
  initial?: VehicleRow | null;
  onSave: (data: Omit<VehicleRow, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [name,      setName]      = useState(initial?.name     ?? "");
  const [domain,    setDomain]    = useState(initial?.domain   ?? "");
  const [category,  setCategory]  = useState(initial?.category ?? VEH_CATS[0]);
  const [tier,      setTier]      = useState(initial?.tier     ?? "B");
  const [reach,     setReach]     = useState(String(initial?.reach ?? ""));
  const [logoUrl,   setLogoUrl]   = useState(initial?.logoUrl  ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json() as { url?: string };
    if (data.url) setLogoUrl(data.url);
    setUploading(false);
  }

  async function handleSubmit() {
    if (!name.trim() || !domain.trim() || !reach) { setErr("Preencha todos os campos."); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ name: name.trim(), domain: domain.trim(), category, tier, reach: Number(reach), logoUrl: logoUrl || null });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSaving(false); }
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 28, width: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{initial ? "Editar veículo" : "Novo veículo"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Logo */}
          <div>
            <label style={labelStyle}>Logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: TIER_COLORS[tier] ?? "#ccc", color: TIER_FG[tier] ?? "#fff", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, overflow: "hidden", flexShrink: 0 }}>
                {logoUrl ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(name || "?")}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              <button className="btn btn-ghost btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Camera size={14} /> {uploading ? "Enviando…" : logoUrl ? "Trocar logo" : "Adicionar logo"}
              </button>
              {logoUrl && <button className="btn btn-ghost btn-sm" onClick={() => setLogoUrl("")}><X size={13} /></button>}
            </div>
          </div>

          <div><label style={labelStyle}>Nome</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Folha de S.Paulo" /></div>
          <div><label style={labelStyle}>Domínio</label><input style={inputStyle} value={domain} onChange={e => setDomain(e.target.value)} placeholder="folha.uol.com.br" /></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Editoria</label>
              <div style={{ position: "relative" }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                  {VEH_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Tier</label>
              <div style={{ position: "relative" }}>
                <select value={tier} onChange={e => setTier(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                  {TIERS.map(t => <option key={t} value={t}>Tier {t} — {TIER_TOKENS[t]} créditos</option>)}
                </select>
              </div>
            </div>
          </div>

          <div><label style={labelStyle}>Alcance/mês</label><input style={inputStyle} type="number" value={reach} onChange={e => setReach(e.target.value)} placeholder="Ex.: 5000000" /></div>
        </div>

        {err && <p style={{ color: "#DC2626", fontSize: 13, marginTop: 12 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-dark btn-sm">
            {saving ? "Salvando…" : <><Check size={14} /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ───────────────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose, loading }: { name: string; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Remover veículo</h3>
        <p style={{ fontSize: 14, color: "var(--stone)", marginBottom: 24 }}>Tem certeza que deseja remover <strong style={{ color: "var(--fg)" }}>{name}</strong>? Esta ação não pode ser desfeita.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="btn btn-sm" style={{ background: "#DC2626", color: "#fff", border: "none" }}>
            {loading ? "Removendo…" : <><Trash2 size={14} /> Remover</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Filter Modal ───────────────────────────────────────────────────────────────

function FilterModal({ cats, tiers, onApply, onClose }: { cats: string[]; tiers: string[]; onApply: (c: string[], t: string[]) => void; onClose: () => void }) {
  const [selCats,  setSelCats]  = useState<string[]>(cats);
  const [selTiers, setSelTiers] = useState<string[]>(tiers);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Filtrar veículos</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)" }}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Editoria</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VEH_CATS.map(c => (
              <button key={c} onClick={() => setSelCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])}
                className={`chip${selCats.includes(c) ? " active" : ""}`}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 10 }}>Tier</p>
          <div style={{ display: "flex", gap: 8 }}>
            {TIERS.map(t => (
              <button key={t} onClick={() => setSelTiers(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                className={`chip${selTiers.includes(t) ? " active" : ""}`}>Tier {t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSelCats([]); setSelTiers([]); }}>Limpar</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-dark btn-sm" onClick={() => { onApply(selCats, selTiers); onClose(); }}>
              Aplicar{(selCats.length + selTiers.length) > 0 ? ` (${selCats.length + selTiers.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function AdminVeiculos() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.raioAdmin === true;

  const [vehicles,    setVehicles]   = useState<VehicleRow[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [seeding,     setSeeding]    = useState(false);
  const [q,           setQ]          = useState("");
  const [filterCats,  setFilterCats] = useState<string[]>([]);
  const [filterTiers, setFilterTiers] = useState<string[]>([]);
  const [sortCol,     setSortCol]    = useState<SortCol>("reach");
  const [sortDir,     setSortDir]    = useState<SortDir>("desc");
  const [page,        setPage]       = useState(1);
  const [showFilter,  setShowFilter] = useState(false);
  const [editing,     setEditing]    = useState<VehicleRow | null | "new">(null);
  const [deleting,    setDeleting]   = useState<VehicleRow | null>(null);
  const [isDel,       setIsDel]      = useState(false);
  const [toast,       setToast]      = useState<string | null>(null);
  const [selected,    setSelected]   = useState<Set<string>>(new Set());
  const [bulkDel,     setBulkDel]    = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/vehicles")
      .then(r => r.json())
      .then((d: VehicleRow[]) => setVehicles(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSeed() {
    setSeeding(true);
    const res  = await fetch("/api/admin/vehicles/seed", { method: "POST" });
    const data = await res.json() as { inserted: number };
    const all  = await fetch("/api/admin/vehicles").then(r => r.json()) as VehicleRow[];
    setVehicles(all); setSeeding(false);
    showToast(`${data.inserted} veículos importados!`);
  }

  async function handleSave(data: Omit<VehicleRow, "id">) {
    if (editing === "new") {
      const res = await fetch("/api/admin/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json() as { error?: string }; throw new Error(e.error); }
      const v = await res.json() as VehicleRow;
      setVehicles(prev => [...prev, v]);
      showToast("Veículo adicionado!");
    } else if (editing) {
      const res = await fetch(`/api/admin/vehicles/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json() as { error?: string }; throw new Error(e.error); }
      const v = await res.json() as VehicleRow;
      setVehicles(prev => prev.map(x => x.id === v.id ? v : x));
      showToast("Veículo atualizado!");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDel(true);
    await fetch(`/api/admin/vehicles/${deleting.id}`, { method: "DELETE" });
    setVehicles(prev => prev.filter(v => v.id !== deleting.id));
    setDeleting(null); setIsDel(false);
    showToast("Veículo removido.");
  }

  async function handleBulkDelete() {
    setBulkDel(true);
    const ids = [...selected];
    await fetch("/api/admin/vehicles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    setVehicles(prev => prev.filter(v => !selected.has(v.id)));
    setSelected(new Set()); setBulkDel(false);
    showToast(`${ids.length} veículo${ids.length !== 1 ? "s" : ""} removido${ids.length !== 1 ? "s" : ""}.`);
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleAll(ids: string[]) {
    const allSelected = ids.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(ids));
  }

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "reach" ? "desc" : "asc"); }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  }

  if (!isLoaded) return null;
  if (!isAdmin) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 12 }}>
      <Crown size={32} style={{ color: "var(--stone)" }} />
      <p style={{ color: "var(--stone)" }}>Acesso restrito.</p>
    </div>
  );

  const activeFilters = filterCats.length + filterTiers.length;
  const filtered = vehicles.filter(v =>
    (filterCats.length  === 0 || filterCats.includes(v.category)) &&
    (filterTiers.length === 0 || filterTiers.includes(v.tier)) &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );
  const sorted     = sortVehicles(filtered, sortCol, sortDir);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const list       = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const thS: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left", fontSize: 11,
    fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--stone)", fontWeight: 600, whiteSpace: "nowrap",
    borderBottom: "1.5px solid var(--border)", cursor: "pointer", userSelect: "none",
  };
  const tdS: React.CSSProperties = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Veículos</h1>
          <p style={{ fontSize: 13, color: "var(--stone)", marginTop: 4 }}>{vehicles.length} veículos na plataforma</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {vehicles.length === 0 && !loading && (
            <button className="btn btn-ghost btn-sm" disabled={seeding} onClick={handleSeed}>
              <Upload size={14} /> {seeding ? "Importando…" : "Importar padrão"}
            </button>
          )}
          <button className="btn btn-dark btn-sm" onClick={() => setEditing("new")}><Plus size={14} /> Novo veículo</button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: "12px 16px", background: "var(--ink)", color: "#fff", borderRadius: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selecionado{selected.size !== 1 ? "s" : ""}</span>
          <button onClick={() => setSelected(new Set())} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "none", gap: 5 }}>
            <X size={13} /> Limpar seleção
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={handleBulkDelete} disabled={bulkDel} className="btn btn-sm" style={{ background: "#DC2626", color: "#fff", border: "none", gap: 5 }}>
            <Trash2 size={13} /> {bulkDel ? "Removendo…" : `Remover ${selected.size}`}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <button className={`btn btn-ghost btn-sm${activeFilters > 0 ? " active" : ""}`} onClick={() => setShowFilter(true)} style={{ gap: 6 }}>
          <SlidersHorizontal size={14} /> Filtrar
          {activeFilters > 0 && <span style={{ background: "var(--coral)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{activeFilters}</span>}
        </button>
        {activeFilters > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--stone)" }} onClick={() => { setFilterCats([]); setFilterTiers([]); setPage(1); }}>
            <X size={13} /> Limpar
          </button>
        )}
        <input placeholder="Buscar veículo…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 200, padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", fontSize: 13 }} />
        <span style={{ fontSize: 12, color: "var(--stone)", alignSelf: "center" }}>{sorted.length} de {vehicles.length}</span>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--stone)" }}>Carregando…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thS, width: 40, cursor: "default" }}>
                    <input type="checkbox"
                      checked={list.length > 0 && list.every(v => selected.has(v.id))}
                      ref={el => { if (el) el.indeterminate = list.some(v => selected.has(v.id)) && !list.every(v => selected.has(v.id)); }}
                      onChange={() => toggleAll(list.map(v => v.id))}
                      style={{ cursor: "pointer", width: 15, height: 15 }}
                    />
                  </th>
                  <th style={{ ...thS, width: "35%" }} onClick={() => toggleSort("name")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Veículo <SortIcon col="name" /></span></th>
                  <th style={thS} onClick={() => toggleSort("category")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Editoria <SortIcon col="category" /></span></th>
                  <th style={thS} onClick={() => toggleSort("tier")}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>Tier <SortIcon col="tier" /></span></th>
                  <th style={{ ...thS, textAlign: "right" }} onClick={() => toggleSort("reach")}><span style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>Alcance/mês <SortIcon col="reach" /></span></th>
                  <th style={{ ...thS, textAlign: "right" }}>Créditos</th>
                  <th style={{ ...thS, width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--stone)" }}>Nenhum veículo encontrado.</td></tr>
                ) : list.map(v => (
                  <tr key={v.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = selected.has(v.id) ? "var(--cream)" : "")}>
                    <td style={{ ...tdS, background: selected.has(v.id) ? "var(--cream)" : "" }}>
                      <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSelect(v.id)}
                        style={{ cursor: "pointer", width: 15, height: 15 }} />
                    </td>
                    <td style={{ ...tdS, background: selected.has(v.id) ? "var(--cream)" : "" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: TIER_COLORS[v.tier] ?? "#ccc", color: TIER_FG[v.tier] ?? "#fff", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, flexShrink: 0, overflow: "hidden" }}>
                          {v.logoUrl ? <img src={v.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(v.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{v.name}</div>
                          <div style={{ fontSize: 11, color: "var(--stone)" }}>{v.domain}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdS, color: "var(--stone)", background: selected.has(v.id) ? "var(--cream)" : "" }}>{v.category}</td>
                    <td style={{ ...tdS, background: selected.has(v.id) ? "var(--cream)" : "" }}>
                      <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: TIER_COLORS[v.tier] + "22", color: TIER_COLORS[v.tier] }}>
                        {v.tier}
                      </span>
                    </td>
                    <td style={{ ...tdS, textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700, background: selected.has(v.id) ? "var(--cream)" : "" }}>{fmtReach(v.reach)}</td>
                    <td style={{ ...tdS, textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700, background: selected.has(v.id) ? "var(--cream)" : "" }}>{TIER_TOKENS[v.tier] ?? 0} ⚡</td>
                    <td style={{ ...tdS, background: selected.has(v.id) ? "var(--cream)" : "" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button title="Editar" onClick={() => setEditing(v)}
                          style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "var(--stone)", display: "flex" }}>
                          <Pencil size={13} />
                        </button>
                        <button title="Remover" onClick={() => setDeleting(v)}
                          style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#DC2626", display: "flex" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 0", fontSize: 13 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span style={{ color: "var(--stone)" }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
        </div>
      )}

      {!loading && (
        <div style={{ padding: "10px 0 0", fontSize: 12, color: "var(--stone)" }}>
          {sorted.length} veículos · alcance combinado: {fmtReach(sorted.reduce((s, v) => s + v.reach, 0))}
        </div>
      )}

      {editing !== null && <VehicleModal initial={editing === "new" ? null : editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      {deleting && <DeleteModal name={deleting.name} onConfirm={handleDelete} onClose={() => setDeleting(null)} loading={isDel} />}
      {showFilter && <FilterModal cats={filterCats} tiers={filterTiers} onApply={(c, t) => { setFilterCats(c); setFilterTiers(t); setPage(1); }} onClose={() => setShowFilter(false)} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", zIndex: 2000 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
