"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { List, LayoutGrid, Plus, Inbox } from "lucide-react";

interface Release {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  authorId: string;
  brand: { name: string; color: string } | null;
}

interface ReleaseRow {
  id: string;
  title: string;
  cat: string;
  author: string;
  status: string;
  date: string;
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

export default function ReleasesPage() {
  const [mode, setMode]     = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState("all");
  const [q, setQ]           = useState("");
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [loading, setLoading]   = useState(true);

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
                </tr>
              </thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id}>
                    <td className="title-cell">
                      {r.title.length > 70 ? r.title.slice(0, 70) + "…" : r.title}
                      <span className="ph">{r.cat}</span>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="muted num">{fmtDate(r.date)}</td>
                    <td className="muted">{r.author}</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{r.cat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lib-grid">
            {list.map(r => (
              <div className="card lib-card" key={r.id}>
                <div className="thumb">
                  <span className="cat">
                    <span className="pill" style={{ background: "var(--paper)", borderColor: "transparent" }}>{r.cat}</span>
                  </span>
                  <span className="tag-ph">{r.cat.toLowerCase()}</span>
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
    </div>
  );
}
