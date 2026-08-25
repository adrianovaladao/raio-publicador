"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Menu, X } from "lucide-react";
import { RaioLockup } from "@/components/logo/RaioLockup";

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
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
        <Link className="lock" href="/" onClick={close}>
          <RaioLockup height={33} variant="dark" />
        </Link>
        <div className="links">
          <Link href="/#como">Como funciona</Link>
          <Link href="/#planos">Planos</Link>
          <Link href="/sobre" style={{ color: "var(--gold)" }}>Sobre</Link>
        </div>
        <div className="nav-cta">
          <Link className="enter" href="/login">Entrar</Link>
          <Link className="btn btn-primary btn-sm" href="/#planos">Assinar agora</Link>
        </div>
        <button className="nav-burger" aria-label="Abrir menu" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`nav-mobile${menuOpen ? " open" : ""}`}>
        <Link href="/#como" onClick={close}>Como funciona</Link>
        <Link href="/#planos" onClick={close}>Planos</Link>
        <Link href="/sobre" onClick={close} style={{ color: "var(--gold)" }}>Sobre</Link>
        <div className="nav-mobile-cta">
          <Link className="btn btn-ghost btn-block" href="/login" onClick={close}>Entrar</Link>
          <Link className="btn btn-primary btn-block" href="/#planos" onClick={close}>Assinar agora</Link>
        </div>
      </div>
      {menuOpen && <div className="nav-scrim" onClick={close} />}
    </nav>
  );
}

// ─── Estilos de itálico em dourado (Roboto Serif) ────────────────────────────
// Reutiliza o padrão do sistema: var(--serif) + var(--coral) para <em>
const emStyle: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontStyle: "italic",
  fontWeight: 400,
  color: "var(--coral)",
};

// ─── Hero institucional ───────────────────────────────────────────────────────

function SobreHero() {
  return (
    <header style={{ paddingTop: 120, paddingBottom: 80, background: "#1A1A1A", textAlign: "center" }}>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <span className="eyebrow">Nossa história</span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.18, fontWeight: 700, marginTop: 12, marginBottom: 24, letterSpacing: "-0.03em" }}>
          Uma plataforma criada para quem precisa sair na imprensa,{" "}
          <span style={emStyle}>de forma garantida.</span>
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.75, color: "rgba(255,255,255,0.65)", maxWidth: 620, margin: "0 auto" }}>
          O Raio nasceu de uma percepção simples: muitos profissionais e marcas queriam aparecer na mídia, mas ou não tinham orçamento para uma assessoria completa ou buscavam algo mais pessoal e individualizado sobre o profissional por trás das suas marcas.
        </p>
      </div>
    </header>
  );
}

// ─── Origem ───────────────────────────────────────────────────────────────────

function Origem() {
  return (
    <section className="section" style={{ background: "#1F1F1F" }}>
      <div className="wrap" style={{ maxWidth: 800 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px 64px", alignItems: "start" }}>

          <div className="reveal">
            <span className="eyebrow" style={{ marginBottom: 16, display: "block" }}>O problema que motivou o Raio</span>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.25, marginBottom: 20, letterSpacing: "-0.025em", fontWeight: 700 }}>
              Visibilidade na imprensa não deveria ser{" "}
              <span style={emStyle}>privilégio apenas de quem tem acesso aos jornalistas.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 20 }}>
              O Raio nasceu para que qualquer marca ou profissional pudesse publicar nos maiores portais de notícias do Brasil de forma direta e garantida, sem precisar esperar pela agenda de uma assessoria ou negociar espaço individualmente com jornalistas.
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
              Quem começa pelo Raio descobre rapidamente o poder da presença editorial. E quando a comunicação cresce e as demandas se tornam mais estratégicas, a Markable está aqui: com 15 anos de mercado, uma equipe especializada e mais de 5.000 contatos na imprensa, pronta para levar sua marca para o próximo nível.
            </p>
          </div>

          <div className="reveal" style={{ transitionDelay: "100ms" }}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}>
              {[
                { n: "50+", l: "portais parceiros ativos" },
                { n: "5 mil", l: "contatos na imprensa brasileira" },
                { n: "100%", l: "de publicação garantida" },
                { n: "5 min", l: "para publicar o primeiro release" },
              ].map(({ n, l }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--coral)", minWidth: 80, lineHeight: 1 }}>{n}</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Quem está por trás ───────────────────────────────────────────────────────

function QuemEstaPorTras() {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div className="sec-head reveal" style={{ border: "none", padding: 0, background: "transparent", boxShadow: "none", borderRadius: 0, outline: "none", textAlign: "center", marginBottom: 64 }}>
          <span className="eyebrow">Quem está por trás do Raio</span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
            Duas décadas de estratégia de marca <em>em uma plataforma.</em>
          </h2>
        </div>

        {/* Markable */}
        <div className="reveal" style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "32px 48px",
          alignItems: "center",
          padding: "40px 44px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
        }}>
          <div style={{ textAlign: "center" }}>
            <Image
              src="/assets/logo/markable-stacked-mono-white.svg"
              alt="Markable"
              width={96}
              height={96}
              style={{ height: 80, width: "auto", opacity: 0.9 }}
            />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--coral)", marginBottom: 8 }}>Desenvolvido pela Markable</div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
              A maior assessoria de imprensa especializada em franquias do Brasil.
            </h3>
            <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 16 }}>
              Com mais de 15 anos de mercado, a Markable gerencia a comunicação de dezenas de redes franqueadoras nacionais, operando uma das maiores redes de contatos editoriais do país, com mais de 5.000 jornalistas e editores em carteira. O Raio Publicador nasce desse histórico e foi criado como a porta de entrada para marcas que ainda estão construindo sua presença na imprensa. Quando sua estratégia de comunicação crescer, a Markable é o próximo passo natural.
            </p>
            <a
              href="https://markable.com.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--coral)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
            >
              Conhecer a Markable <ExternalLink size={13} />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── Por que editorial importa ────────────────────────────────────────────────

function PorQueEditorial() {
  const items = [
    {
      title: "Credibilidade que não se compra.",
      desc: "Um anúncio diz que você é bom. Uma matéria em um portal de referência mostra que alguém achou isso digno de nota. A diferença na percepção de autoridade é substancial.",
    },
    {
      title: "Visibilidade que dura.",
      desc: "Publicações editoriais ficam indexadas por meses ou anos. Uma campanha paga desaparece quando o orçamento acaba. O release continua trabalhando por você muito depois da publicação.",
    },
    {
      title: "O Raio é o começo da jornada.",
      desc: "Marcas que começam publicando pelo Raio constroem autoridade editorial rapidamente. Quando chega a hora de escalar com estratégia e relacionamento direto com jornalistas, a Markable está pronta para o próximo passo.",
    },
  ];

  return (
    <section className="section" style={{ background: "#1F1F1F" }}>
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div className="sec-head reveal" style={{ border: "none", padding: 0, background: "transparent", boxShadow: "none", borderRadius: 0, outline: "none", textAlign: "center", marginBottom: 56 }}>
          <span className="eyebrow">Por que isso importa</span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
            Presença editorial é um <em>ativo de longo prazo.</em>
          </h2>
          <p className="sub" style={{ maxWidth: 580, margin: "16px auto 0" }}>
            Publicidade comprada gera cliques. Publicação editorial constrói autoridade. O Raio é a forma mais direta de começar essa construção. E a Markable é o parceiro para quem quer ir mais longe.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {items.map(({ title, desc }, i) => (
            <div
              key={i}
              className="reveal"
              style={{
                transitionDelay: `${i * 80}ms`,
                padding: "28px 24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
              }}
            >
              <div style={{
                width: 36,
                height: 3,
                background: "var(--coral)",
                borderRadius: 2,
                marginBottom: 20,
              }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>{title}</h3>
              <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.75, fontSize: "0.9rem", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function SobreCta() {
  return (
    <section className="cta-band">
      <div className="wrap">
        <div className="cta-inner reveal">
          <span className="glow" />
          <h2>Comece pelo Raio. <em>Cresça com a Markable.</em></h2>
          <p className="sub">Publique seus primeiros releases de forma garantida pelo Raio e, quando sua estratégia de comunicação precisar de mais, a Markable está a um clique de distância.</p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" href="/#planos">
              Ver planos <ArrowRight size={17} />
            </Link>
            <a
              className="btn btn-ghost btn-lg"
              href="https://markable.com.br"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conhecer a Markable <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="top">
          <div className="brand-col">
            <Link href="/"><RaioLockup height={29} variant="dark" /></Link>
            <p>A mais inovadora plataforma brasileira de publicação garantida e branded content em créditos que você distribui como preferir.</p>
          </div>
          <div className="col">
            <h4>Produto</h4>
            <Link href="/#como">Como funciona</Link>
            <Link href="/#planos">Planos</Link>
            <Link href="/#faq">Perguntas Frequentes</Link>
            <Link href="/login">Entrar</Link>
          </div>
          <div className="col">
            <h4>Empresa</h4>
            <Link href="/sobre">Sobre</Link>
          </div>
          <div className="col">
            <h4>Legal</h4>
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/cookies">Cookies</Link>
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

// ─── Scroll reveal ────────────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SobrePage() {
  useReveal();
  return (
    <>
      <Nav />
      <SobreHero />
      <Origem />
      <QuemEstaPorTras />
      <PorQueEditorial />
      <SobreCta />
      <Footer />
    </>
  );
}
