"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Check, X, Sparkles, Rocket,
  ChevronDown, BarChart2, Tag, FileText, Eye, Megaphone,
  CheckCircle, AlertCircle, Bold, Italic, Link as LinkIcon,
  Coins, Image as ImageIcon,
} from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";
import "./onboarding.css";

// ─── tipos ────────────────────────────────────────────────────
type Stage = "welcome" | "tour" | "brand" | "tone" | "done";

interface OnbData {
  name: string; segment: string; site: string; contact: string; desc: string;
  logoUrl: string;
  tone: { formal: number; tech: number; energy: number };
  attrs: { confiante: number; claro: number; caloroso: number; agil: number };
  useWords: string[]; avoidWords: string[];
  reference: string;
}

// ─── MINI MOCKS ───────────────────────────────────────────────
function MockEditor() {
  return (
    <div className="mock">
      <div className="mbar"><i /><i /><i /><span className="mt">novo release</span></div>
      <div className="mpad">
        <div className="line t" />
        <div style={{ height: 8 }} />
        <div className="line s" /><div className="line s2" /><div className="line s3" /><div className="line s" style={{ width: "64%" }} />
        <div className="chip-row" style={{ marginTop: 14 }}>
          <span className="mchip"><Bold size={11} /></span>
          <span className="mchip"><Italic size={11} /></span>
          <span className="mchip"><LinkIcon size={11} /></span>
          <span className="mchip ai" style={{ marginLeft: "auto" }}><Sparkles size={11} /> Gerar com IA</span>
        </div>
      </div>
    </div>
  );
}
function MockVehicles() {
  const rows: [string, string, number][] = [["Capital Econômica","#1A1A1A",320],["Jornal Metrópole","#0E1A2B",240],["Portal Mercado Hoje","#2A6FDB",280]];
  return (
    <div className="mock">
      <div className="mbar"><i /><i /><i /><span className="mt">selecionar veículos</span></div>
      <div className="mpad">
        {rows.map((r, i) => (
          <div className="mrow" key={i} style={i === rows.length - 1 ? { borderBottom: "none" } : {}}>
            <span className="mchip on" style={{ padding: 4, width: 22, height: 22, justifyContent: "center" }}><Check size={11} /></span>
            <span className="mlogo" style={{ background: r[1] }}>{r[0].split(" ").slice(0,2).map((w: string) => w[0]).join("")}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r[0]}</span>
            <span className="mcoin">{r[2]} <Coins size={13} style={{ color: "#FAB500" }} /></span>
          </div>
        ))}
        <div style={{ marginTop: 14, padding: "11px 13px", borderRadius: 9, background: "rgba(250,181,0,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
          <Coins size={14} style={{ color: "#8A6500" }} />
          <span style={{ fontSize: 12, color: "#5A5A5A" }}>840 créditos · <b style={{ color: "#212121" }}>1.800 disponíveis</b></span>
        </div>
      </div>
    </div>
  );
}
function MockCalendar() {
  const evs: Record<number, string> = { 4: "#2A6FDB", 8: "#FAB500", 12: "#2F8A5B", 18: "#2A6FDB", 23: "#FAB500" };
  return (
    <div className="mock">
      <div className="mbar"><i /><i /><i /><span className="mt">junho 2026</span></div>
      <div className="mpad">
        <div className="mcal">
          {Array.from({ length: 28 }).map((_, i) => (
            <div className="mcell" key={i}>{i + 1}{evs[i + 1] && <span className="ev" style={{ background: evs[i + 1] }} />}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
function MockResults() {
  const bars = [40, 62, 48, 80, 95, 70];
  return (
    <div className="mock">
      <div className="mbar"><i /><i /><i /><span className="mt">visão geral</span></div>
      <div className="mpad">
        <div className="mkpis">
          <div className="mkpi"><div className="v">42</div><div className="l">Publicados</div></div>
          <div className="mkpi"><div className="v">64<span style={{ fontSize: 13 }}>mi</span></div><div className="l">Alcance</div></div>
          <div className="mkpi"><div className="v">318</div><div className="l">Veículos</div></div>
        </div>
        <div className="mbars">{bars.map((b, i) => <div className="b" key={i} style={{ height: b + "%", opacity: 0.55 + i * 0.08 }} />)}</div>
      </div>
    </div>
  );
}

const TOUR = [
  { n: "01", mock: <MockEditor />,   t: <>Escreva seu <em>release</em></>,            d: "Um editor limpo com título, linha-fina e corpo. Cole seu texto pronto ou gere um rascunho com IA em segundos." },
  { n: "02", mock: <MockVehicles />, t: <>Escolha entre <em>centenas de veículos</em></>, d: "Filtre por categoria, estado e audiência. O custo em créditos aparece em tempo real — e tudo cabe no seu plano." },
  { n: "03", mock: <MockCalendar />, t: <>Agende no <em>calendário</em></>,            d: "Publique na hora ou programe. Visualize todo o mês de distribuição organizado por status." },
  { n: "04", mock: <MockResults />,  t: <>Acompanhe os <em>resultados</em></>,         d: "Alcance, veículos ativos e desempenho por release num painel único e em tempo real." },
];

const STAGES: { id: Stage; nm: string }[] = [
  { id: "welcome", nm: "Boas-vindas" },
  { id: "tour",    nm: "Tour" },
  { id: "brand",   nm: "Sua marca" },
  { id: "tone",    nm: "Tom de voz" },
  { id: "done",    nm: "Pronto" },
];

// ─── BOAS-VINDAS ──────────────────────────────────────────────
function Welcome({ go, firstName }: { go: (s: Stage) => void; firstName: string }) {
  return (
    <div className="onb-card narrow welcome">
      <div className="mark">
        <span className="streak" />
        <svg className="bolt-svg" viewBox="-1 11 64 64" fill="none">
          <path d="M49.9117 42.2747L28.0623 69.2283C27.3525 70.3975 26.1865 71.0889 24.7671 71.0889C24.2982 71.0889 23.8292 71.0889 23.3603 70.8501C21.4846 70.146 20.5341 68.2854 21.003 66.4123L24.7417 54.6955H15.5533C14.3747 54.6955 12.9679 54.2303 12.2581 53.0612C11.5484 52.1309 11.3203 50.7228 11.5484 49.5663L21.0917 18.9417C21.5606 17.0811 23.2082 15.9119 25.0966 15.9119H36.9465C38.3533 15.9119 39.532 16.6159 40.2417 17.5462C40.9514 18.4765 41.1795 20.1109 40.7106 21.28L35.0455 36.4289L46.3884 36.19C47.7952 36.19 49.2147 36.894 49.9117 38.2895C50.6215 39.4586 50.6215 40.8541 49.9117 42.2621V42.2747Z" fill="#FAB500"/>
        </svg>
      </div>
      <h1>Boas energias para os seus <em>releases</em>{firstName ? `, ${firstName}` : ""}!</h1>
      <p className="sub">Sua conta está pronta. Agora você já pode configurar sua primeira marca, definir um tom de voz, criar seu release e publicar nos veículos que quiser.</p>
      <div className="choice">
        <div className="choice-card primary" onClick={() => go("tour")}>
          <div className="ic"><Sparkles size={22} /></div>
          <h3>Fazer o tour</h3>
          <p>Conheça os recursos em 4 passos rápidos antes de começar.</p>
          <span className="go">Recomendado <ArrowRight size={14} /></span>
        </div>
        <div className="choice-card" onClick={() => go("brand")}>
          <div className="ic"><Rocket size={22} /></div>
          <h3>Configurar agora</h3>
          <p>Pular o tour e ir direto para o cadastro da sua marca.</p>
          <span className="go">Ir direto <ArrowRight size={14} /></span>
        </div>
      </div>
      <div style={{ marginTop: 26 }}>
        <Link href="/dashboard" className="welcome skip-link">Prefiro explorar por conta própria — ir para o painel</Link>
      </div>
    </div>
  );
}

// ─── TOUR ─────────────────────────────────────────────────────
function Tour({ go }: { go: (s: Stage) => void }) {
  const [i, setI] = useState(0);
  const last = i === TOUR.length - 1;
  const s = TOUR[i];
  return (
    <div className="onb-card wide">
      <div className="demo-stage">
        <div className="demo-viz">{s.mock}</div>
        <div className="demo-body">
          <div className="txt">
            <div className="step-n">Passo {s.n} de 04</div>
            <h2>{s.t}</h2>
            <p>{s.d}</p>
          </div>
          <div className="demo-dots">
            {TOUR.map((_, j) => <i key={j} className={j === i ? "on" : ""} onClick={() => setI(j)} />)}
          </div>
        </div>
      </div>
      <div className="onb-nav">
        <button className="btn btn-ghost" onClick={() => i === 0 ? go("welcome") : setI(i - 1)}>
          <ArrowLeft size={16} /> {i === 0 ? "Voltar" : "Anterior"}
        </button>
        <div className="right">
          <button className="btn btn-ghost" onClick={() => go("brand")}>Pular tour</button>
          <button className="btn btn-primary" onClick={() => last ? go("brand") : setI(i + 1)}>
            {last ? <><span>Cadastrar minha marca</span> <ArrowRight size={16} /></> : <><span>Próximo</span> <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MARCA ────────────────────────────────────────────────────
const SEGMENTS = ["Franquias","Varejo","Tecnologia","Alimentação","Saúde","Serviços","Educação","Imobiliário","Indústria","Outro"];

function Brand({ go, data, setData }: { go: (s: Stage) => void; data: OnbData; setData: (d: OnbData) => void }) {
  const up = (k: keyof OnbData, v: string) => setData({ ...data, [k]: v });
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setData({ ...data, logoUrl: url });
  }

  return (
    <div className="onb-card mid">
      <div className="onb-head">
        <span className="eyebrow">Passo 1 de 2 · Configuração</span>
        <h1>Cadastre sua primeira <em>marca</em></h1>
        <p className="sub">É a marca ou cliente para quem você vai distribuir releases. Você pode adicionar outras depois.</p>
      </div>
      <div className="onb-form">
        <div className="fgrid">
          <div className="logo-up">
            <div className="logo-slot" onClick={() => fileRef.current?.click()}>
              {data.logoUrl
                ? <img src={data.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "var(--r-lg)", padding: 8 }} />
                : <ImageIcon size={32} style={{ color: "var(--tx-4)" }} />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
            <span className="hint">Clique para enviar o logo<br/>PNG ou SVG · fundo transparente</span>
          </div>
          <div>
            <div className="fld">
              <label>Nome da marca / cliente</label>
              <input className="in" placeholder="Ex.: Franquia Sabor Brasil" value={data.name} onChange={e => up("name", e.target.value)} />
            </div>
            <div className="row2">
              <div className="fld">
                <label>Segmento / setor</label>
                <div className="select-w">
                  <select className="in" value={data.segment} onChange={e => up("segment", e.target.value)}>
                    {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={16} className="chev" />
                </div>
              </div>
              <div className="fld">
                <label>Site</label>
                <input className="in" placeholder="marca.com.br" value={data.site} onChange={e => up("site", e.target.value)} />
              </div>
            </div>
            <div className="fld">
              <label>Pessoa de contato / responsável</label>
              <input className="in" placeholder="Nome do responsável pela marca" value={data.contact} onChange={e => up("contact", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="fld" style={{ marginTop: 16 }}>
          <label>Descrição curta</label>
          <textarea className="in" placeholder="Em uma ou duas frases, o que é a marca e o que ela faz. Isso ajuda a IA a contextualizar seus releases." value={data.desc} onChange={e => up("desc", e.target.value)} />
        </div>
      </div>
      <div className="onb-nav">
        <button className="btn btn-ghost" onClick={() => go("tour")}><ArrowLeft size={16} /> Voltar</button>
        <div className="right">
          <button className="btn btn-primary" disabled={!data.name.trim()} onClick={() => go("tone")}>
            Continuar para o tom de voz <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TOM DE VOZ ───────────────────────────────────────────────
const TONE_AXES = [
  { id: "formal" as const, left: "Formal",   right: "Coloquial" },
  { id: "tech"   as const, left: "Técnico",  right: "Acessível" },
  { id: "energy" as const, left: "Sóbrio",   right: "Entusiasmado" },
];
const BRAND_ATTRS = [
  { id: "confiante" as const, name: "Confiante", not: "arrogante", desc: "Afirma com segurança e prova — sem se gabar." },
  { id: "claro"     as const, name: "Claro",     not: "raso",      desc: "Direto e simples, sem perder profundidade." },
  { id: "caloroso"  as const, name: "Caloroso",  not: "bajulador", desc: "Próximo e humano, sem puxar o saco." },
  { id: "agil"      as const, name: "Ágil",      not: "apressado", desc: "Ritmo dinâmico, sem atropelar a informação." },
];
const ATTR_SUPPORT: Record<string, string> = {
  confiante: "A marca chega a esse patamar com resultado comprovado — não com promessa.",
  claro: "Na prática: mais pontos de atendimento, perto de quem realmente importa.",
  caloroso: "Por trás dos números, há um time que acredita no que constrói todo dia.",
  agil: "120 unidades, 14 estados, um objetivo — a marca não perde tempo.",
};

function bucket(v: number) { return v < 34 ? 0 : v < 67 ? 1 : 2; }
function attrLevel(v: number, not: string) {
  if (v >= 90) return { t: "pode soar " + not, warn: true };
  if (v >= 68) return { t: "forte", warn: false };
  if (v >= 34) return { t: "equilibrado", warn: false };
  return { t: "sutil", warn: false };
}
function dominantAttr(attrs: Record<string, number>) {
  let best = "confiante", bv = -1;
  Object.keys(attrs).forEach(k => { if (attrs[k] > bv) { bv = attrs[k]; best = k; } });
  return best;
}
function buildTone(tone: OnbData["tone"], attrs: OnbData["attrs"]) {
  const f = bucket(tone.formal), t = bucket(tone.tech), e = bucket(tone.energy);
  const abre = ["A companhia comunica ao mercado a","A marca anuncia a","É com entusiasmo que a marca anuncia a"][f === 0 ? 0 : e === 2 ? 2 : 1];
  const corpo = ["expansão de sua rede de unidades, mediante aporte destinado à ampliação da capacidade operacional","abertura de 120 novas unidades, com um investimento que amplia a capacidade de atendimento","chegada de 120 novas lojas — um salto que vai levar a marca a muito mais clientes"][t];
  const fecho = ["no decorrer do exercício corrente.","ao longo deste ano.","já nos próximos meses."][e];
  return { lead: `${abre} ${corpo} ${fecho}`, support: ATTR_SUPPORT[dominantAttr(attrs)] };
}

function WordInput({ kind, words, setWords, placeholder }: { kind: string; words: string[]; setWords: (w: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  function add(w: string) { w = w.trim(); if (w && !words.includes(w)) setWords([...words, w]); setV(""); }
  return (
    <div className="word-box" onClick={e => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
      {words.map(w => (
        <span key={w} className={"wchip " + kind}>{w}
          <button onClick={() => setWords(words.filter(x => x !== w))}><X size={13} /></button>
        </span>
      ))}
      <input value={v} placeholder={words.length ? "" : placeholder}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(v); } else if (e.key === "Backspace" && !v && words.length) setWords(words.slice(0, -1)); }}
        onBlur={() => add(v)} />
    </div>
  );
}

function Tone({ go, data, setData }: { go: (s: Stage) => void; data: OnbData; setData: (d: OnbData) => void }) {
  const tone = data.tone, attrs = data.attrs;
  const [open, setOpen] = useState("");
  const [touched, setTouched] = useState({ atributos: false, eixo: false });
  const setTone = (k: keyof typeof tone, v: number) => { setTouched(t => ({ ...t, eixo: true })); setData({ ...data, tone: { ...tone, [k]: v } }); };
  const setAttr = (k: keyof typeof attrs, v: number) => { setTouched(t => ({ ...t, atributos: true })); setData({ ...data, attrs: { ...attrs, [k]: v } }); };

  const { lead, support } = buildTone(tone, attrs);
  const axisBadges = [
    bucket(tone.formal) === 0 ? "Formal" : bucket(tone.formal) === 2 ? "Coloquial" : "Equilibrado",
    bucket(tone.tech) === 0 ? "Técnico" : bucket(tone.tech) === 2 ? "Acessível" : "Misto",
    bucket(tone.energy) === 0 ? "Sóbrio" : bucket(tone.energy) === 2 ? "Entusiasmado" : "Moderado",
  ];
  const activeAttrs = BRAND_ATTRS.filter(a => attrs[a.id] >= 50);
  const headline = bucket(tone.energy) === 2 ? "Marca dá salto e abre 120 novas unidades" : bucket(tone.formal) === 0 ? "Marca formaliza expansão com 120 novas unidades" : "Marca anuncia expansão com 120 novas unidades";
  const defined = { atributos: touched.atributos, eixo: touched.eixo, vocabulario: (data.useWords.length + data.avoidWords.length) > 0 };
  const sections = [
    { id: "atributos", Icon: Sparkles, title: "Atributos da marca", hint: "Confiante · claro · caloroso · ágil" },
    { id: "eixo",      Icon: BarChart2, title: "Eixos de tom",       hint: "Formal · técnico · energia" },
    { id: "vocabulario", Icon: Tag,    title: "Vocabulário",         hint: "Palavras a usar e a evitar" },
  ];
  const doneCount = Object.values(defined).filter(Boolean).length;

  return (
    <div className="onb-card wide">
      <div className="onb-head">
        <span className="eyebrow">Passo 2 de 2 · Configuração</span>
        <h1>Defina o <em>tom de voz</em> da marca</h1>
        <p className="sub">Calibre como os releases devem soar. A IA usa isso como guia ao gerar e revisar textos para {data.name || "sua marca"}.</p>
      </div>
      <div className="tone-layout">
        {/* MENU 30% */}
        <div className="tone-menu">
          <div className="tm-progress">
            <div className="tm-prog-top">
              <span className="tm-prog-lbl">Configuração</span>
              <span className="tm-prog-n">{doneCount}/{sections.length}</span>
            </div>
            <div className="tm-prog-bar"><i style={{ width: (doneCount / sections.length * 100) + "%" }} /></div>
          </div>
          {sections.map(sec => {
            const isOpen = open === sec.id;
            const ok = defined[sec.id as keyof typeof defined];
            return (
              <div key={sec.id} className={"tsec" + (isOpen ? " open" : "")}>
                <button className="tsec-head" onClick={() => setOpen(isOpen ? "" : sec.id)}>
                  <span className="tsec-ic"><sec.Icon size={17} /></span>
                  <span className="tsec-meta">
                    <span className="tsec-title">{sec.title}</span>
                    <span className="tsec-hint">{sec.hint}</span>
                  </span>
                  <span className={"tsec-stat" + (ok ? " ok" : "")}>{ok && <Check size={13} />}</span>
                  <ChevronDown size={16} className={"tsec-chev" + (isOpen ? " open" : "")} />
                </button>
                {isOpen && sec.id === "atributos" && (
                  <div className="tsec-body">
                    <div className="attr-dials">
                      {BRAND_ATTRS.map(a => {
                        const v = attrs[a.id], lv = attrLevel(v, a.not);
                        return (
                          <div className="attr-dial" key={a.id}>
                            <div className="ad-head">
                              <div>
                                <span className="ad-name">{a.name} <span className="ad-not">não {a.not}</span></span>
                                <span className="ad-desc">{a.desc}</span>
                              </div>
                              <span className={"ad-level" + (lv.warn ? " warn" : "")}>
                                {lv.warn && <AlertCircle size={12} />}{lv.t}
                              </span>
                            </div>
                            <input className="rng" type="range" min="0" max="100" value={v} onChange={e => setAttr(a.id, +e.target.value)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {isOpen && sec.id === "eixo" && (
                  <div className="tsec-body">
                    <div className="tone-sliders">
                      {TONE_AXES.map(ax => {
                        const v = tone[ax.id], b = bucket(v);
                        return (
                          <div className="slider-field" key={ax.id}>
                            <div className="slabel">
                              <span className={"a" + (b === 0 ? "" : " dim")}>{ax.left}</span>
                              <span className={"a" + (b === 2 ? "" : " dim")}>{ax.right}</span>
                            </div>
                            <input className="rng" type="range" min="0" max="100" value={v} onChange={e => setTone(ax.id, +e.target.value)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {isOpen && sec.id === "vocabulario" && (
                  <div className="tsec-body">
                    <div className="fld">
                      <label style={{ color: "var(--green)" }}>Palavras a usar</label>
                      <WordInput kind="use" words={data.useWords} setWords={w => setData({ ...data, useWords: w })} placeholder="Digite e tecle Enter" />
                    </div>
                    <div className="fld" style={{ marginTop: 14 }}>
                      <label style={{ color: "var(--red)" }}>Palavras a evitar</label>
                      <WordInput kind="avoid" words={data.avoidWords} setWords={w => setData({ ...data, avoidWords: w })} placeholder="Ex.: líder, único" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DIREITA 70% */}
        <div className="tone-right">
          <div className="ref-card">
            <div className="ref-head">
              <FileText size={16} style={{ color: "var(--coral)" }} />
              <span className="ref-lbl">Texto de referência</span>
              <span className="ref-opt">opcional</span>
            </div>
            <textarea className="in" placeholder="Cole um release ou trecho que represente bem a voz da marca. A IA aprende o estilo a partir dele." value={data.reference} onChange={e => setData({ ...data, reference: e.target.value })} />
          </div>
          <div className="tone-preview">
            <div className="pv-top">
              <Eye size={15} style={{ color: "var(--tx-3)" }} />
              <span className="lbl">Amostra de texto</span>
              <span className="live"><span className="pulse" /> ao vivo</span>
            </div>
            <div className="pv-body">
              <div className="ph">Exemplo gerado no tom escolhido para {data.name || "sua marca"}</div>
              <h4>{headline}</h4>
              <p>{lead}</p>
              <p style={{ marginTop: 12 }}>{support}</p>
              <div className="tone-badges">
                {axisBadges.map((b, i) => <span className="tone-badge" key={i}>{b}</span>)}
              </div>
              {activeAttrs.length > 0 && (
                <div className="attr-chips">
                  {activeAttrs.map(a => {
                    const lv = attrLevel(attrs[a.id], a.not);
                    return <span className={"attr-chip" + (lv.warn ? " warn" : "")} key={a.id}>{a.name}</span>;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="voice-guide">
        <div className="vg-head">
          <span className="eyebrow">Guia de voz · Markable</span>
          <p>Princípios que valem para todo release, em qualquer tom. <em>Sempre concreto — números, nomes, resultados.</em></p>
        </div>
        <div className="vg-cols">
          <div className="vg-col yes">
            <div className="vg-tag"><Check size={13} /> Diga assim</div>
            <div className="vg-ex">
              <p>"Em 90 dias, conquistamos 27 matérias para a marca em veículos nacionais."</p>
              <span>Concreto: número, prazo e resultado. Sem adjetivo de mais.</span>
            </div>
            <div className="vg-ex">
              <p>"Mídia espontânea é diferente de publicidade — e <em>essa</em> diferença muda a confiança do cliente."</p>
              <span>Educa o leitor. O itálico marca a virada de ideia.</span>
            </div>
          </div>
          <div className="vg-col no">
            <div className="vg-tag"><X size={13} /> Não diga assim</div>
            <div className="vg-ex">
              <p>"Somos a melhor assessoria do Brasil, com soluções inovadoras e disruptivas!"</p>
              <span>Vago e auto-elogioso, sem prova. Adjetivos batidos.</span>
            </div>
            <div className="vg-ex">
              <p>"🚀🔥 Bora alavancar sua marca?? 💥 Sucesso garantido! ✨"</p>
              <span>Excesso de emoji, promessa vazia, venda forçada.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="onb-nav">
        <button className="btn btn-ghost" onClick={() => go("brand")}><ArrowLeft size={16} /> Voltar</button>
        <div className="right">
          <button className="btn btn-primary" onClick={() => go("done")}>Concluir configuração <Check size={16} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── CONCLUSÃO ────────────────────────────────────────────────
function Done({ data }: { data: OnbData }) {
  return (
    <div className="onb-card narrow onb-done">
      <div className="burst"><CheckCircle size={46} /></div>
      <h1>Tudo <em>pronto!</em></h1>
      <p className="sub">{data.name || "Sua marca"} está configurada. Agora é só criar seu primeiro release e publicar como um raio.</p>
      <div className="onb-summary">
        <div className="s"><span className="ic"><Tag size={18} /></span><div><div className="t">{data.name || "Marca cadastrada"}</div><div className="d">{data.segment}</div></div></div>
        <div className="s"><span className="ic"><Megaphone size={18} /></span><div><div className="t">Tom de voz</div><div className="d">Definido</div></div></div>
        <div className="s"><span className="ic"><Coins size={18} /></span><div><div className="t">1.800 créditos</div><div className="d">Prontos para uso</div></div></div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn btn-primary btn-lg" href="/dashboard">Ir para o painel <ArrowRight size={17} /></Link>
        <Link className="btn btn-ghost btn-lg" href="/dashboard/releases/novo">Criar primeiro release</Link>
      </div>
    </div>
  );
}

// ─── WIZARD ───────────────────────────────────────────────────
export default function BoasVindasPage() {
  const { user } = useUser();
  const router = useRouter();
  const firstName = user?.firstName || "";
  const [step, setStep] = useState<Stage>("welcome");
  const [data, setData] = useState<OnbData>({
    name: "", segment: "Franquias", site: "", contact: "", desc: "", logoUrl: "",
    tone: { formal: 30, tech: 60, energy: 50 },
    attrs: { confiante: 72, claro: 80, caloroso: 56, agil: 64 },
    useWords: [], avoidWords: [],
    reference: "",
  });

  const idx = STAGES.findIndex(s => s.id === step);
  const go = (s: Stage) => { setStep(s); try { window.scrollTo(0, 0); } catch (_) {} };

  let screen;
  switch (step) {
    case "welcome": screen = <Welcome go={go} firstName={firstName} />; break;
    case "tour":    screen = <Tour go={go} />; break;
    case "brand":   screen = <Brand go={go} data={data} setData={setData} />; break;
    case "tone":    screen = <Tone go={go} data={data} setData={setData} />; break;
    case "done":    screen = <Done data={data} />; break;
  }

  return (
    <div data-theme="dark" style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div className="onb">
        <span className="bg-glow" />
        <header className="onb-top">
          <Link className="lock" href="/" style={{ display: "flex", alignItems: "center" }}>
            <RaioLockup height={22} variant="dark" />
          </Link>
          <div className="spacer" />
          <div className="stepper">
            {STAGES.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <span className={"seg" + (i <= idx ? " done" : "")} />}
                <div className={"st" + (i === idx ? " active" : i < idx ? " done" : "")} onClick={() => i < idx && go(s.id)}>
                  <span className="dot">{i < idx ? <Check size={14} /> : i + 1}</span>
                  <span className="nm">{s.nm}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="spacer" />
          <Link href="/dashboard" className="skip">Pular <X size={15} /></Link>
        </header>
        <main className="onb-body">{screen}</main>
      </div>
    </div>
  );
}
