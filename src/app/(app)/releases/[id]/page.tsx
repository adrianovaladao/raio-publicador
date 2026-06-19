"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Check, ChevronDown, Image as ImageIcon,
  Rocket, Calendar, X, Search, Download, Trash2, Plus,
} from "lucide-react";
import { extractDominantColorFromUrl } from "@/lib/color";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";

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

// ── MediaGallery ──────────────────────────────────────────────────────────────

function MediaGallery({
  images,
  onAdd,
  onRemove,
}: {
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
    if (dims.w < 1200 || dims.h < 630) { setErr(`Imagem muito pequena (${dims.w}×${dims.h}px). Mínimo: 1200×630px.`); return; }
    if (dims.w > 3600 || dims.h > 1890) { setErr(`Imagem muito grande (${dims.w}×${dims.h}px). Máximo: 3600×1890px.`); return; }
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
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><h3>Mídia</h3></div>
      <div style={{ padding: "12px 20px 20px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        {images.map(url => (
          <div key={url} style={{ position: "relative", width: 140, height: 90, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--line)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <button
              onClick={() => onRemove(url)}
              style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 5, color: "#fff", cursor: "pointer", padding: "2px 7px", fontSize: 11, fontWeight: 600 }}
            >
              Remover
            </button>
          </div>
        ))}

        {/* Add slot */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{ width: 140, height: 90, borderRadius: 8, border: "1.5px dashed var(--sand)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: uploading ? "default" : "pointer", color: "var(--stone)", flexShrink: 0 }}
        >
          {uploading
            ? <><ImageIcon size={18} /><span style={{ fontSize: 11 }}>Enviando…</span></>
            : <><Plus size={18} /><span style={{ fontSize: 11, fontWeight: 600 }}>Adicionar nova imagem</span></>}
        </div>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
      {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 12, margin: "-8px 20px 12px", fontWeight: 500 }}>{err}</p>}
    </div>
  );
}

// ── VehiclesCard ──────────────────────────────────────────────────────────────

function VehiclesCard({ selected, setSelected }: { selected: string[]; setSelected: (s: string[]) => void }) {
  const [cat, setCat] = useState("Todos");
  const [uf,  setUf]  = useState("Todas");
  const [q,   setQ]   = useState("");
  const [open, setOpen] = useState(true);

  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

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

  return (
    <div className="card side-card" style={{ marginTop: 16 }}>
      <div
        className="card-head"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen(o => !o)}
      >
        <h3>Veículos</h3>
        <span style={{ fontSize: 13, color: "var(--stone)", flex: 1, textAlign: "right", marginRight: 8 }}>
          {selVehicles.length > 0 ? `${selVehicles.length} selecionados` : "Nenhum selecionado"}
        </span>
        <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.18s", flexShrink: 0 }} />
      </div>

      {open && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
            <div className="search" style={{ flex: 1, minWidth: 0 }}>
              <Search size={14} />
              <input placeholder="Buscar veículo…" value={q} onChange={e => setQ(e.target.value)} style={{ fontSize: 12 }} />
            </div>
            <div className="select-wrap" style={{ width: 110 }}>
              <select className="input" value={cat} onChange={e => setCat(e.target.value)} style={{ padding: "6px 26px 6px 9px", fontSize: 12 }}>
                {VEH_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} />
            </div>
            <div className="select-wrap" style={{ width: 80 }}>
              <select className="input" value={uf} onChange={e => setUf(e.target.value)} style={{ padding: "6px 26px 6px 9px", fontSize: 12 }}>
                {VEH_UFS.map(u => <option key={u}>{u}</option>)}
              </select>
              <ChevronDown size={13} />
            </div>
          </div>

          {/* Vehicle rows */}
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {list.map(v => {
              const sel = selected.includes(v.id);
              return (
                <div
                  key={v.id}
                  onClick={() => toggle(v.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid var(--line)", background: sel ? "rgba(250,181,0,0.05)" : undefined }}
                >
                  {/* Checkbox */}
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: sel ? "none" : "1.5px solid var(--sand)", background: sel ? "var(--coral)" : undefined, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {sel && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  {/* Logo */}
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: v.color, display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 9, color: "#fff", flexShrink: 0 }}>
                    {initials(v.name)}
                  </div>
                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                      <span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span>
                      <span style={{ fontSize: 11, color: "var(--stone)" }}>{v.domain}</span>
                      <span style={{ fontSize: 11, color: "var(--stone)" }}>· {v.uf}</span>
                    </div>
                  </div>
                  {/* Tokens */}
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--coral-ink)", flexShrink: 0 }}>{v.tokens} ⚡</span>
                </div>
              );
            })}
          </div>

          {/* Footer summary */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            {over && (
              <p style={{ color: "var(--red,#c0392b)", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>
                Faltam {(selTokens - left).toLocaleString("pt-BR")} créditos.
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--stone)", marginBottom: 4 }}>
              <span>Alcance somado</span>
              <strong style={{ color: "var(--ink)" }}>{selReach > 0 ? fmtReach(selReach) : "—"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--stone)" }}>
              <span>Créditos</span>
              <strong style={{ color: over ? "var(--red,#c0392b)" : "var(--ink)" }}>{selTokens} <span style={{ color: "var(--coral-ink)" }}>⚡</span></strong>
            </div>
          </div>
        </>
      )}
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
            Tem certeza que deseja excluir <strong style={{ color: "var(--ink)" }}>&ldquo;{title}&rdquo;</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="m-foot">
          <button className="btn btn-quiet btn-sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--red,#c0392b)", color: "#fff" }}
            disabled={deleting}
            onClick={onConfirm}
          >
            <Trash2 size={14} /> {deleting ? "Excluindo…" : "Excluir release"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Docx ─────────────────────────────────────────────────────────────────────

async function downloadDocx(title: string, subtitle: string, body: string, cat: string, selVehicles: typeof VEHICLES, brand: Brand | null) {
  const brandName = brand?.name ?? "Marca";
  const slug = title.slice(0, 40).replace(/\s+/g, "-").toLowerCase() || "release";
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 24 } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      children: [
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: brandName.toUpperCase(), bold: true, size: 18, color: "848484", font: "Calibri" }),
          new TextRun({ text: `  ·  ${cat}`, size: 18, color: "848484", font: "Calibri" }),
        ]}),
        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 160 }, children: [new TextRun({ text: title || "Título", bold: true, size: 52, font: "Calibri" })] }),
        ...(subtitle ? [new Paragraph({ spacing: { after: 320 }, children: [new TextRun({ text: subtitle, italics: true, size: 30, color: "555555", font: "Calibri" })] })] : []),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } }, spacing: { after: 320 }, children: [] }),
        ...body.split("\n").filter(Boolean).map(line =>
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: line, size: 24, font: "Calibri" })], alignment: AlignmentType.JUSTIFIED })
        ),
        ...(brand ? [
          new Paragraph({ spacing: { after: 120, before: 400 }, children: [] }),
          new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } }, spacing: { after: 200, before: 160 }, children: [new TextRun({ text: "SOBRE A EMPRESA", bold: true, size: 18, color: "848484", font: "Calibri" })] }),
          new Paragraph({ spacing: { after: 320 }, children: [new TextRun({ text: `Sobre ${brandName}: referência no segmento de ${(brand.segment ?? "").toLowerCase()}.`, size: 22, color: "555555", font: "Calibri" })] }),
        ] : []),
        ...(selVehicles.length > 0 ? [
          new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } }, spacing: { after: 200, before: 160 }, children: [new TextRun({ text: "VEÍCULOS SELECIONADOS", bold: true, size: 18, color: "848484", font: "Calibri" })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ tableHeader: true, children: ["Veículo","Editoria","UF","Tier","Alcance"].map(h =>
                new TableCell({ shading: { type: ShadingType.SOLID, color: "F1F0EC" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri" })] })] })
              )}),
              ...selVehicles.map(v => new TableRow({ children: [v.name,v.cat,v.uf,v.tier,fmtReach(v.reach)].map(val =>
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val, size: 18, font: "Calibri" })] })] })
              )})),
            ],
          }),
        ] : []),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug}.docx`);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditReleasePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [err,        setErr]        = useState("");

  const [release,    setRelease]    = useState<ReleaseData | null>(null);
  const [title,      setTitle]      = useState("");
  const [subtitle,   setSubtitle]   = useState("");
  const [body,       setBody]       = useState("");
  const [cat,        setCat]        = useState("Negócios");
  const [author,     setAuthor]     = useState("Você");
  const [images,     setImages]     = useState<string[]>([]);
  const [status,     setStatus]     = useState("DRAFT");
  const [schedDate,  setSchedDate]  = useState("");
  const [schedTime,  setSchedTime]  = useState("09:00");
  const [selectedVeh, setSelectedVeh] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/releases/${id}`)
      .then(r => r.json())
      .then((data: ReleaseData) => {
        setRelease(data);
        setTitle(data.title ?? "");
        setSubtitle(data.summary ?? "");
        setBody(data.body ?? "");
        if (data.imageUrl) setImages([data.imageUrl]);
        setStatus(data.status ?? "DRAFT");
        if (data.scheduledAt) {
          const d = new Date(data.scheduledAt);
          setSchedDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
          setSchedTime(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
        }
      })
      .catch(() => setErr("Não foi possível carregar o release."))
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-extract brand color if missing
  useEffect(() => {
    if (release?.brand?.logoUrl && !release.brand.color) {
      extractDominantColorFromUrl(release.brand.logoUrl).catch(() => {});
    }
  }, [release]);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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

  return (
    <div className="content scroll">
      <div className="content-inner">

        {/* Header */}
        <div className="page-head" style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="icon-btn" onClick={() => router.back()} title="Voltar">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>Editar release</p>
              <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.2 }}>{title || "Sem título"}</h2>
            </div>
          </div>
          <div className="actions">
            <button
              className="btn btn-quiet btn-sm"
              style={{ color: "var(--red,#c0392b)" }}
              onClick={() => setShowDelete(true)}
            >
              <Trash2 size={14} /> Excluir
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => downloadDocx(title, subtitle, body, cat, selVehicles, brand)}
            >
              <Download size={14} /> Baixar .docx
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={!title.trim() || saving}
              onClick={save}
            >
              {saved
                ? <><Check size={15} /> Salvo!</>
                : saving ? "Salvando…" : <><Check size={15} /> Salvar alterações</>}
            </button>
          </div>
        </div>

        {err && <p style={{ color: "var(--red,#c0392b)", fontSize: 13, marginBottom: 16, fontWeight: 500 }}>{err}</p>}

        {/* Two-column grid */}
        <div className="composer-grid">

          {/* Left column: editor + media */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="card editor" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div className="toolbtns">
                {["H", "B", "I", "|", "≡", "❝", "🔗"].map((b, i) =>
                  b === "|"
                    ? <span key={i} className="div" />
                    : <button key={i} className="tb" title={b}>{b}</button>
                )}
                <div style={{ flex: 1 }} />
                <button className="tb" style={{ color: "var(--coral-ink)", fontSize: 13 }}>✦ IA</button>
              </div>
              <div className="body-pad" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <input
                  className="title-input"
                  placeholder="Título do release"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <input
                  className="sub-input"
                  placeholder="Subtítulo / linha de apoio"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                />
                <textarea
                  className="body-input"
                  placeholder="Corpo do release…"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  style={{ flex: 1, minHeight: 320, resize: "none" }}
                />
              </div>
            </div>

            {/* Media gallery */}
            <MediaGallery
              images={images}
              onAdd={url => setImages(prev => [...prev, url])}
              onRemove={url => setImages(prev => prev.filter(u => u !== url))}
            />
          </div>

          {/* Right column */}
          <div>

            {/* Marca */}
            {brand && (
              <div className="card side-card">
                <div className="card-head"><h3>Marca</h3></div>
                <div className="sc-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: brand.color ?? "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {brand.logoUrl
                        ? <img src={brand.logoUrl} alt={brand.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> // eslint-disable-line @next/next/no-img-element
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
            <div className="card side-card" style={{ marginTop: 16 }}>
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
                      {["Você","Samara Perez","Liliane Pires","Analina Arouche","Daiana Napoleão"].map(a => <option key={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Publicação */}
            <div className="card side-card" style={{ marginTop: 16 }}>
              <div className="card-head"><h3>Publicação</h3></div>
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

            {/* Veículos */}
            <VehiclesCard selected={selectedVeh} setSelected={setSelectedVeh} />

          </div>
        </div>
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
