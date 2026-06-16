"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Send, Plus, X, Upload, Zap } from "lucide-react";

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
  { id: "v14", name: "O Liberal Centro-Oeste", domain: "liberalco.com.br",         cat: "Geral",      uf: "GO", reach: 690000,  tier: "A",   tokens: 65,  color: "#946100" },
  { id: "v15", name: "Panorama Franquias",     domain: "panoramafranquias.com.br", cat: "Franquias",  uf: "SP", reach: 870000,  tier: "A",   tokens: 85,  color: "#8A6500" },
  { id: "v16", name: "Jornal Metrópole",       domain: "jornalmetropole.com.br",   cat: "Geral",      uf: "RJ", reach: 4300000, tier: "AAA", tokens: 240, color: "#0E1A2B" },
];

const VEH_EDITORIAS = ["Todos","Economia","Negócios","Franquias","Varejo","Tecnologia","Geral"];
const VEH_UFS = ["Todas","AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

// Custo padrão por tier
const TIER_COST: Record<string, number> = { AAA: 300, AA: 160, A: 80 };

const TIER_INFO = [
  { t: "AAA", label: "Grande audiência", range: "240–320 créditos", cls: "t-aaa" },
  { t: "AA",  label: "Audiência média",  range: "140–190 créditos", cls: "t-aa" },
  { t: "A",   label: "Regional / nicho", range: "60–95 créditos",   cls: "t-a" },
];

function fmtReach(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",") + " mi";
  if (n >= 1_000) return Math.round(n / 1_000) + " mil";
  return String(n);
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

type Vehicle = typeof VEHICLES[number];

function NewVehicleModal({ onClose, onCreate }: { onClose: () => void; onCreate: (v: Vehicle) => void }) {
  const [name, setName]         = useState("");
  const [domain, setDomain]     = useState("");
  const [editoria, setEditoria] = useState("Economia");
  const [uf, setUf]             = useState("SP");
  const [tier, setTier]         = useState<"AAA"|"AA"|"A">("AA");
  const [reach, setReach]       = useState("");
  const [tokens, setTokens]     = useState(TIER_COST["AA"]);
  const [logo, setLogo]         = useState<string | null>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);

  function handleTier(t: "AAA"|"AA"|"A") {
    setTier(t);
    setTokens(TIER_COST[t]);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  const ini = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "VH";
  const reachNum = parseInt(reach.replace(/\D/g, "")) || 0;
  const canSave = name.trim() && domain.trim() && reachNum > 0;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="m-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Novo <em>veículo</em></h3>
          <button className="icon-btn" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="m-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: "var(--r)", background: "var(--cream)", border: "1px solid var(--line)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--ink)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: "#fff", flex: "none", overflow: "hidden" }}>
              {logo ? <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{name || "Nome do veículo"}</div>
              <div style={{ fontSize: 12, color: "var(--stone)" }}>{domain || "dominio.com.br"}</div>
            </div>
            <span className={`tier t-${tier.toLowerCase()}`}>{tier}</span>
          </div>

          {/* Upload de logo */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>Logotipo</label>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: "100%", justifyContent: "center", border: "1.5px dashed var(--line-3)" }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={15} /> {logo ? "Trocar imagem" : "Fazer upload do logotipo"}
            </button>
            {logo && (
              <button className="link" style={{ fontSize: 12, marginTop: 6 }} onClick={() => setLogo(null)}>
                Remover imagem
              </button>
            )}
          </div>

          {/* Nome e domínio */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label>Nome do veículo</label>
              <input className="input" placeholder="Ex.: Capital Econômica" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label>Domínio</label>
              <input className="input" placeholder="capitaleconomica.com.br" value={domain} onChange={e => setDomain(e.target.value)} />
            </div>
          </div>

          {/* Editoria e UF */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label>Editoria</label>
              <div className="select-wrap">
                <select className="input" value={editoria} onChange={e => setEditoria(e.target.value)}>
                  {VEH_EDITORIAS.filter(e => e !== "Todos").map(e => <option key={e}>{e}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="field-row" style={{ marginBottom: 0 }}>
              <label>UF</label>
              <div className="select-wrap">
                <select className="input" value={uf} onChange={e => setUf(e.target.value)}>
                  {VEH_UFS.filter(u => u !== "Todas").map(u => <option key={u}>{u}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Alcance */}
          <div className="field-row" style={{ marginBottom: 0 }}>
            <label>Alcance mensal (leitores únicos)</label>
            <input
              className="input"
              placeholder="Ex.: 1500000"
              value={reach}
              onChange={e => setReach(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
            />
            {reachNum > 0 && (
              <span style={{ fontSize: 12, color: "var(--stone)", marginTop: 4 }}>
                ≈ {reachNum >= 1_000_000
                  ? (reachNum / 1_000_000).toFixed(1).replace(".", ",") + " mi"
                  : Math.round(reachNum / 1000) + " mil"} leitores/mês
              </span>
            )}
          </div>

          {/* Tier */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 8 }}>Tier de audiência</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {(["AAA","AA","A"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleTier(t)}
                  style={{
                    padding: "12px 10px", borderRadius: "var(--r)", border: `1.5px solid ${tier === t ? "var(--coral)" : "var(--line-2)"}`,
                    background: tier === t ? "rgba(250,181,0,0.06)" : "var(--paper)",
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <span className={`tier t-${t.toLowerCase()}`} style={{ display: "block", marginBottom: 6 }}>{t}</span>
                  <span style={{ fontSize: 11, color: "var(--stone)", display: "block" }}>
                    {t === "AAA" ? "Grande audiência" : t === "AA" ? "Audiência média" : "Regional / nicho"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custo automático */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "var(--r)", background: "rgba(250,181,0,0.08)", border: "1px solid rgba(250,181,0,0.25)" }}>
            <Zap size={16} color="var(--coral)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--stone)" }}>Custo por publicação (calculado pelo tier)</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--coral-ink)" }}>{tokens} créditos</div>
            </div>
            <input
              type="number"
              className="input"
              style={{ width: 90, textAlign: "right" }}
              value={tokens}
              min={1}
              onChange={e => setTokens(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="m-foot" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-dark"
            disabled={!canSave}
            onClick={() => {
              const nv: Vehicle = {
                id: `v${Date.now()}`,
                name: name.trim(),
                domain: domain.trim(),
                cat: editoria,
                uf,
                reach: reachNum,
                tier,
                tokens,
                color: "#1A1A1A",
              };
              onCreate(nv);
            }}
          >Cadastrar veículo</button>
        </div>
      </div>
    </div>
  );
}

export default function VeiculosPage() {
  const [cat, setCat]       = useState("Todos");
  const [uf, setUf]         = useState("Todas");
  const [q, setQ]           = useState("");
  const [vehicles, setVehicles] = useState(VEHICLES);
  const [showModal, setShowModal] = useState(false);

  const list = vehicles.filter(v =>
    (cat === "Todos" || v.cat === cat) &&
    (uf  === "Todas" || v.uf  === uf)  &&
    (!q.trim() || (v.name + v.domain).toLowerCase().includes(q.toLowerCase()))
  );

  const totalReach = vehicles.reduce((s, v) => s + v.reach, 0);

  return (
    <div className="content scroll">
      <div className="content-inner">
        <div className="page-head">
          <div>
            <p className="eyebrow">Rede</p>
            <h2><em>Centenas</em> de veículos parceiros</h2>
            <p className="sub">Do grande portal nacional ao jornal regional. O custo em créditos varia conforme a audiência — e tudo cabe no mesmo plano.</p>
          </div>
          <div className="actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Cadastrar veículo
            </button>
            <Link href="/releases/novo" className="btn btn-primary btn-sm">
              <Send size={15} /> Distribuir release
            </Link>
          </div>
        </div>

        {/* Cards de tier */}
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
          {TIER_INFO.map(ti => (
            <div className="card kpi" key={ti.t} style={{ padding: 20 }}>
              <span className={`tier ${ti.cls}`} style={{ fontSize: 11, padding: "4px 10px", marginBottom: 14, display: "inline-block" }}>{ti.t}</span>
              <div className="lbl">{ti.label}</div>
              <div className="val" style={{ fontSize: 22, marginTop: 6 }}>{ti.range}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="toolbar" style={{ marginBottom: 18 }}>
          <div className="chips">
            {VEH_EDITORIAS.map(c => (
              <button key={c} className={`chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="spacer" />
          <input
            className="input"
            placeholder="Buscar veículo…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ width: 200, padding: "8px 14px", fontSize: 13 }}
          />
          <div className="select-wrap" style={{ width: 110 }}>
            <select className="input" value={uf} onChange={e => setUf(e.target.value)} style={{ padding: "8px 32px 8px 12px", fontSize: 13 }}>
              {VEH_UFS.map(u => <option key={u}>{u}</option>)}
            </select>
            <ChevronDown size={15} />
          </div>
        </div>

        {/* Tabela */}
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Veículo</th>
                <th>Categoria</th>
                <th>UF</th>
                <th>Tier</th>
                <th style={{ textAlign: "right" }}>Alcance/mês</th>
                <th style={{ textAlign: "right" }}>Custo</th>
              </tr>
            </thead>
            <tbody>
              {list.map(v => (
                <tr key={v.id}>
                  <td>
                    <div className="row" style={{ gap: 12 }}>
                      <div style={{ background: v.color, width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 11, color: "#fff", flex: "none" }}>
                        {initials(v.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{v.name}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--stone)" }}>{v.domain}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted">{v.cat}</td>
                  <td className="muted num">{v.uf}</td>
                  <td><span className={`tier t-${v.tier.toLowerCase()}`}>{v.tier}</span></td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{fmtReach(v.reach)}</td>
                  <td className="num" style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                      {v.tokens} <span style={{ color: "var(--coral)", fontSize: 13 }}>⚡</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 18, marginBottom: 32 }}>
          Mostrando {list.length} veículos · alcance combinado da amostra: {fmtReach(totalReach)}
        </p>
      </div>

      {showModal && (
        <NewVehicleModal
          onClose={() => setShowModal(false)}
          onCreate={v => { setVehicles(prev => [v, ...prev]); setShowModal(false); }}
        />
      )}
    </div>
  );
}
