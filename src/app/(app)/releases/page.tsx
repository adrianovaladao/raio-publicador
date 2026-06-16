"use client";

import { useState } from "react";
import Link from "next/link";
import { List, LayoutGrid, Plus, Inbox } from "lucide-react";

const RELEASES = [
  { id: "r1", title: "Rede de franquias de alimentação anuncia expansão de 120 unidades em 2026", cat: "Franquias", author: "Liliane Pires",    status: "published", date: "2026-05-28", vehicles: 18, reach: 12400000, excerpt: "A marca, presente em 14 estados, projeta dobrar de tamanho até o fim do ano com foco em modelos compactos de operação e quiosques em shoppings.", thumb: "coral" },
  { id: "r2", title: "Fintech de crédito para PMEs capta R$ 45 milhões em rodada Série A",        cat: "Negócios",  author: "Analina Arouche", status: "scheduled", date: "2026-06-05", vehicles: 12, reach: 0,        excerpt: "Com a nova rodada liderada por fundos nacionais, a empresa pretende triplicar a base de clientes e lançar conta digital ainda no segundo semestre.", thumb: "ink" },
  { id: "r3", title: "Varejista lança programa de logística reversa em 200 lojas",                 cat: "Varejo",    author: "Daiana Napoleão", status: "published", date: "2026-05-21", vehicles: 9,  reach: 6300000,  excerpt: "A operação integra pontos de coleta nas lojas físicas a uma malha de reciclagem regional, reduzindo custos e reforçando a pauta ESG.", thumb: "plain" },
  { id: "r4", title: "Startup de logística inteligente abre operação no Sul do país",              cat: "Tecnologia",author: "Analina Arouche", status: "scheduled", date: "2026-06-11", vehicles: 7,  reach: 0,        excerpt: "A expansão cria 140 vagas diretas e conecta a malha logística da empresa a mais de 80 municípios gaúchos.", thumb: "plain" },
  { id: "r5", title: "Pesquisa aponta crescimento de 23% no setor de franquias de serviços",      cat: "Franquias", author: "Liliane Pires",    status: "review",    date: "2026-06-03", vehicles: 0,  reach: 0,        excerpt: "Dados do levantamento anual mostram que serviços automotivos e estética lideram a abertura de novas unidades em 2026.", thumb: "coral" },
  { id: "r6", title: "Indústria de bebidas inaugura fábrica carbono neutro no interior de SP",    cat: "Negócios",  author: "Daiana Napoleão", status: "published", date: "2026-05-14", vehicles: 15, reach: 9800000,  excerpt: "A unidade é a primeira da companhia a operar com certificação de neutralidade de carbono, parte da meta de zerar emissões até 2030.", thumb: "ink" },
  { id: "r7", title: "Marca de cosméticos estreia linha vegana com 40 produtos",                   cat: "Varejo",    author: "Liliane Pires",    status: "draft",     date: "2026-06-02", vehicles: 0,  reach: 0,        excerpt: "O portfólio chega a farmácias e ao e-commerce próprio, com expectativa de representar 30% das vendas no primeiro ano.", thumb: "plain" },
  { id: "r8", title: "Plataforma de educação corporativa firma parceria com 50 universidades",    cat: "Tecnologia",author: "Analina Arouche", status: "published", date: "2026-05-08", vehicles: 8,  reach: 5100000,  excerpt: "A parceria disponibiliza trilhas de formação para mais de 2 milhões de profissionais, com certificação reconhecida pelo MEC.", thumb: "plain" },
  { id: "r9", title: "Grupo de shoppings anuncia R$ 1,2 bi em investimentos para 2026",           cat: "Economia",  author: "Daiana Napoleão", status: "scheduled", date: "2026-06-18", vehicles: 14, reach: 0,        excerpt: "O plano prevê a abertura de três novos empreendimentos e a modernização de oito unidades já existentes nas regiões Sul e Sudeste.", thumb: "ink" },
];

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
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${String(d).padStart(2,"0")} ${meses[m - 1]} ${y}`;
}

function fmtReach(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge-status ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export default function ReleasesPage() {
  const [mode, setMode]     = useState<"list" | "grid">("list");
  const [filter, setFilter] = useState("all");
  const [q, setQ]           = useState("");

  const counts = Object.fromEntries(
    STATUS_FILTERS.map(f => [f.id, f.id === "all" ? RELEASES.length : RELEASES.filter(r => r.status === f.id).length])
  );

  let list = RELEASES.filter(r => filter === "all" || r.status === filter);
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

        {list.length === 0 ? (
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
                  <th>Veículos</th>
                  <th style={{ textAlign: "right" }}>Alcance</th>
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
                    <td className="num">{r.vehicles || "—"}</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{fmtReach(r.reach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lib-grid">
            {list.map(r => (
              <div className="card lib-card" key={r.id}>
                <div className={`thumb${r.thumb === "ink" ? " ink" : r.thumb === "coral" ? " coral" : ""}`}>
                  <span className="cat">
                    <span className="pill" style={{ background: r.thumb === "ink" ? "rgba(255,255,255,0.92)" : "var(--paper)", borderColor: "transparent" }}>{r.cat}</span>
                  </span>
                  <span className="tag-ph">imagem do release · {r.cat.toLowerCase()}</span>
                </div>
                <div className="body">
                  <h4>{r.title.length > 80 ? r.title.slice(0, 80) + "…" : r.title}</h4>
                  <p className="ex">{r.excerpt}</p>
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
