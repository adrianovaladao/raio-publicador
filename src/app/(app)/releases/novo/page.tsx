"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown,
  Image as ImageIcon, Rocket, Calendar, X, Search,
  List, LayoutGrid, Plus, Download,
} from "lucide-react";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";

// ── Dados mock ──────────────────────────────────────────────────────────────

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

const VEH_CATS = ["Todos","Economia","Negócios","Franquias","Varejo","Tecnologia","Geral"];
const VEH_UFS  = ["Todas","SP","RJ","MG","RS","PE","DF","GO","AM"];
const PLAN = { total: 5000, used: 3200 };

const BRANDS = [
  { id: "b1", name: "Franquia Sabor Brasil", segment: "Franquias", color: "#C25E00", releases: 12, tone: true },
  { id: "b2", name: "TechNova Sistemas",     segment: "Tecnologia", color: "#2A6FDB", releases: 7,  tone: true },
  { id: "b3", name: "Rede Bem Estar",        segment: "Saúde",      color: "#2F8A5B", releases: 4,  tone: false },
];

const BRAND_COLORS = ["#C25E00","#2A6FDB","#2F8A5B","#6D3BD9","#0E7C86","#B0322E","#8A6500","#1A1A1A"];
const BRAND_SEGMENTS = ["Franquias","Tecnologia","Saúde","Economia","Varejo","Negócios","Educação","Serviços","Indústria","Outro"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtReach(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const STEPS = ["Marca", "Conteúdo", "Veículos & créditos", "Revisão"];

// ── Passo 0: Marca ────────────────────────────────────────────────────────────

type Brand = typeof BRANDS[number];

function NewBrandModal({ onClose, onCreate }: { onClose: () => void; onCreate: (b: Brand) => void }) {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState(BRAND_SEGMENTS[0]);
  const [color, setColor] = useState(BRAND_COLORS[0]);
  const ini = initials(name || "NM");
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Nova <em>marca</em></h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="m-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: "var(--r)", background: "var(--cream)", border: "1px solid var(--line)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: color, display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15, color: "#fff", flex: "none" }}>{ini}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{name || "Nome da marca"}</div>
              <div style={{ fontSize: 12, color: "var(--stone)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{segment}</div>
            </div>
          </div>
          {/* Cor */}
          <div style={{ display: "flex", gap: 8 }}>
            {BRAND_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: color === c ? "2px solid var(--ink)" : "2px solid transparent", outline: color === c ? "2px solid var(--coral)" : "none", cursor: "pointer" }} />
            ))}
          </div>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label>Nome da marca</label>
            <input className="input" placeholder="Ex.: Franquia Sabor Brasil" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label>Segmento</label>
            <div className="select-wrap">
              <select className="input" value={segment} onChange={e => setSegment(e.target.value)}>
                {BRAND_SEGMENTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
        <div className="m-foot" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-dark"
            disabled={!name.trim()}
            onClick={() => {
              const nb: Brand = { id: `b${Date.now()}`, name: name.trim(), segment, color, releases: 0, tone: false };
              onCreate(nb);
            }}
          >Cadastrar marca</button>
        </div>
      </div>
    </div>
  );
}

function StepBrand({ selected, onSelect, brands, onAddBrand }: {
  selected: Brand | null;
  onSelect: (b: Brand) => void;
  brands: Brand[];
  onAddBrand: (b: Brand) => void;
}) {
  const [mode, setMode] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = brands.filter(b =>
    !q.trim() || (b.name + b.segment).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="brand-pick">
      <div className="bp-head">
        <p className="eyebrow">Passo 1 · Marca</p>
        <h3>Para qual <em>marca</em> é este release?</h3>
        <p className="muted" style={{ fontSize: 14, maxWidth: "56ch" }}>
          O conteúdo, o tom de voz e os relatórios ficam vinculados à marca escolhida.
        </p>
      </div>

      {/* Toolbar igual à biblioteca */}
      <div className="toolbar">
        <div className="chips">
          <span className="chip active">Todas <span className="ct">{brands.length}</span></span>
        </div>
        <div className="spacer" />
        <input
          className="input"
          placeholder="Buscar marcas…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ width: 200, padding: "8px 14px", fontSize: 13 }}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova marca
        </button>
        <div className="seg">
          <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}><List size={15} /> Lista</button>
          <button className={mode === "grid" ? "active" : ""} onClick={() => setMode("grid")}><LayoutGrid size={15} /> Grade</button>
        </div>
      </div>

      {/* Grade — igual ao lib-grid dos releases */}
      {mode === "grid" && (
        <div className="lib-grid">
          {filtered.map(b => (
            <div
              key={b.id}
              className={`card lib-card${selected?.id === b.id ? " selected" : ""}`}
              style={{ cursor: "pointer", outline: selected?.id === b.id ? "2px solid var(--coral)" : "none" }}
              onClick={() => onSelect(b)}
            >
              <div className="thumb" style={{ background: b.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 32, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>{initials(b.name)}</span>
                {selected?.id === b.id && (
                  <span style={{ position: "absolute", top: 10, right: 10, background: "var(--coral)", borderRadius: 99, width: 24, height: 24, display: "grid", placeItems: "center" }}>
                    <Check size={13} color="#fff" />
                  </span>
                )}
              </div>
              <div className="body">
                <h4>{b.name}</h4>
                <p className="ex" style={{ margin: "4px 0 0" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)" }}>{b.segment}</span>
                  {" · "}{b.releases} releases
                </p>
                <div className="foot" style={{ marginTop: 10 }}>
                  {b.tone
                    ? <span className="badge-status published">tom configurado</span>
                    : <span className="badge-status review">tom pendente</span>}
                </div>
              </div>
            </div>
          ))}

          {/* Card "Nova marca" */}
          <div
            className="lib-card-new"
            onClick={() => setShowModal(true)}
          >
            <div className="lib-card-new-icon"><Plus size={22} /></div>
            <div className="lib-card-new-label">Nova marca</div>
            <div className="lib-card-new-sub">CADASTRAR CLIENTE</div>
          </div>
        </div>
      )}

      {/* Lista — igual ao tbl dos releases */}
      {mode === "list" && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Segmento</th>
                <th>Releases</th>
                <th>Tom de voz</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr
                  key={b.id}
                  style={{ cursor: "pointer", background: selected?.id === b.id ? "rgba(250,181,0,0.06)" : undefined }}
                  onClick={() => onSelect(b)}
                >
                  <td className="title-cell" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: b.color, display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, color: "#fff", flex: "none" }}>{initials(b.name)}</div>
                    {b.name}
                    {selected?.id === b.id && <Check size={14} color="var(--coral)" style={{ marginLeft: "auto" }} />}
                  </td>
                  <td className="muted">{b.segment}</td>
                  <td className="num">{b.releases}</td>
                  <td>
                    {b.tone
                      ? <span className="badge-status published">configurado</span>
                      : <span className="badge-status review">pendente</span>}
                  </td>
                </tr>
              ))}
              {/* Linha "Nova marca" */}
              <tr style={{ cursor: "pointer", background: "var(--cream)" }} onClick={() => setShowModal(true)}>
                <td style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--stone)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, border: "1.5px dashed var(--sand)", display: "grid", placeItems: "center", flex: "none" }}>
                    <Plus size={14} color="var(--stone)" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Nova marca</span>
                </td>
                <td className="muted" style={{ fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Cadastrar cliente</td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewBrandModal
          onClose={() => setShowModal(false)}
          onCreate={b => { onAddBrand(b); onSelect(b); setShowModal(false); }}
        />
      )}
    </div>
  );
}

// ── Passo 1: Conteúdo ────────────────────────────────────────────────────────

interface Content { title: string; subtitle: string; body: string; cat: string; author: string }

function StepContent({ content, setContent }: { content: Content; setContent: (c: Content) => void }) {
  const up = (k: keyof Content, v: string) => setContent({ ...content, [k]: v });
  const cats = VEH_CATS.filter(c => c !== "Todos");

  return (
    <div className="composer-grid">
      <div className="card editor">
        <div className="toolbtns">
          {["H", "B", "I", "|", "≡", "❝", "🔗", "|", "🖼"].map((b, i) =>
            b === "|"
              ? <span key={i} className="div" />
              : <button key={i} className="tb" title={b}>{b}</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="tb" title="Gerar com IA" style={{ color: "var(--coral-ink)", fontSize: 13 }}>✦ IA</button>
        </div>
        <div className="body-pad">
          <input
            className="title-input"
            placeholder="Título do release"
            value={content.title}
            onChange={e => up("title", e.target.value)}
          />
          <input
            className="sub-input"
            placeholder="Subtítulo / linha de apoio"
            value={content.subtitle}
            onChange={e => up("subtitle", e.target.value)}
          />
          <textarea
            className="body-input"
            placeholder="Escreva o corpo do release… Comece com o lide: o quê, quem, quando, onde e por quê. O Raio distribui exatamente este texto aos veículos selecionados."
            value={content.body}
            onChange={e => up("body", e.target.value)}
            style={{ minHeight: 320 }}
          />
        </div>
      </div>

      <div>
        <div className="card side-card">
          <div className="card-head"><h3>Detalhes</h3></div>
          <div className="sc-body">
            <div className="field-row">
              <label>Categoria</label>
              <div className="select-wrap">
                <select className="input" value={content.cat} onChange={e => up("cat", e.target.value)}>
                  {cats.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field-row">
              <label>Autor</label>
              <div className="select-wrap">
                <select className="input" value={content.author} onChange={e => up("author", e.target.value)}>
                  {["Samara Perez","Liliane Pires","Analina Arouche","Daiana Napoleão"].map(a => <option key={a}>{a}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="card side-card">
          <div className="card-head"><h3>Mídia</h3></div>
          <div className="sc-body">
            <div className="attach">
              <ImageIcon size={22} />
              <div className="t">Arraste imagens aqui</div>
              <div className="h">JPG ou PNG · até 5 MB cada</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Passo 2: Veículos ────────────────────────────────────────────────────────

function StepVehicles({ selected, setSelected }: { selected: string[]; setSelected: (s: string[]) => void }) {
  const [cat, setCat] = useState("Todos");
  const [uf, setUf]   = useState("Todas");
  const [q, setQ]     = useState("");

  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const remove = (id: string) => setSelected(selected.filter(x => x !== id));

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
  const usedPct     = (PLAN.used / PLAN.total) * 100;
  const nowPct      = Math.min((selTokens / PLAN.total) * 100, 100 - usedPct);

  return (
    <div className="veh-layout">
      {/* Lista */}
      <div className="card veh-list">
        <div className="vh-toolbar">
          <div className="search" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input placeholder="Buscar veículo…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="select-wrap" style={{ width: 150 }}>
            <select className="input" value={cat} onChange={e => setCat(e.target.value)} style={{ padding: "8px 32px 8px 12px", fontSize: 13 }}>
              {VEH_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="select-wrap" style={{ width: 100 }}>
            <select className="input" value={uf} onChange={e => setUf(e.target.value)} style={{ padding: "8px 32px 8px 12px", fontSize: 13 }}>
              {VEH_UFS.map(u => <option key={u}>{u}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid var(--line)" }}>
          <span className="eyebrow">{list.length} veículos</span>
          <button
            className="link"
            style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => {
              const allIds = list.map(v => v.id);
              const allSel = allIds.every(id => selected.includes(id));
              setSelected(allSel ? selected.filter(id => !allIds.includes(id)) : [...new Set([...selected, ...allIds])]);
            }}
          >Selecionar todos</button>
        </div>

        <div className="scroll" style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
          {list.map(v => (
            <div key={v.id} className={`veh-row${selected.includes(v.id) ? " sel" : ""}`} onClick={() => toggle(v.id)}>
              <div className="cbx">{selected.includes(v.id) && <Check size={13} />}</div>
              <div className="logo" style={{ background: v.color }}>{initials(v.name)}</div>
              <div>
                <div className="nm">{v.name}</div>
                <div className="meta">
                  <span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span>
                  <span className="dom">{v.domain}</span>
                  <span className="dom">· {v.uf}</span>
                </div>
              </div>
              <div className="reach">
                <div className="n">{fmtReach(v.reach)}</div>
                <div className="u">alcance/mês</div>
              </div>
              <div className="cost">
                <span className="tk">{v.tokens}</span>
                <span style={{ color: "var(--coral-ink)", fontSize: 16 }}>⚡</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carrinho */}
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
            <span><i style={{ background: "var(--ink)",   display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Já usados {PLAN.used.toLocaleString("pt-BR")}</span>
            <span><i style={{ background: "var(--coral)", display: "inline-block", width: 9, height: 9, borderRadius: 3, marginRight: 5 }} />Esta seleção {selTokens}</span>
          </div>
        </div>

        {selVehicles.length === 0 ? (
          <div className="cart-empty">Selecione veículos à esquerda para montar a distribuição.</div>
        ) : (
          <div className="sel-list scroll">
            {selVehicles.map(v => (
              <div className="sel-item" key={v.id}>
                <div style={{ background: v.color, width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", fontSize: 9, fontFamily: "var(--mono)", fontWeight: 700, color: "#fff", flex: "none" }}>{initials(v.name)}</div>
                <span className="nm">{v.name}</span>
                <span className="tk">{v.tokens}</span>
                <button className="rm" onClick={() => remove(v.id)} title="Remover"><X size={15} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="cart-foot">
          {over && (
            <div className="savings" style={{ background: "var(--red-soft)", color: "var(--red)" }}>
              <span>Faltam <b>{(selTokens - left).toLocaleString("pt-BR")} créditos</b>. Remova veículos ou faça upgrade.</span>
            </div>
          )}
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
    </div>
  );
}

// ── Passo 3: Revisão ─────────────────────────────────────────────────────────

interface When { mode: "now" | "schedule"; date: string; time: string }

const BOILERPLATE = (brand: Brand | null) =>
  brand
    ? `Sobre ${brand.name}: referência no segmento de ${brand.segment.toLowerCase()}, com atuação nacional e foco em inovação e proximidade com o cliente.`
    : "";

async function downloadDocx(content: Content, selVehicles: typeof VEHICLES, brand: Brand | null) {
  const brandName = brand?.name ?? "Marca";
  const slug = content.title.slice(0, 40).replace(/\s+/g, "-").toLowerCase() || "release";

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 24 } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      children: [
        // Cabeçalho — marca
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: brandName.toUpperCase(), bold: true, size: 18, color: "848484", font: "Calibri" }),
            new TextRun({ text: `  ·  ${content.cat}`, size: 18, color: "848484", font: "Calibri" }),
          ],
        }),

        // Título
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 160 },
          children: [new TextRun({ text: content.title || "Título do release", bold: true, size: 52, font: "Calibri" })],
        }),

        // Subtítulo
        ...(content.subtitle ? [new Paragraph({
          spacing: { after: 320 },
          children: [new TextRun({ text: content.subtitle, italics: true, size: 30, color: "555555", font: "Calibri" })],
        })] : []),

        // Divisor
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
          spacing: { after: 320 },
          children: [],
        }),

        // Corpo
        ...content.body.split("\n").filter(Boolean).map(line =>
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: line, size: 24, font: "Calibri" })],
            alignment: AlignmentType.JUSTIFIED,
          })
        ),

        // Boilerplate
        ...(brand ? [
          new Paragraph({ spacing: { after: 120, before: 400 }, children: [] }),
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 160 },
            children: [new TextRun({ text: "SOBRE A EMPRESA", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          new Paragraph({
            spacing: { after: 320 },
            children: [new TextRun({ text: BOILERPLATE(brand), size: 22, color: "555555", font: "Calibri" })],
          }),
        ] : []),

        // Veículos
        ...(selVehicles.length > 0 ? [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 160 },
            children: [new TextRun({ text: "VEÍCULOS SELECIONADOS", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Veículo", "Editoria", "UF", "Tier", "Alcance"].map(h =>
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: "F1F0EC" },
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri" })] })],
                  })
                ),
              }),
              ...selVehicles.map(v =>
                new TableRow({
                  children: [
                    v.name, v.cat, v.uf, v.tier, fmtReach(v.reach),
                  ].map(val =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: val, size: 18, font: "Calibri" })] })],
                    })
                  ),
                })
              ),
            ],
          }),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slug}.docx`);
}

function StepReview({ content, selected, when, setWhen, brand }: {
  content: Content; selected: string[]; when: When; setWhen: (w: When) => void; brand: Brand | null;
}) {
  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="composer-grid">
      <div className="card">
        <div className="card-head">
          <h3>Pré-visualização do <em>release</em></h3>
          <div className="row" style={{ gap: 10 }}>
            <span className={`badge-status ${when.mode === "now" ? "review" : "scheduled"}`}>
              {when.mode === "now" ? "Em revisão" : "Agendado"}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => downloadDocx(content, selVehicles, brand)}
              title="Baixar como Word"
            >
              <Download size={14} /> Baixar .docx
            </button>
          </div>
        </div>
        <div className="card-pad">
          {brand && (
            <div className="review-brand">
              <span className="bc-av" style={{ background: brand.color }}>{initials(brand.name)}</span>
              <div className="bc-meta">
                <span className="bc-lbl">Marca</span>
                <span className="bc-nm">{brand.name}</span>
              </div>
            </div>
          )}
          <p className="eyebrow" style={{ marginBottom: 14 }}>{content.cat} · {content.author}</p>
          <h2 style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.025em", lineHeight: 1.12, margin: "0 0 10px" }}>
            {content.title || "Título do release"}
          </h2>
          <p className="serif-it" style={{ fontSize: 18, color: "var(--ink-soft)", margin: "0 0 18px" }}>
            {content.subtitle || "Subtítulo / linha de apoio do release."}
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {content.body || "O corpo do release aparece aqui exatamente como será distribuído aos veículos selecionados."}
          </p>
        </div>
      </div>

      <div>
        <div className="card side-card">
          <div className="card-head"><h3>Distribuição</h3></div>
          <div className="sc-body">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Veículos</span><span style={{ fontWeight: 700 }}>{selVehicles.length}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>Alcance estimado</span><span style={{ fontWeight: 700 }}>{fmtReach(selReach)}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 13 }}>Créditos</span>
              <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>{selTokens} <span style={{ color: "var(--coral)", fontSize: 14 }}>⚡</span></span>
            </div>
          </div>
        </div>

        <div className="card side-card">
          <div className="card-head"><h3>Quando publicar</h3></div>
          <div className="sc-body">
            <div className="seg" style={{ width: "100%", marginBottom: 14 }}>
              <button className={when.mode === "now" ? "active" : ""} style={{ flex: 1, justifyContent: "center" }} onClick={() => setWhen({ ...when, mode: "now" })}>
                <Rocket size={15} /> Agora
              </button>
              <button className={when.mode === "schedule" ? "active" : ""} style={{ flex: 1, justifyContent: "center" }} onClick={() => setWhen({ ...when, mode: "schedule" })}>
                <Calendar size={15} /> Agendar
              </button>
            </div>
            {when.mode === "schedule" && (
              <div className="row" style={{ gap: 10 }}>
                <div className="field-row" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Data</label>
                  <input className="input" type="date" value={when.date} onChange={e => setWhen({ ...when, date: e.target.value })} />
                </div>
                <div className="field-row" style={{ width: 110, marginBottom: 0 }}>
                  <label>Hora</label>
                  <input className="input" type="time" value={when.time} onChange={e => setWhen({ ...when, time: e.target.value })} />
                </div>
              </div>
            )}
            {when.mode === "now" && (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                O release entra na fila de envio e começa a ser distribuído em poucos minutos.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página raiz ───────────────────────────────────────────────────────────────

export default function NovoReleasePage() {
  const router  = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>(BRANDS);
  const [content, setContent] = useState<Content>({ title: "", subtitle: "", body: "", cat: "Negócios", author: "Samara Perez" });
  const [selected, setSelected] = useState<string[]>([]);
  const [when, setWhen] = useState<When>({ mode: "schedule", date: "2026-06-20", time: "09:00" });

  const last = STEPS.length - 1;

  const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
  const selTokens   = selVehicles.reduce((s, v) => s + v.tokens, 0);
  const over        = selTokens > (PLAN.total - PLAN.used);

  const canNext =
    step === 0 ? !!brand :
    step === 1 ? content.title.trim().length > 0 :
    step === 2 ? (selected.length > 0 && !over) :
    true;

  // ── Tela de sucesso ───────────────────────────────────────────────────────
  if (done) {
    const scheduled = when.mode === "schedule";
    const selVehicles = selected.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean) as typeof VEHICLES;
    const selReach    = selVehicles.reduce((s, v) => s + v.reach, 0);
    return (
      <div className="content scroll">
        <div className="content-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>
            {/* Ícone */}
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: scheduled ? "var(--amber-soft)" : "var(--green-soft)", display: "grid", placeItems: "center", margin: "0 auto 28px" }}>
              {scheduled
                ? <Calendar size={32} color="var(--coral-ink)" />
                : <Rocket size={32} color="var(--green)" />}
            </div>

            {/* Título */}
            <h2 style={{ fontFamily: "var(--sans)", fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
              {scheduled ? "Release agendado!" : "Release publicado!"}
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 32px" }}>
              {scheduled
                ? <>O release <strong style={{ color: "var(--ink)" }}>&ldquo;{content.title}&rdquo;</strong> será enviado em {when.date.split("-").reverse().join("/")} às {when.time} para <strong style={{ color: "var(--ink)" }}>{selVehicles.length} veículos</strong>.</>
                : <>O release <strong style={{ color: "var(--ink)" }}>&ldquo;{content.title}&rdquo;</strong> está sendo distribuído agora para <strong style={{ color: "var(--ink)" }}>{selVehicles.length} veículos</strong>, com alcance estimado de <strong style={{ color: "var(--ink)" }}>{fmtReach(selReach)}</strong>.</>}
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 36 }}>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Veículos</div>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>{selVehicles.length}</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Alcance</div>
                <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.03em" }}>{fmtReach(selReach)}</div>
              </div>
              <div className="card" style={{ flex: 1, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 6 }}>Marca</div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", marginTop: 6 }}>{brand?.name ?? "—"}</div>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => router.push("/releases")}>
                Ver biblioteca
              </button>
              <button className="btn btn-dark" onClick={() => router.push("/dashboard")}>
                Ir para o dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} /> Voltar
              </button>
            )}
            {step < last ? (
              <button className="btn btn-dark" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setDone(true)}>
                {when.mode === "now"
                  ? <><Rocket size={16} /> Publicar agora</>
                  : <><Calendar size={16} /> Agendar release</>}
              </button>
            )}
          </div>
        </div>

        {step === 0 && <StepBrand selected={brand} onSelect={setBrand} brands={brands} onAddBrand={b => setBrands(prev => [...prev, b])} />}
        {step === 1 && <StepContent content={content} setContent={setContent} />}
        {step === 2 && <StepVehicles selected={selected} setSelected={setSelected} />}
        {step === 3 && <StepReview content={content} selected={selected} when={when} setWhen={setWhen} brand={brand} />}
      </div>
    </div>
  );
}
