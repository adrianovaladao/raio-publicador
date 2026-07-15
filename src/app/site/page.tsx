"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle, Feather, Newspaper, Send, BarChart2,
  Zap, Check, X, Star, Plus, Headphones, Monitor, ChevronDown,
  Menu,
} from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";

// ─── dados ────────────────────────────────────────────────────────────────────

const PARTNERS = ["f1","f2","f3","f4","f5","f6","f7"];

const STEPS = [
  { icon: Feather,    n: "01", t: "Escreva o release",    d: "Use nosso editor inteligente para colar seu texto pronto ou use nossa inteligência artificial para estruturar um branded content impecável em segundos." },
  { icon: Newspaper,  n: "02", t: "Escolha os veículos",  d: "Filtre mais de 50 portais de notícia por nicho, região e volume de acessos. Você vê exatamente quantos créditos cada publicação consome na hora." },
  { icon: Send,       n: "03", t: "Publique ou agende",   d: "Programe no calendário ou publique imediatamente. Esqueça as tentativas de envio: no Raio, o seu artigo vai ao ar de forma 100% garantida nos canais escolhidos." },
  { icon: BarChart2,  n: "04", t: "Acompanhe resultados", d: "Seu conteúdo vai ao ar nos maiores portais do país tão rápido quanto um raio. Acompanhe a audiência das suas matérias e veja os links ativos num painel único." },
];

const PLANS = [
  {
    id: "BASIC",
    name: "Básico",
    desc: "Ideal para marcas e projetos em crescimento.",
    amt: "1.000", credits: "200 créditos/mês", cl: "R$ 5,00 por crédito",
    feats: [
      ["Até 2 marcas cadastradas por plano", true],
      ["Publique em até 2 portais categoria A", true],
      ["Acesso completo aos 50 portais parceiros", true],
      ["Calendário e agendamento de publicações", true],
      ["Biblioteca de releases divulgados", true],
      ["1 usuário administrador", true],
    ],
    cta: "Assinar Básico", featured: false,
  },
  {
    id: "ADVANCED",
    name: "Avançado",
    desc: "O equilíbrio ideal de alcance e custo.",
    amt: "3.000", credits: "1.000 créditos/mês", cl: "R$ 3,00 por crédito",
    feats: [
      ["Até 5 marcas cadastradas por plano", true],
      ["Publique em até 10 portais categoria A", true],
      ["Acesso completo aos 50 portais parceiros", true],
      ["Calendário e agendamento inteligente", true],
      ["Até 3 editores + 5 revisores incluídos", true],
      ["Suporte prioritário", true],
    ],
    cta: "Assinar Avançado", featured: true,
  },
  {
    id: "PROFESSIONAL",
    name: "Profissional",
    desc: "Para assessorias com alto volume de distribuição.",
    amt: "5.000", credits: "2.000 créditos/mês", cl: "R$ 2,50 por crédito",
    feats: [
      ["Até 10 marcas cadastradas por plano", true],
      ["Publique em até 20 portais categoria A", true],
      ["Acesso completo aos 50 portais parceiros", true],
      ["Calendário e agendamento inteligente", true],
      ["Até 5 editores + 10 revisores incluídos", true],
      ["Suporte prioritário", true],
    ],
    cta: "Assinar Profissional", featured: false,
  },
];

const TESTIMONIALS = [
  { q: <>Centralizamos toda a nossa operação de branded content em uma só plataforma. O sistema de créditos nos deu uma <em>previsibilidade financeira incrível</em> e hoje publicamos 3x mais matérias nacionais com o mesmo orçamento.</>, nm: "Thais Caetano", rl: "Representante comercial", av: "TC", photo: "/assets/testimonials/thais-caetano.jpg" },
  { q: <>Negociar publicações individualmente consumia dias de trabalho. Com o Raio, basta escolher os portais, subir o artigo e <em>acompanhar os links publicados de forma garantida</em>.</>, nm: "Leticia da Costa", rl: "Diretora de marketing", av: "LC" },
  { q: <>O custo por publicação garantida foi o grande diferencial. Economizamos mais de 60% em relação ao modelo antigo de disparo de releases em massa e mantivemos nossa marca em destaque e na pauta de grandes veículos do país.</>, nm: "Renato Nose", rl: "Diretor de expansão", av: "RN" },
];

const FAQS = [
  { q: "Como funciona o modelo de créditos?", a: "Cada plano oferece uma carteira mensal de créditos flexíveis. Você escolhe onde quer publicar sua matéria: portais grandes nacionais (Categoria A) consomem 100 créditos, portais de nicho (Categoria B) consomem 50 créditos, e portais regionais consomem 25 créditos (Categoria C). Você distribui esses créditos entre as matérias que quiser ao longo do mês, sem taxas individuais por publicação." },
  { q: "Qual a diferença para ferramentas que cobram por notícia?", a: "A concorrência cobra pacotes fechados onde cada publicação em um veículo custa um valor fixo alto. Com o nosso modelo de créditos, você ganha autonomia para \"comprar no atacado\". Por um valor semelhante (R$ 1.000), você ganha créditos suficientes para publicar até 2 matérias em portais Categoria A, ou pulverizar sua estratégia em até 8 portais Categoria C." },
  { q: "O que acontece se meus créditos acabarem?", a: "Você pode fazer um upgrade de plano a qualquer momento diretamente pelo seu painel para ganhar mais créditos com desconto. Se preferir, também oferecemos a opção de comprar créditos avulsos para complementar o seu mês, sem a necessidade de mudar de assinatura." },
  { q: "Em quantos veículos posso publicar?", a: "Em quantos veículos o seu saldo de créditos permitir! Temos uma rede parceira ativa com mais de 50 portais de notícias brasileiros, cobrindo desde veículos de cobertura nacional e economia até canais regionais." },
  { q: "Posso adicionar minha equipe e clientes?", a: "Sim! Dependendo do plano escolhido, você pode cadastrar múltiplas marcas, criar perfis de editores para sua equipe de redatores e convidar revisores. Toda a colaboração e aprovação de textos acontece de forma integrada dentro do próprio painel do Raio." },
  { q: "Existe plano anual?", a: <>Sim! Para empresas e agências que planejam estratégias de longo prazo, oferecemos planos anuais com descontos exclusivos e condições de faturamento diferenciadas. Para saber mais sobre o plano anual e garantir seu desconto, basta entrar em contato com o nosso <a href="mailto:raiopublicador@gmail.com" style={{ color: "inherit", textDecoration: "underline" }}>time comercial</a> no link abaixo.</> },
];

// ─── hook: reveal on scroll ───────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Nav({ onContact }: { onContact: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn); fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-in">
        <a className="lock" href="#top" onClick={close}><RaioLockup height={31} variant="dark" /></a>
        <div className="links">
          <a href="#como">Como funciona</a>
          <a href="#planos">Planos</a>
          <a href="#faq">Perguntas Frequentes</a>
          <button className="link-btn" onClick={onContact}>Fale com nosso time</button>
        </div>
        <div className="nav-cta">
          <Link className="enter" href="/login">Entrar</Link>
          <a className="btn btn-primary btn-sm" href="#planos">Assinar agora</a>
        </div>
        <button className="nav-burger" aria-label="Abrir menu" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`nav-mobile${menuOpen ? " open" : ""}`}>
        <a href="#como" onClick={close}>Como funciona</a>
        <a href="#planos" onClick={close}>Planos</a>
        <a href="#faq" onClick={close}>FAQ</a>
        <button className="link-btn" onClick={() => { close(); onContact(); }}>Fale com nosso time</button>
        <div className="nav-mobile-cta">
          <Link className="btn btn-ghost btn-block" href="/login" onClick={close}>Entrar</Link>
          <a className="btn btn-primary btn-block" href="#planos" onClick={close}>Assinar agora</a>
        </div>
      </div>
      {menuOpen && <div className="nav-scrim" onClick={close} />}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <header className="hero" id="top">
      <span className="glow" />
      <div className="wrap">
        <div className="hero-in">
          <h1>
            Publique rápido<br />
            como um <em>raio</em>.
          </h1>
          <p className="sub">
            Sua marca nos maiores portais do Brasil. Sem intermediários, sem rejeição. Publique seus conteúdos de forma garantida em mais de 50 portais.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary btn-lg" href="#planos">
              Comece a publicar <ArrowRight size={17} />
            </a>
            <Link className="btn btn-ghost btn-lg" href="/login">Já tenho conta</Link>
          </div>
          <div className="micro">
            <CheckCircle size={15} /> Use seus créditos para publicar quando quiser, com controle total e sem contratos de fidelidade.
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Logos ────────────────────────────────────────────────────────────────────

function Logos() {
  return (
    <section className="logos">
      <div className="wrap">
        <div className="ll">Distribua em veículos como</div>
        <div className="row">
          {PARTNERS.map((p) => (
            <Image key={p} src={`/assets/partners/${p}.svg`} alt="" width={80} height={34} style={{ height: p === "f5" ? 29 : 34, width: "auto", opacity: 0.8 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── O que é um release ───────────────────────────────────────────────────────

function OQueE() {
  return (
    <section className="section" style={{ background: "#242424" }}>
      <div className="wrap" style={{ maxWidth: 760, textAlign: "center" }}>
        <div className="sec-head reveal">
          <h2>O que é um <em>release?</em></h2>
          <p className="sub">
            Um release é o texto enviado diretamente a jornalistas e editores de portais de notícias. É o atalho entre a sua novidade e a imprensa e, no Raio, seu release estará pronto para ser publicado como matéria e virar notícia. Rápido e sem intermediários.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Como funciona ────────────────────────────────────────────────────────────

function Como() {
  return (
    <section className="section alt" id="como">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Como funciona</span>
          <h2>Do rascunho à publicação garantida em <em>quatro passos</em></h2>
          <p className="sub">Um fluxo feito para marcas, agências e profissionais que precisam de resultados reais, sem burocracia e com controle absoluto.</p>
        </div>
        <div className="steps-grid">
          {STEPS.map(({ icon: Icon, n, t, d }, i) => (
            <div className="step-card reveal" key={n} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="n">{n}</div>
              <div className="ic"><Icon size={23} /></div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comparativo ─────────────────────────────────────────────────────────────

function Compare() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Créditos vs. cobrança por nota</span>
          <h2>O mesmo alcance por <em>uma fração</em> do custo</h2>
          <p className="sub">Enquanto a concorrência te prende a uma única publicação por valor, no Raio você assina, ganha <strong>créditos</strong> e monta a estratégia que fizer mais sentido para o seu momento.</p>
        </div>
        <div className="compare">
          <div className="comp-card them reveal">
            <span className="tag">Modelo tradicional</span>
            <h3>Cobrança por nota</h3>
            <p className="price-line">Cobrança por nota = R$ 900,00 por veículo, por release</p>
            <ul>
              <li><X size={19} /> Cada publicação gera um custo novo</li>
              <li><X size={19} /> Orçamento imprevisível no fim do mês</li>
              <li><X size={19} /> Distribuir em 10 veículos = 10 cobranças</li>
              <li><X size={19} />Sem painel unificado de resultados</li>
            </ul>
            <div className="foot-note">10 releases em 10 veículos: <b>~R$ 9.000/mês</b></div>
          </div>
          <div className="comp-card us reveal" style={{ transitionDelay: "90ms" }}>
            <span className="tag">Raio Publicador</span>
            <h3>Plano por créditos</h3>
            <p className="price-line">A partir de R$ 1.000/mês, releases ilimitados</p>
            <ul>
              <li><Check size={19} /> Um plano cobre diversas publicações</li>
              <li><Check size={19} /> Custo fixo e previsível</li>
              <li><Check size={19} /> Quanto mais publica, menor o custo por release</li>
              <li><Check size={19} /> Painel de resultados em tempo real incluído</li>
            </ul>
            <div className="foot-note">10 releases no plano Avançado: <b>R$ 3.000/mês</b></div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

function Metrics() {
  const items = [
    { n: <><em>50</em>+</>, l: "Portais parceiros" },
    { n: <>5<em>mi</em></>, l: "Alcance aproximado" },
    { n: <><em>1</em></>, l: "Plano · sem custo por nota" },
    { n: <>5<em>min</em></>, l: "Para publicar a 1a. matéria" },
  ];
  return (
    <section className="section panel">
      <div className="wrap">
        <div className="metrics reveal">
          {items.map((m, i) => (
            <div className="metric" key={i}>
              <div className="big">{m.n}</div>
              <div className="lbl">{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Planos ───────────────────────────────────────────────────────────────────

function Plans({ onContact }: { onContact: () => void }) {
  return (
    <section className="section" id="planos">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Planos e preços</span>
          <h2>Escolha o plano e <em>publique sem limites</em></h2>
          <p className="sub">Todos os planos dão acesso aos 600 veículos. A diferença está no saldo de créditos e nos veículos de grande audiência por release.</p>
        </div>
        <div className="plans">
          {PLANS.map((p, i) => (
            <div className={`plan reveal${p.featured ? " featured" : ""}`} key={p.name} style={{ transitionDelay: `${i * 80}ms` }}>
              {p.featured && <span className="ribbon">Mais vendido</span>}
              <div className="pname">{p.name}</div>
              <div className="pdesc">{p.desc}</div>
              <div className="price">
                <span className="cur">R$</span>
                <span className="amt">{p.amt}</span>
                <span className="per">/mês</span>
              </div>
              <div className="credits">
                <Zap size={18} />
                <div>
                  <div className="c">{p.credits}</div>
                  <div className="cl">{p.cl}</div>
                </div>
              </div>
              <ul className="feats">
                {p.feats.map(([label, on], j) => (
                  <li key={j} className={on ? "" : "off"}>
                    {on ? <Check size={18} /> : <X size={18} />} {label}
                  </li>
                ))}
              </ul>
              <Link className={`btn btn-block ${p.featured ? "btn-primary" : "btn-ghost"}`} href={`/cadastro?plan=${p.id}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="annual-note reveal">
          <div className="t">
            <b>Procurando planos anuais?</b>
            <span className="h">Monte um plano sob medida com condições especiais para alto volume.</span>
          </div>
          <button className="btn btn-light" onClick={onContact}>
            <Headphones size={17} /> Falar com o time comercial
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Depoimentos ─────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="section alt" id="depoimentos">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Quem usa, comprova os resultados</span>
          <h2>Nossos clientes publicam <em>mais rápido e com um custo menor</em></h2>
          <p className="sub">Veja por que grandes marcas e agências escolheram o Raio para escalar suas publicações.</p>
        </div>
        <div className="tst-grid">
          {TESTIMONIALS.map((t, i) => (
            <div className="tst reveal" key={i} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="stars">
                {[0,1,2,3,4].map((s) => <Star key={s} size={16} fill="currentColor" />)}
              </div>
              <p className="q">&ldquo;{t.q}&rdquo;</p>
              <div className="by">
                {"photo" in t && t.photo ? (
                  <div className="av" style={{ padding: 0, overflow: "hidden" }}>
                    <img src={t.photo as string} alt={t.nm} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div className="av">{t.av}</div>
                )}
                <div>
                  <div className="nm">{t.nm}</div>
                  <div className="rl">{t.rl}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function Faq() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">Perguntas Frequentes</span>
          <h2>Tudo sobre o <em>modelo de créditos</em></h2>
        </div>
        <div className="faq reveal">
          {FAQS.map((f, i) => (
            <div className={`faq-item${open === i ? " open" : ""}`} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <span className="ico"><Plus size={15} /></span>
              </button>
              <div className="faq-a" style={{ maxHeight: open === i ? "300px" : "0" }}>
                <div className="inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ────────────────────────────────────────────────────────────────

function CtaBand() {
  return (
    <section className="cta-band">
      <div className="wrap">
        <div className="cta-inner reveal">
          <span className="glow" />
          <h2>Pronto para publicar como um Raio e colocar sua marca em <em>destaque nacional?</em></h2>
          <p className="sub">Escolha o seu plano de créditos, envie o seu conteúdo e garanta sua primeira grande matéria ainda hoje.</p>
          <div className="cta-row">
            <a className="btn btn-primary btn-lg" href="#planos">
              Ver planos <ArrowRight size={17} />
            </a>
            <Link className="btn btn-ghost btn-lg" href="/login">Já tenho conta</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ onContact }: { onContact: () => void }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="top">
          <div className="brand-col">
            <a href="#top"><RaioLockup height={27} variant="dark" /></a>
            <p>A primeira plataforma de publicação garantida e branded content por créditos do Brasil.</p>
          </div>
          <div className="col">
            <h4>Produto</h4>
            <a href="#como">Como funciona</a>
            <a href="#planos">Planos</a>
            <a href="#faq">Perguntas Frequentes</a>
            <Link href="/login">Entrar</Link>
          </div>
          <div className="col">
            <h4>Empresa</h4>
            <a href="#">Sobre</a>
            <a href="#">Veículos parceiros</a>
            <button style={{ background: "none", border: "none", padding: "6px 0", fontSize: "14.5px", color: "var(--tx-2)", cursor: "pointer", textAlign: "left", display: "block" }} onClick={onContact}>
              Contato comercial
            </button>
          </div>
          <div className="col">
            <h4>Legal</h4>
            <a href="#">Termos de uso</a>
            <a href="#">Privacidade</a>
            <a href="#">Cookies</a>
          </div>
        </div>
        <div className="bottom">
          <span className="cp">© 2026 Raio Publicador. Todos os direitos reservados.</span>
          <span className="powered">
            Energizado pela{" "}
            <a href="https://markable.com.br" target="_blank" rel="noopener noreferrer">
              <Image src="/assets/logo/markable-horizontal-mono-white.svg" alt="Markable" width={80} height={16} style={{ height: 16, width: "auto", opacity: 0.8 }} />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Modal de contato ─────────────────────────────────────────────────────────

function ContactModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", volume: "Até 10 releases/mês", msg: "" });
  const up = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.company.trim();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="site-overlay" onClick={onClose}>
      <div className="site-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sm-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        {sent ? (
          <div className="sm-success">
            <div className="sm-success-ic"><CheckCircle size={34} /></div>
            <h3>Mensagem <em>enviada</em></h3>
            <p>Nosso time comercial vai responder em até 1 dia útil no e-mail informado. Obrigado pelo interesse no Raio.</p>
            <button className="btn btn-primary btn-lg" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <div className="sm-head">
              <span className="eyebrow">Time comercial</span>
              <h3>Vamos montar o <em>plano ideal</em></h3>
              <p>Conte um pouco sobre o seu volume de distribuição e retornamos com uma proposta sob medida, inclusive planos anuais.</p>
            </div>
            <div className="sm-body">
              <div className="sm-grid2">
                <div className="sm-field"><label>Nome</label><input className="sm-in" value={form.name} onChange={(e) => up("name", e.target.value)} placeholder="Seu nome" /></div>
                <div className="sm-field"><label>E-mail corporativo</label><input className="sm-in" type="email" value={form.email} onChange={(e) => up("email", e.target.value)} placeholder="voce@empresa.com.br" /></div>
              </div>
              <div className="sm-grid2">
                <div className="sm-field"><label>Empresa / assessoria</label><input className="sm-in" value={form.company} onChange={(e) => up("company", e.target.value)} placeholder="Nome da empresa" /></div>
                <div className="sm-field"><label>Telefone</label><input className="sm-in" value={form.phone} onChange={(e) => up("phone", e.target.value)} placeholder="(11) 99999-9999" /></div>
              </div>
              <div className="sm-field">
                <label>Volume estimado</label>
                <div className="sm-select">
                  <select className="sm-in" value={form.volume} onChange={(e) => up("volume", e.target.value)}>
                    <option>Até 10 releases/mês</option>
                    <option>10 a 30 releases/mês</option>
                    <option>30 a 100 releases/mês</option>
                    <option>Mais de 100 releases/mês</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
              <div className="sm-field">
                <label>Mensagem <span className="sm-opt">opcional</span></label>
                <textarea className="sm-in" rows={3} value={form.msg} onChange={(e) => up("msg", e.target.value)} placeholder="Conte o que você precisa." />
              </div>
            </div>
            <div className="sm-foot">
              <button className="btn btn-ghost btn-lg" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary btn-lg" disabled={!valid} onClick={() => setSent(true)}>
                Enviar mensagem <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Aviso desktop (mobile) ───────────────────────────────────────────────────

function MobileNotice() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("raio_desktop_notice") === "dismissed") setHidden(true); } catch {}
  }, []);
  if (hidden) return null;
  function dismiss() {
    setHidden(true);
    try { localStorage.setItem("raio_desktop_notice", "dismissed"); } catch {}
  }
  return (
    <div className="desktop-notice" role="status">
      <div className="dn-ic"><Monitor size={20} /></div>
      <div className="dn-txt">
        <b>Melhor no computador</b>
        <span>O painel do Raio é otimizado para desktop. Para criar e distribuir releases, acesse de um computador.</span>
      </div>
      <button className="dn-close" onClick={dismiss} aria-label="Entendi"><X size={17} /></button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SitePage() {
  useReveal();
  const [contact, setContact] = useState(false);
  return (
    <>
      <Nav onContact={() => setContact(true)} />
      <Hero />
      <Logos />
      <OQueE />
      <Como />
      <Compare />
      <Metrics />
      <Plans onContact={() => setContact(true)} />
      <Testimonials />
      <Faq />
      <CtaBand />
      <Footer onContact={() => setContact(true)} />
      <MobileNotice />
      {contact && <ContactModal onClose={() => setContact(false)} />}
    </>
  );
}
