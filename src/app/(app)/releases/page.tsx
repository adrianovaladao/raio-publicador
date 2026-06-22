"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, LayoutGrid, Plus, Inbox, Trash2 } from "lucide-react";

interface Release {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  authorId: string;
  imageUrl?: string | null;
  brand: { name: string; color: string | null } | null;
}

interface ReleaseRow {
  id: string;
  title: string;
  cat: string;
  author: string;
  status: string;
  date: string;
  imageUrl?: string | null;
  brandColor?: string | null;
}

const STATUS_FILTERS = [
  { id: "all",       label: "Todos" },
  { id: "published", label: "Publicados" },
  { id: "scheduled", label: "Agendados" },
  { id: "review",    label: "Em revisão" },
  { id: "draft",     label: "Rascunhos" },
];

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  scheduled: "Agendado",
  draft: "Rascunho",
  review: "Em revisão",
  cancelled: "Cancelado",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d.getDate()).padStart(2,"0")} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge-status ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

function ConfirmModal({ title, desc, onConfirm, onCancel }: { title: string; desc: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999, display: "grid", placeItems: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 400, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--stone)", lineHeight: 1.5 }}>{desc}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-sm" style={{ background: "#D94F4F", color: "#fff", border: "none" }} onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

export default function ReleasesPage() {
  const router = useRouter();
  const [mode, setMode]     = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState("all");
  const [q, setQ]           = useState("");
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function deleteRelease(id: string) {
    await fetch(`/api/releases/${id}`, { method: "DELETE" });
    setReleases(prev => prev.filter(r => r.id !== id));
    setConfirmId(null);
  }

  useEffect(() => {
    fetch("/api/releases")
      .then(r => r.json())
      .then((data: Release[]) => {
        const rows: ReleaseRow[] = data.map(r => ({
          id: r.id,
          title: r.title,
          cat: r.brand?.name ?? "—",
          author: "Você",
          status: r.status.toLowerCase(),
          date: r.createdAt,
          imageUrl: r.imageUrl,
          brandColor: r.brand?.color,
        }));
        setReleases(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = Object.fromEntries(
    STATUS_FILTERS.map(f => [f.id, f.id === "all" ? releases.length : releases.filter(r => r.status === f.id).length])
  );

  let list = releases.filter(r => filter === "all" || r.status === filter);
  if (q.trim()) list = list.filter(r => (r.title + r.cat + r.author).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Conteúdo</p>
            <h2>Seus <em>releases</em></h2>
            <p className="sub">Rascunhos, agendados e publicados — todo o histórico de distribuição em um só lugar.</p>
          </div>
          <div className="actions">
            <Link href="/releases/novo" className="btn btn-primary btn-sm">
              <Plus size={15} /> Novo release
            </Link>
          </div>
        </div>

        <div className="toolbar">
          <div className="chips">
            {STATUS_FILTERS.map(f => (
              <button key={f.id} className={`chip${filter === f.id ? " active" : ""}`} onClick={() => setFilter(f.id)}>
                {f.label} <span className="ct">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <div className="spacer" />
          <input
            className="input"
            placeholder="Buscar releases…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ width: 220, padding: "8px 14px", fontSize: 13 }}
          />
          <div className="seg">
            <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}><List size={15} /> Lista</button>
            <button className={mode === "grid" ? "active" : ""} onClick={() => setMode("grid")}><LayoutGrid size={15} /> Grade</button>
          </div>
        </div>

        {loading ? (
          <div className="card empty">
            <div className="muted">Carregando…</div>
          </div>
        ) : list.length === 0 ? (
          <div className="card empty">
            <Inbox size={34} />
            <div className="t">Nenhum release encontrado</div>
            <div className="h">Ajuste os filtros ou crie um novo release.</div>
          </div>
        ) : mode === "list" ? (
          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: "42%" }}>Release</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Autor</th>
                  <th style={{ textAlign: "right" }}>Marca</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/releases/${r.id}`)}>
                    <td className="title-cell">
                      {r.title.length > 70 ? r.title.slice(0, 70) + "…" : r.title}
                      <span className="ph">{r.cat}</span>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="muted num">{fmtDate(r.date)}</td>
                    <td className="muted">{r.author}</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{r.cat}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setConfirmId(r.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "var(--stone)", borderRadius: 6, display: "flex", alignItems: "center" }}
                        title="Excluir release"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lib-grid">
            {list.map(r => (
              <div className="card lib-card" key={r.id} style={{ cursor: "pointer", position: "relative" }} onClick={() => router.push(`/releases/${r.id}`)}>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmId(r.id); }}
                  style={{ position: "absolute", top: 10, right: 10, zIndex: 2, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 8, padding: "5px 7px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}
                  title="Excluir release"
                >
                  <Trash2 size={14} />
                </button>
                <div className="thumb" style={r.imageUrl ? {} : { background: r.brandColor ?? undefined }}>
                  {r.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <span className="cat" style={{ position: "relative", zIndex: 1 }}>
                    <span className="pill" style={{ background: "var(--paper)", borderColor: "transparent" }}>{r.cat}</span>
                  </span>
                  {!r.imageUrl && <span className="tag-ph">{r.cat.toLowerCase()}</span>}
                </div>
                <div className="body">
                  <h4>{r.title.length > 80 ? r.title.slice(0, 80) + "…" : r.title}</h4>
                  <div className="foot">
                    <StatusBadge status={r.status} />
                    <span className="when">{fmtDate(r.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {confirmId && (
        <ConfirmModal
          title="Excluir release"
          desc="Tem certeza que deseja excluir este release? Esta ação não pode ser desfeita."
          onConfirm={() => deleteRelease(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
