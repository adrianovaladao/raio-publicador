"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Crown, FileText, ChevronDown, X, Check, AlertTriangle, Clock, Send, Eye } from "lucide-react";

interface ReleaseRow {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  vehicles: string[];
  adminNotes: string | null;
  publishedVehicleUrls: Record<string, string> | null;
  creditsUsed: number;
  author: { name: string; email: string };
  brand: { name: string; color: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendado",
  IN_REVIEW: "Em análise",
  NEEDS_REVISION: "Precisa revisão",
  REJECTED: "Reprovado",
  IN_PUBLICATION: "Em publicação",
  PUBLISHED: "Publicado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#888",
  SCHEDULED: "#2563EB",
  IN_REVIEW: "#7C3AED",
  NEEDS_REVISION: "#D97706",
  REJECTED: "#D94F4F",
  IN_PUBLICATION: "#059669",
  PUBLISHED: "#16A34A",
  CANCELLED: "#aaa",
};

const STATUS_BG: Record<string, string> = {
  DRAFT: "#f0f0f0",
  SCHEDULED: "#EFF6FF",
  IN_REVIEW: "#F5F3FF",
  NEEDS_REVISION: "#FFFBEB",
  REJECTED: "#FEF2F2",
  IN_PUBLICATION: "#ECFDF5",
  PUBLISHED: "#F0FDF4",
  CANCELLED: "#f5f5f5",
};

// Which statuses the admin can transition to from a given status
const TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ["IN_REVIEW"],
  IN_REVIEW: ["IN_PUBLICATION", "NEEDS_REVISION", "REJECTED"],
  NEEDS_REVISION: ["IN_REVIEW"],
  IN_PUBLICATION: ["PUBLISHED"],
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d.getDate()).padStart(2,"0")} ${meses[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
      color: STATUS_COLOR[status] ?? "#888",
      background: STATUS_BG[status] ?? "#f0f0f0",
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

interface ActionModalProps {
  release: ReleaseRow;
  targetStatus: string;
  onConfirm: (notes: string, vehicleUrls: Record<string, string>) => void;
  onCancel: () => void;
}

function ActionModal({ release, targetStatus, onConfirm, onCancel }: ActionModalProps) {
  const [notes, setNotes] = useState(release.adminNotes ?? "");
  const [vehicleUrls, setVehicleUrls] = useState<Record<string, string>>(release.publishedVehicleUrls ?? {});
  const needsNotes = targetStatus === "NEEDS_REVISION" || targetStatus === "REJECTED";
  const needsUrls = targetStatus === "PUBLISHED";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "grid", placeItems: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 28px", maxWidth: 520, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>
          {STATUS_LABEL[targetStatus]}
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "#666" }}>
          <strong>{release.title}</strong> · {release.author.name}
        </p>

        {needsNotes && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {targetStatus === "REJECTED" ? "Motivo da reprovação" : "Instruções para revisão"}
              {targetStatus === "NEEDS_REVISION" && <span style={{ color: "#D97706" }}> *</span>}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              placeholder="Descreva o motivo ou as alterações necessárias..."
            />
          </div>
        )}

        {needsUrls && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Links de publicação por veículo
            </label>
            {release.vehicles.map(vehicleId => (
              <div key={vehicleId} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, color: "#666", marginBottom: 4 }}>{vehicleId}</label>
                <input
                  type="url"
                  value={vehicleUrls[vehicleId] ?? ""}
                  onChange={e => setVehicleUrls(prev => ({ ...prev, [vehicleId]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1.5px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }}
                  placeholder="https://..."
                />
              </div>
            ))}
          </div>
        )}

        {!needsNotes && !needsUrls && (
          <p style={{ marginBottom: 20, fontSize: 14, color: "#444", background: "#f8f8f8", padding: "12px 14px", borderRadius: 8 }}>
            Confirma a transição para <strong>{STATUS_LABEL[targetStatus]}</strong>? O usuário será notificado por e-mail.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-sm"
            style={{ background: STATUS_COLOR[targetStatus] ?? "#1a1a1a", color: "#fff", border: "none" }}
            onClick={() => {
              if (needsNotes && targetStatus === "NEEDS_REVISION" && !notes.trim()) return;
              onConfirm(notes, vehicleUrls);
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

const FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "SCHEDULED", label: "Agendados" },
  { id: "IN_REVIEW", label: "Em análise" },
  { id: "NEEDS_REVISION", label: "Precisa revisão" },
  { id: "IN_PUBLICATION", label: "Em publicação" },
  { id: "PUBLISHED", label: "Publicados" },
  { id: "REJECTED", label: "Reprovados" },
  { id: "DRAFT", label: "Rascunhos" },
];

export default function AdminReleasesPage() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.raioAdmin === true;

  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<{ release: ReleaseRow; targetStatus: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/releases")
      .then(r => r.json())
      .then(setReleases)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  async function changeStatus(releaseId: string, status: string, notes: string, vehicleUrls: Record<string, string>) {
    setSaving(releaseId);
    setModal(null);
    await fetch(`/api/admin/releases/${releaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes || undefined, publishedVehicleUrls: Object.keys(vehicleUrls).length > 0 ? vehicleUrls : undefined }),
    });
    await load();
    setSaving(null);
  }

  if (!isLoaded) return null;
  if (!isAdmin) return (
    <div className="content" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Crown size={32} style={{ color: "var(--stone)" }} />
      <p style={{ color: "var(--stone)" }}>Acesso restrito.</p>
    </div>
  );

  const filtered = filter === "all" ? releases : releases.filter(r => r.status === filter);
  const counts = Object.fromEntries(FILTER_OPTIONS.map(f => [f.id, f.id === "all" ? releases.length : releases.filter(r => r.status === f.id).length]));

  // Releases that need attention (scheduled or needs_revision)
  const needsAction = releases.filter(r => r.status === "SCHEDULED" || r.status === "NEEDS_REVISION" || r.status === "IN_PUBLICATION").length;

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Admin · Raio Publicador</p>
            <h2>Gerenciar <em>releases</em></h2>
            <p className="sub">Analise, aprove e publique os releases dos usuários.</p>
          </div>
          {needsAction > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFFBEB", padding: "10px 16px", borderRadius: 10, border: "1.5px solid #FDE68A" }}>
              <AlertTriangle size={16} style={{ color: "#D97706" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>{needsAction} release{needsAction !== 1 ? "s" : ""} aguardando ação</span>
            </div>
          )}
        </div>

        {/* Status filter chips */}
        <div className="toolbar" style={{ flexWrap: "wrap" }}>
          <div className="chips" style={{ flexWrap: "wrap" }}>
            {FILTER_OPTIONS.map(f => (
              <button key={f.id} className={`chip${filter === f.id ? " active" : ""}`} onClick={() => setFilter(f.id)}>
                {f.label} <span className="ct">{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card empty"><div className="muted">Carregando releases…</div></div>
        ) : filtered.length === 0 ? (
          <div className="card empty">
            <FileText size={34} />
            <div className="t">Nenhum release encontrado</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(r => {
              const transitions = TRANSITIONS[r.status] ?? [];
              const isExpanded = expanded === r.id;
              const isSaving = saving === r.id;

              return (
                <div key={r.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Header row */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer" }}
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{r.title}</span>
                        <StatusBadge status={r.status} />
                        {isSaving && <span style={{ fontSize: 12, color: "#888" }}>Salvando…</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span>{r.author.name} · {r.author.email}</span>
                        {r.brand && <span style={{ color: r.brand.color ?? "#888" }}>● {r.brand.name}</span>}
                        <span><Clock size={11} style={{ verticalAlign: "middle" }} /> {fmtDate(r.scheduledAt ?? r.createdAt)}</span>
                        <span>{r.vehicles.length} veículo{r.vehicles.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {transitions.length > 0 && !isSaving && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        {transitions.map(ts => (
                          <button
                            key={ts}
                            onClick={() => setModal({ release: r, targetStatus: ts })}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 7,
                              border: "1.5px solid",
                              borderColor: STATUS_COLOR[ts] ?? "#ccc",
                              background: STATUS_BG[ts] ?? "#f8f8f8",
                              color: STATUS_COLOR[ts] ?? "#444",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            {ts === "IN_REVIEW" && <Eye size={13} />}
                            {ts === "IN_PUBLICATION" && <Send size={13} />}
                            {ts === "PUBLISHED" && <Check size={13} />}
                            {ts === "NEEDS_REVISION" && <AlertTriangle size={13} />}
                            {ts === "REJECTED" && <X size={13} />}
                            {STATUS_LABEL[ts]}
                          </button>
                        ))}
                      </div>
                    )}

                    <ChevronDown
                      size={16}
                      style={{ color: "#bbb", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    />
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid #f0f0f0", padding: "16px 20px", background: "#fafafa" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", fontSize: 13, marginBottom: 16 }}>
                        <div>
                          <div style={{ color: "#888", marginBottom: 2 }}>ID do release</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#1a1a1a" }}>{r.id}</div>
                        </div>
                        <div>
                          <div style={{ color: "#888", marginBottom: 2 }}>Criado em</div>
                          <div>{fmtDate(r.createdAt)}</div>
                        </div>
                        {r.scheduledAt && (
                          <div>
                            <div style={{ color: "#888", marginBottom: 2 }}>Agendado para</div>
                            <div>{fmtDate(r.scheduledAt)}</div>
                          </div>
                        )}
                        {r.publishedAt && (
                          <div>
                            <div style={{ color: "#888", marginBottom: 2 }}>Publicado em</div>
                            <div>{fmtDate(r.publishedAt)}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ color: "#888", marginBottom: 2 }}>Créditos usados</div>
                          <div>{r.creditsUsed}</div>
                        </div>
                        <div>
                          <div style={{ color: "#888", marginBottom: 2 }}>Veículos</div>
                          <div>{r.vehicles.join(", ") || "—"}</div>
                        </div>
                      </div>

                      {r.adminNotes && (
                        <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Notas do admin</div>
                          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>{r.adminNotes}</div>
                        </div>
                      )}

                      {r.publishedVehicleUrls && Object.keys(r.publishedVehicleUrls).length > 0 && (
                        <div style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Links de publicação</div>
                          {Object.entries(r.publishedVehicleUrls).map(([name, url]) => (
                            <div key={name} style={{ display: "flex", gap: 10, marginBottom: 4, fontSize: 13 }}>
                              <span style={{ color: "#888", minWidth: 120 }}>{name}</span>
                              <a href={url} target="_blank" rel="noreferrer" style={{ color: "#2563EB", wordBreak: "break-all" }}>{url}</a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <ActionModal
          release={modal.release}
          targetStatus={modal.targetStatus}
          onConfirm={(notes, urls) => changeStatus(modal.release.id, modal.targetStatus, notes, urls)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
