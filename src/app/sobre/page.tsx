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
          Uma plataforma criada para quem quer transformar conteúdo em presença na mídia,{" "}
          <span style={emStyle}>de forma garantida.</span>
        </h1>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.75, color: "rgba(255,255,255,0.65)", maxWidth: 620, margin: "0 auto" }}>
          O Raio nasceu de uma experiência acumulada ao longo de 15 anos de trabalho com comunicação e imprensa. Nesse período, a Markable conversou com milhares de empresas e profissionais e percebeu que nem todos buscavam a mesma coisa. Alguns queriam um trabalho contínuo de assessoria de imprensa. Outros precisavam de algo mais pontual, queriam falar sobre a própria trajetória ou buscavam a segurança de saber exatamente onde seu conteúdo seria publicado. Em muitos casos, a verba disponível também pedia uma solução mais acessível.
        </p>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.75, color: "rgba(255,255,255,0.65)", maxWidth: 620, margin: "16px auto 0" }}>
          Foi dessa necessidade que nasceu o Raio Publicador: uma nova forma de colocar boas histórias em grandes portais de notícias, com mais autonomia, simplicidade e publicação garantida.
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

          <div className="reveal" style={{ gridColumn: "1 / -1" }}>
            <span className="eyebrow" style={{ marginBottom: 16, display: "block" }}>A oportunidade que nos motivou</span>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", lineHeight: 1.25, marginBottom: 20, letterSpacing: "-0.025em", fontWeight: 700 }}>
              Aparecer é obrigação, mas nem toda empresa precisa da mesma{" "}
              <span style={emStyle}>estratégia de comunicação.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 16 }}>
              Ao longo dos anos, percebemos que muitas marcas e profissionais queriam estar nos grandes portais, mas nem todas buscavam a mesma dinâmica da assessoria de imprensa tradicional.
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 16 }}>
              Algumas queriam falar de um lançamento, contar a história de um fundador ou fortalecer determinado posicionamento. Outras simplesmente queriam ter a certeza da publicação, algo que a imprensa espontânea, por sua própria natureza, não pode garantir.
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: 16 }}>
              O Raio Publicador nasceu justamente para atender essa demanda por uma plataforma em que marcas e profissionais podem escolher onde querem estar e publicar seus conteúdos de forma direta, simples e garantida.
            </p>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
              O Raio Publicador não substitui a assessoria de imprensa. Ele resolve uma necessidade diferente.
            </p>
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
          <span className="eyebrow">Quem está por trás do Raio Publicador</span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
            15 anos de comunicação e relacionamento com a imprensa <em>transformados em tecnologia.</em>
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
            <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 16 }}>
              O Raio Publicador nasce dentro da Markable Comunicação, uma agência com 15 anos de experiência em assessoria de imprensa e relacionamento com os principais veículos do país.
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 16 }}>
              Foi essa experiência que nos mostrou que comunicação não precisa ter um único caminho.
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 16 }}>
              Para algumas empresas, o objetivo é conquistar espaço espontâneo na imprensa, construir relacionamento com jornalistas e desenvolver reputação no longo prazo. Para outras, existe uma necessidade mais direta: publicar determinado conteúdo, em determinado veículo, com previsibilidade.
            </p>
            <a
              href="https://markable.com.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--coral)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
            >
              Mais sobre a Markable <ExternalLink size={13} />
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
      title: "Você escolhe onde quer estar.",
      desc: "No Raio Publicador, você escolhe entre os portais disponíveis, envia seu conteúdo e sabe previamente onde ele será publicado. Sem depender da aprovação espontânea de uma pauta por uma redação.",
    },
    {
      title: "Sua marca ganha autoridade.",
      desc: "Uma publicação em um portal relevante pode ajudar a apresentar uma empresa, contar uma história, fortalecer um posicionamento e ampliar sua presença digital.",
    },
    {
      title: "Mas, se quiser ir além, tem a Markable.",
      desc: "Quando o objetivo passa a envolver estratégia contínua, relacionamento com jornalistas, construção de reputação e conquista de mídia espontânea, a Markable complementa esse trabalho com uma atuação completa de assessoria de imprensa.",
    },
  ];

  return (
    <section className="section" style={{ background: "#1F1F1F" }}>
      <div className="wrap" style={{ maxWidth: 860 }}>
        <div className="sec-head reveal" style={{ border: "none", padding: 0, background: "transparent", boxShadow: "none", borderRadius: 0, outline: "none", textAlign: "center", marginBottom: 56 }}>
          <span className="eyebrow">Por que isso importa</span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
            Existem diferentes formas de <em>construir presença na mídia.</em>
          </h2>
          <p className="sub" style={{ maxWidth: 580, margin: "16px auto 0" }}>
            Publicação garantida e assessoria de imprensa cumprem papéis diferentes dentro de uma estratégia de comunicação. O importante é entender qual deles faz sentido para cada momento da marca.
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
          <h2>Raio Publicador + Markable. <em>Duas soluções com a mesma expertise em comunicação.</em></h2>
          <p className="sub">Você pode publicar pelo Raio. Pode trabalhar sua reputação com a Markable. Ou pode combinar as duas estratégias. Sua marca escolhe até onde quer ir e a gente tem um caminho para cada momento.</p>
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
