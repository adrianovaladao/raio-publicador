"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Crown, FileText, Trash2, ChevronDown, AlertTriangle, Clock, ExternalLink, Send, Copy, Download, Check, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { isAnyAdmin } from "@/lib/admin";

// ── DatePicker do admin (sem restrições de feriado) ───────────────────────────
const MESES_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW_SHORT  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function AdminDatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [viewY, setViewY] = useState(value ? new Date(value + "T12:00:00").getFullYear() : now.getFullYear());
  const [viewM, setViewM] = useState(value ? new Date(value + "T12:00:00").getMonth() : now.getMonth());

  const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const todayKey = toKey(now);

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

  const lead = new Date(viewY, viewM, 1).getDay();
  const dim  = new Date(viewY, viewM + 1, 0).getDate();
  const prevDim = new Date(viewY, viewM, 0).getDate();
  const cells: { d: number; out: boolean; key: string }[] = [];
  for (let i = 0; i < lead; i++) {
    const d = new Date(viewY, viewM - 1, prevDim - lead + 1 + i);
    cells.push({ d: d.getDate(), out: true, key: toKey(d) });
  }
  for (let d = 1; d <= dim; d++) cells.push({ d, out: false, key: toKey(new Date(viewY, viewM, d)) });
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
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: value ? "#1a1a1a" : "#fff", color: value ? "#fff" : "#555", borderColor: value ? "#1a1a1a" : undefined, whiteSpace: "nowrap" }}
      >
        <Calendar size={14} />
        <span style={{ fontSize: 13 }}>{value ? fmtDisplay(value) : "Filtrar por data"}</span>
        {value && (
          <span
            onClick={e => { e.stopPropagation(); onChange(""); }}
            style={{ marginLeft: 2, display: "flex", alignItems: "center", opacity: 0.7, cursor: "pointer" }}
          >
            <X size={12} />
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 999, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.10)", padding: 16, width: 280 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#888" }}><ChevronLeft size={14} /></button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>{MESES_FULL[viewM]} {viewY}</span>
            <button type="button" onClick={() => shiftMonth(1)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#888" }}><ChevronRight size={14} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DOW_SHORT.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, paddingBottom: 6, color: "#aaa" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((c, i) => {
              const sel = c.key === value;
              const isToday = c.key === todayKey;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onChange(c.key); setOpen(false); }}
                  style={{
                    border: isToday && !sel ? "1.5px solid #1a1a1a" : "1.5px solid transparent",
                    borderRadius: 8,
                    background: sel ? "#1a1a1a" : "none",
                    color: sel ? "#fff" : c.out ? "#ddd" : "#1a1a1a",
                    fontSize: 12, fontWeight: sel ? 700 : 400,
                    padding: "6px 0", cursor: "pointer", textAlign: "center",
                  }}
                >{c.d}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface VehicleRef { id: string; name: string; }

interface ReleaseRow {
  id: string;
  shortId: string;
  title: string;
  summary: string | null;
  body: string;
  imageUrl: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  vehicles: string[];
  vehicleNames: VehicleRef[];
  adminNotes: string | null;
  publishedVehicleUrls: Record<string, string> | null;
  creditsUsed: number;
  author: { name: string; email: string };
  brand: { name: string; color: string | null; logoUrl: string | null } | null;
}

const ALL_STATUSES = [
  { value: "DRAFT",          label: "Rascunho" },
  { value: "SCHEDULED",      label: "Agendado" },
  { value: "NEEDS_REVISION", label: "Precisa revisão" },
  { value: "REJECTED",       label: "Reprovado" },
  { value: "IN_PUBLICATION", label: "Em publicação" },
  { value: "PUBLISHED",      label: "Publicado" },
  { value: "CANCELLED",      label: "Cancelado" },
];

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#888", SCHEDULED: "#2563EB",
  NEEDS_REVISION: "#D97706", REJECTED: "#D94F4F",
  IN_PUBLICATION: "#059669", PUBLISHED: "#16A34A", CANCELLED: "#aaa",
};
const STATUS_BG: Record<string, string> = {
  DRAFT: "#f0f0f0", SCHEDULED: "#EFF6FF",
  NEEDS_REVISION: "#FFFBEB", REJECTED: "#FEF2F2",
  IN_PUBLICATION: "#ECFDF5", PUBLISHED: "#F0FDF4", CANCELLED: "#f5f5f5",
};

function StatusBadge({ status }: { status: string }) {
  const label = ALL_STATUSES.find(s => s.value === status)?.label ?? status;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      color: STATUS_COLOR[status] ?? "#888",
      background: STATUS_BG[status] ?? "#f0f0f0",
    }}>{label}</span>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const mm = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][d.getMonth()];
  return `${String(d.getDate()).padStart(2,"0")} ${mm} ${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function htmlToText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText ?? div.textContent ?? "";
}

function extractImages(html: string): string[] {
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  return matches.map(m => m[1]);
}

// ── Painel de ações ───────────────────────────────────────────────────────────
function ReleaseActions({ release, onSaved, onDeleted }: {
  release: ReleaseRow;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [newStatus, setNewStatus] = useState(release.status);
  const [notes, setNotes] = useState(release.adminNotes ?? "");
  const [vehicleUrls, setVehicleUrls] = useState<Record<string, string>>(release.publishedVehicleUrls ?? {});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [copied, setCopied] = useState(false);

  const statusChanged = newStatus !== release.status;
  const notesChanged = notes !== (release.adminNotes ?? "");
  const urlsChanged = JSON.stringify(vehicleUrls) !== JSON.stringify(release.publishedVehicleUrls ?? {});
  const hasChanges = statusChanged || notesChanged || urlsChanged;

  const allUrlsFilled = release.vehicleNames.length > 0
    && release.vehicleNames.every(v => !!vehicleUrls[v.id]?.trim());

  async function save(notify = false) {
    setSaving(true); setErr(""); setOk("");
    try {
      const res = await fetch(`/api/admin/releases/${release.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(statusChanged && { status: newStatus }),
          adminNotes: notes || undefined,
          ...(Object.keys(vehicleUrls).length > 0 && { publishedVehicleUrls: vehicleUrls }),
          notifyUser: notify,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro"); }
      setOk(notify ? "Salvo e usuário notificado!" : "Salvo!");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true); setErr("");
    try {
      const res = await fetch(`/api/admin/releases/${release.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erro"); }
      onDeleted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao excluir");
      setDeleting(false);
    }
  }

  function buildReleaseHtml(forExport = false) {
    const subtitle = release.summary
      ? `<p style="font-style:italic;font-size:16px;color:#444;margin:0 0 24px;line-height:1.5">${release.summary}</p>`
      : "";

    // Strip "Sobre a <Marca>" footer block from body for copy/paste
    const bodyHtml = release.body.replace(/<h[23][^>]*>\s*Sobre[^<]*<\/h[23]>[\s\S]*$/i, "").trimEnd();

    const body = `
      <h1 style="font-size:32px;font-weight:700;margin:0 0 12px;line-height:1.2;color:#1a1a1a">${release.title}</h1>
      ${subtitle}
      <div style="font-size:16px;color:#1a1a1a;line-height:1.7;margin-top:24px">${bodyHtml}</div>`;

    if (!forExport) return body;

    const vehicleList = release.vehicleNames.map(v => `<li>${v.name}</li>`).join("");
    const urlList = Object.entries(release.publishedVehicleUrls ?? {})
      .map(([k, u]) => `<li>${k}: <a href="${u}">${u}</a></li>`).join("");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${release.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.7; }
    img { max-width: 100%; height: auto; }
    .section { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
    .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #888; margin-bottom: 10px; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  ${body}
  ${vehicleList ? `<div class="section"><h3>Veículos</h3><ul>${vehicleList}</ul></div>` : ""}
  ${urlList ? `<div class="section"><h3>Links de publicação</h3><ul>${urlList}</ul></div>` : ""}
</body>
</html>`;
  }

  async function handleCopyContent() {
    const richHtml = buildReleaseHtml(false);
    const plainText = `${release.title}\n\n${release.summary ? release.summary + "\n\n" : ""}${htmlToText(release.body)}`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([richHtml], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(plainText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const html = buildReleaseHtml(true);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `release-${release.shortId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const needsNotes = newStatus === "NEEDS_REVISION" || newStatus === "REJECTED";
  const images = extractImages(release.body);

  return (
    <div style={{ borderTop: "1px solid #f0f0f0", padding: "20px 20px", background: "#fafafa" }}>

      {/* Conteúdo da release */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Conteúdo da release
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCopyContent}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: copied ? "#16A34A" : "#555" }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar conteúdo"}
            </button>
            <button
              onClick={handleExport}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: "#555" }}
            >
              <Download size={13} /> Exportar HTML
            </button>
          </div>
        </div>
        <div
          style={{
            background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 8,
            padding: "16px 20px", fontSize: 14, lineHeight: 1.7, color: "#1a1a1a",
            maxHeight: 400, overflowY: "auto",
          }}
          dangerouslySetInnerHTML={{ __html: release.body }}
        />
        {images.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {images.map((src, i) => (
              <img key={i} src={src} alt="" style={{ height: 72, width: "auto", borderRadius: 6, border: "1px solid #eee", objectFit: "cover" }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginBottom: 20 }}>

        {/* Status */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            className="input"
            style={{ width: "auto", minWidth: 200, fontSize: 14 }}
          >
            {ALL_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Notas do admin */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Notas do admin {needsNotes && <span style={{ color: "#D97706" }}>*</span>}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder={needsNotes ? "Obrigatório: descreva o motivo ou as correções necessárias…" : "Observações internas (opcional)…"}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 13.5, resize: "vertical", boxSizing: "border-box", background: "#fff" }}
          />
        </div>

        {/* Links de publicação por veículo */}
        {release.vehicleNames.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Links de publicação por veículo
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {release.vehicleNames.map(v => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#444", minWidth: 160, flexShrink: 0, fontWeight: 500 }}>{v.name}</span>
                  <input
                    type="url"
                    value={vehicleUrls[v.id] ?? ""}
                    onChange={e => setVehicleUrls(prev => ({ ...prev, [v.id]: e.target.value }))}
                    placeholder="https://…"
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: "1.5px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }}
                  />
                  {vehicleUrls[v.id] && (
                    <a href={/^https?:\/\//i.test(vehicleUrls[v.id]) ? vehicleUrls[v.id] : `https://${vehicleUrls[v.id]}`} target="_blank" rel="noreferrer" style={{ color: "#2563EB", flexShrink: 0 }}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadados */}
        <div>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Criado em</div>
          <div style={{ fontSize: 13 }}>{fmtDate(release.createdAt)}</div>
        </div>
        {release.scheduledAt && (
          <div>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Agendado para</div>
            <div style={{ fontSize: 13 }}>{fmtDate(release.scheduledAt)}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Créditos</div>
          <div style={{ fontSize: 13 }}>{release.creditsUsed}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>ID</div>
          <div style={{ fontSize: 13, fontFamily: "var(--mono)", color: "#666", fontWeight: 600 }}>{release.shortId}</div>
        </div>
      </div>

      {err && <p style={{ fontSize: 13, color: "#D94F4F", marginBottom: 12 }}>{err}</p>}
      {ok && <p style={{ fontSize: 13, color: "#16A34A", marginBottom: 12 }}>{ok}</p>}

      {/* Botões */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => save(false)}
          disabled={saving || !hasChanges || (needsNotes && !notes.trim())}
          className="btn btn-sm"
          style={{ background: "#1a1a1a", color: "#fff", border: "none", opacity: (!hasChanges || (needsNotes && !notes.trim())) ? 0.4 : 1 }}
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
        {release.vehicleNames.length > 0 && (
          <button
            onClick={() => save(true)}
            disabled={saving || !allUrlsFilled}
            className="btn btn-sm"
            style={{
              background: allUrlsFilled ? "#059669" : "#e0e0e0",
              color: allUrlsFilled ? "#fff" : "#999",
              border: "none",
              display: "flex", alignItems: "center", gap: 6,
              cursor: allUrlsFilled ? "pointer" : "not-allowed",
            }}
          >
            <Send size={13} /> Enviar notificação ao usuário
          </button>
        )}

        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost btn-sm" style={{ color: "#D94F4F", marginLeft: "auto" }}>
            <Trash2 size={14} /> Excluir release
          </button>
        ) : (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#D94F4F", fontWeight: 600 }}>Confirma exclusão?</span>
            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="btn btn-sm" style={{ background: "#D94F4F", color: "#fff", border: "none" }}>
              {deleting ? "Excluindo…" : "Excluir"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AdminReleasesPage() {
  const { user, isLoaded } = useUser();
  const isAdmin = isAnyAdmin(user?.publicMetadata as Record<string, unknown>);

  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"queue" | "published">("queue");
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/releases")
      .then(r => r.json())
      .then(setReleases)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selected).map(id =>
        fetch(`/api/admin/releases/${id}`, { method: "DELETE" })
      ));
      setSelected(new Set());
      setBulkConfirm(false);
      load();
    } finally {
      setBulkDeleting(false);
    }
  }

  function toggleSelect(id: string, e: { stopPropagation: () => void }) {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  if (!isLoaded) return null;
  if (!isAdmin) return (
    <div className="content" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Crown size={32} style={{ color: "var(--stone)" }} />
      <p style={{ color: "var(--stone)" }}>Acesso restrito.</p>
    </div>
  );

  const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const todayStr = new Date().toDateString();

  function dateKey(iso: string | null, fallback: string) {
    const d = new Date(iso ?? fallback);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function dateLabel(key: string) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const base = `${d} de ${MONTHS[m-1]} de ${y}`;
    return date.toDateString() === todayStr ? `Hoje — ${base}` : base;
  }

  function groupByDate<T>(items: T[], keyFn: (item: T) => string): { key: string; label: string; items: T[] }[] {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const k = keyFn(item);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(item);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, label: dateLabel(key), items }));
  }

  const searchFilter = (r: ReleaseRow) =>
    !q.trim() || (r.title + r.author.name + r.author.email + (r.brand?.name ?? "")).toLowerCase().includes(q.toLowerCase());

  const dateFilterFn = (r: ReleaseRow, dateField: string | null) =>
    !dateFilter || dateKey(dateField, r.createdAt) === dateFilter;

  const queueReleases = releases
    .filter(r => r.status !== "PUBLISHED" && r.status !== "CANCELLED")
    .filter(searchFilter)
    .filter(r => dateFilterFn(r, r.scheduledAt))
    .sort((a, b) => new Date(a.scheduledAt ?? a.createdAt).getTime() - new Date(b.scheduledAt ?? b.createdAt).getTime());

  const publishedReleases = releases
    .filter(r => r.status === "PUBLISHED")
    .filter(searchFilter)
    .filter(r => dateFilterFn(r, r.publishedAt))
    .sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime());

  const queueGroups = groupByDate(queueReleases, r => dateKey(r.scheduledAt, r.createdAt));
  const publishedGroups = groupByDate(publishedReleases, r => dateKey(r.publishedAt, r.createdAt));

  const activeList = tab === "queue" ? queueReleases : publishedReleases;
  const needsAction = releases.filter(r => ["SCHEDULED", "IN_PUBLICATION"].includes(r.status)).length;

  function ReleaseCard({ r }: { r: ReleaseRow }) {
    const isExpanded = expanded === r.id;
    return (
      <div key={r.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer" }}
          onClick={() => setExpanded(isExpanded ? null : r.id)}
        >
          <input
            type="checkbox"
            checked={selected.has(r.id)}
            onClick={e => toggleSelect(r.id, e)}
            onChange={() => {}}
            style={{ width: 15, height: 15, flexShrink: 0, cursor: "pointer" }}
          />
          {r.imageUrl && (
            <img src={r.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid #eee" }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{r.title}</span>
              <StatusBadge status={r.status} />
              {r.brand && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555", background: "#f5f5f3", borderRadius: 99, padding: "2px 9px" }}>
                  {r.brand.color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.brand.color, flexShrink: 0 }} />}
                  {r.brand.name}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#999", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontWeight: 500, color: "#555" }}>{r.author.name}</span>
              <span>{r.author.email}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> {fmtDate(r.scheduledAt ?? r.createdAt)}
              </span>
              <span>{r.vehicleNames.length} veículo{r.vehicleNames.length !== 1 ? "s" : ""}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#bbb" }}>{r.shortId}</span>
            </div>
          </div>
          <ChevronDown size={16} style={{ color: "#bbb", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
        {isExpanded && (
          <ReleaseActions release={r} onSaved={() => load()} onDeleted={() => { setExpanded(null); load(); }} />
        )}
      </div>
    );
  }

  const activeGroups = tab === "queue" ? queueGroups : publishedGroups;

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Admin · Raio Publicador</p>
            <h2>Gerenciar <em>releases</em></h2>
            <p className="sub">Analise, aprove, publique e gerencie todas as releases da plataforma.</p>
          </div>
          {needsAction > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFFBEB", padding: "10px 16px", borderRadius: 10, border: "1.5px solid #FDE68A" }}>
              <AlertTriangle size={16} style={{ color: "#D97706" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>{needsAction} aguardando ação</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, background: "#f0f0ee", borderRadius: 10, padding: 3, alignSelf: "flex-start", marginBottom: 20 }}>
          {([["queue", "Fila de publicação", queueReleases.length], ["published", "Publicados", publishedReleases.length]] as const).map(([t, label, count]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(new Set()); setDateFilter(""); }}
              style={{
                padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#1a1a1a" : "#888",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 7,
              }}
            >
              {label}
              <span style={{ fontSize: 11, fontWeight: 700, background: tab === t ? "#f0f0ee" : "#e8e8e8", borderRadius: 99, padding: "1px 7px", color: "#555" }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {activeList.length > 0 && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={activeList.every(r => selected.has(r.id))}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && !activeList.every(r => selected.has(r.id)); }}
                  onChange={e => {
                    if (e.target.checked) setSelected(new Set(activeList.map(r => r.id)));
                    else setSelected(new Set());
                  }}
                  style={{ width: 15, height: 15 }}
                />
                {selected.size > 0 ? `${selected.size} selecionado${selected.size > 1 ? "s" : ""}` : "Selecionar todos"}
              </label>
            )}
            {selected.size > 0 && !bulkConfirm && (
              <button onClick={() => setBulkConfirm(true)} className="btn btn-sm" style={{ background: "#FEF2F2", color: "#D94F4F", border: "1.5px solid #FECACA", display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={13} /> Excluir {selected.size}
              </button>
            )}
            {bulkConfirm && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#D94F4F", fontWeight: 600 }}>Confirma exclusão de {selected.size}?</span>
                <button onClick={() => setBulkConfirm(false)} className="btn btn-ghost btn-sm">Cancelar</button>
                <button onClick={handleBulkDelete} disabled={bulkDeleting} className="btn btn-sm" style={{ background: "#D94F4F", color: "#fff", border: "none" }}>
                  {bulkDeleting ? "Excluindo…" : "Confirmar"}
                </button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <AdminDatePicker value={dateFilter} onChange={setDateFilter} />
            <input
              className="input"
              placeholder="Buscar…"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ width: 200, padding: "8px 14px", fontSize: 13 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="card empty"><div className="muted">Carregando releases…</div></div>
        ) : activeGroups.length === 0 ? (
          <div className="card empty">
            <FileText size={34} />
            <div className="t">{tab === "queue" ? "Nenhuma release na fila" : "Nenhuma release publicado"}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 40, paddingBottom: 64 }}>
            {activeGroups.map(group => (
              <div key={group.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap" }}>{group.label}</span>
                  <span style={{ fontSize: 12, color: "#bbb", whiteSpace: "nowrap" }}>{group.items.length} release{group.items.length !== 1 ? "s" : ""}</span>
                  <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {group.items.map(r => <ReleaseCard key={r.id} r={r} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
