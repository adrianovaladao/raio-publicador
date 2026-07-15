"use client";

import { useState, useEffect } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, LayoutGrid, Plus, Inbox, Trash2, Copy, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Matéria {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  creditsUsed: number;
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
  creditsUsed: number;
  imageUrl?: string | null;
  brandColor?: string | null;
}

const STATUS_FILTERS = [
  { id: "all",             label: "Todos" },
  { id: "published",       label: "Publicados" },
  { id: "in_publication",  label: "Em publicação" },
  { id: "scheduled",       label: "Agendados" },
  { id: "needs_revision",  label: "Precisa revisão" },
  { id: "draft",           label: "Rascunhos" },
];

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  scheduled: "Agendado",
  draft: "Rascunho",
  review: "Em revisão",
  in_review: "Em análise",
  needs_revision: "Precisa revisão",
  rejected: "Reprovado",
  in_publication: "Em publicação",
  cancelled: "Cancelado",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d.getDate()).padStart(2,"0")} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

type SortCol = "title" | "status" | "date" | "author" | "cat" | "creditsUsed";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  published: 0, in_publication: 1, scheduled: 2, in_review: 3,
  needs_revision: 4, rejected: 5, draft: 6, cancelled: 7,
};

function sortMatérias(arr: ReleaseRow[], col: SortCol, dir: SortDir) {
  return [...arr].sort((a, b) => {
    if (col === "date") {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return dir === "asc" ? diff : -diff;
    }
    if (col === "status") {
      const diff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      return dir === "asc" ? diff : -diff;
    }
    if (col === "creditsUsed") {
      const diff = a.creditsUsed - b.creditsUsed;
      return dir === "asc" ? diff : -diff;
    }
    const cmp = (a[col] as string).localeCompare(b[col] as string, "pt-BR", { numeric: true, sensitivity: "base" });
    return dir === "asc" ? cmp : -cmp;
  });
}

function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  const base: React.CSSProperties = { marginLeft: 3, verticalAlign: "middle", flexShrink: 0 };
  if (col !== active) return <ArrowUpDown size={12} style={{ ...base, opacity: 0.3 }} />;
  return dir === "asc"
    ? <ArrowUp size={12} style={{ ...base, color: "var(--coral-ink)" }} />
    : <ArrowDown size={12} style={{ ...base, color: "var(--coral-ink)" }} />;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge-status ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

function ConfirmModal({ title, desc, onConfirm, onCancel }: { title: string; desc: string; onConfirm: () => void; onCancel: () => void }) {
  useEscapeKey(onCancel);
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
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  async function duplicateMatéria(id: string) {
    setDuplicating(id);
    try {
      const res = await fetch(`/api/releases/${id}/duplicate`, { method: "POST" });
      if (!res.ok) return;
      const copy = await res.json() as ReleaseRow & { title: string; createdAt: string };
      setReleases(prev => [{
        id: copy.id,
        title: copy.title,
        cat: prev.find(r => r.id === id)?.cat ?? "—",
        author: "Você",
        status: "draft",
        date: copy.createdAt,
        creditsUsed: 0,
        brandColor: prev.find(r => r.id === id)?.brandColor,
      }, ...prev]);
    } finally {
      setDuplicating(null);
    }
  }

  async function deleteRelease(id: string) {
    const releasing = releases.find(r => r.id === id);
    await fetch(`/api/releases/${id}`, { method: "DELETE" });
    setReleases(prev => prev.filter(r => r.id !== id));
    setConfirmId(null);
    if (releasing?.status === "scheduled") window.dispatchEvent(new Event("credits-changed"));
  }

  useEffect(() => {
    fetch("/api/releases")
      .then(r => r.json())
      .then((data: Matéria[]) => {
        const rows: ReleaseRow[] = data.map(r => ({
          id: r.id,
          title: r.title,
          cat: r.brand?.name ?? "—",
          author: "Você",
          status: r.status.toLowerCase(),
          date: r.scheduledAt ?? r.publishedAt ?? r.createdAt,
          creditsUsed: r.creditsUsed ?? 0,
          imageUrl: r.imageUrl,
          brandColor: r.brand?.color,
        }));
        setReleases(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = Object.fromEntries(
    STATUS_FILTERS.map(f => [f.id, f.id === "all" ? matérias.length : matérias.filter(r => r.status === f.id).length])
  );

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "date" ? "desc" : "asc"); }
  }

  const thStyle = (col: SortCol): React.CSSProperties => ({
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    color: sortCol === col ? "var(--coral-ink)" : undefined,
  });
  const thInner = (label: string, col: SortCol) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
      {label}<SortIcon col={col} active={sortCol} dir={sortDir} />
    </span>
  );

  let list = releases.filter(r => filter === "all" || r.status === filter);
  if (q.trim()) list = list.filter(r => (r.title + r.cat + r.author).toLowerCase().includes(q.toLowerCase()));
  list = sortMatérias(list, sortCol, sortDir);

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Conteúdo</p>
            <h2>Seus <em>matérias</em></h2>
            <p className="sub">Rascunhos, agendados e publicados — todo o histórico de distribuição em um só lugar.</p>
          </div>
          <div className="actions">
            <Link href="/releases/novo" className="btn btn-primary btn-sm">
              <Plus size={15} /> Novo matéria
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
            placeholder="Buscar matérias…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ width: 220, padding: "8px 14px", fontSize: 13 }}
          />
          <div className="seg" style={{ marginLeft: 8 }}>
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
            <div className="t">Nenhum matéria encontrado</div>
            <div className="h">Ajuste os filtros ou crie um novo release.</div>
          </div>
        ) : mode === "list" ? (
          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ ...thStyle("title"), width: "42%" }} onClick={() => handleSort("title")}>{thInner("Matéria", "title")}</th>
                  <th style={thStyle("status")} onClick={() => handleSort("status")}>{thInner("Status", "status")}</th>
                  <th style={thStyle("date")} onClick={() => handleSort("date")}>{thInner("Data", "date")}</th>
                  <th style={thStyle("author")} onClick={() => handleSort("author")}>{thInner("Autor", "author")}</th>
                  <th style={{ ...thStyle("cat"), textAlign: "right" }} onClick={() => handleSort("cat")}>{thInner("Marca", "cat")}</th>
                  <th style={{ ...thStyle("creditsUsed"), textAlign: "right", minWidth: 90 }} onClick={() => handleSort("creditsUsed")}>{thInner("Créditos", "creditsUsed")}</th>
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
                    <td className="num" style={{ textAlign: "right" }}>
                      {r.creditsUsed > 0
                        ? <span style={{ fontSize: 12, fontWeight: 600, color: "var(--coral-ink)", background: "var(--amber-soft)", padding: "2px 8px", borderRadius: 99 }}>{r.creditsUsed} cr</span>
                        : <span style={{ fontSize: 12, color: "var(--stone)" }}>—</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ whiteSpace: "nowrap" }}>
                      {r.status === "scheduled" && (
                        <button
                          onClick={() => duplicateMatéria(r.id)}
                          disabled={duplicating === r.id}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "var(--stone)", borderRadius: 6, display: "inline-flex", alignItems: "center" }}
                          title="Duplicar como rascunho"
                        >
                          <Copy size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmId(r.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "var(--stone)", borderRadius: 6, display: "inline-flex", alignItems: "center" }}
                        title="Excluir matéria"
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
                  title="Excluir matéria"
                >
                  <Trash2 size={14} />
                </button>
                <div className="thumb">
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
                  {r.creditsUsed > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--coral-ink)", background: "var(--amber-soft)", padding: "2px 8px", borderRadius: 99 }}>
                        {r.creditsUsed} créditos
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {confirmId && (
        <ConfirmModal
          title="Excluir matéria"
          desc="Tem certeza que deseja excluir este matéria? Esta ação não pode ser desfeita."
          onConfirm={() => deleteRelease(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
