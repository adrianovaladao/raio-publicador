import Link from "next/link";
import { RaioLockup } from "@/components/logo/RaioLockup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — Raio Publicador",
  description: "Quais cookies o Raio Publicador usa, para que servem e como gerenciá-los.",
};

export default function CookiesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f7", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <header style={{ background: "#000", padding: "20px 0" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
            <RaioLockup height={28} variant="dark" />
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Vigência a partir de: agosto de 2026</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", marginBottom: 16, lineHeight: 1.2 }}>Política de Cookies</h1>
        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.7, marginBottom: 40, borderLeft: "3px solid #FAB500", paddingLeft: 16 }}>
          Cookies são pequenos arquivos que o navegador salva no seu dispositivo quando você visita um site. Usamos apenas o necessário para manter a plataforma funcionando e entender como ela é usada. Aqui está exatamente o que e por quê.
        </p>

        <Section title="1. Cookies essenciais">
          <p>São indispensáveis para que a plataforma funcione. Sem eles, você não consegue fazer login nem navegar pelas páginas autenticadas. <strong>Não há opção de desativá-los enquanto você usa o Raio Publicador</strong> &mdash; desabilitá-los significa não conseguir usar o serviço.</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 540 }}>
              <thead>
                <tr style={{ background: "#f0eeea" }}>
                  <th style={th}>Cookie</th>
                  <th style={th}>Origem</th>
                  <th style={th}>Função</th>
                  <th style={th}>Validade</th>
                </tr>
              </thead>
              <tbody>
                <Row name="__session" origin="Clerk" desc="Mantém sua sessão autenticada na plataforma" val="Sessão" />
                <Row name="__clerk_*" origin="Clerk" desc="Tokens de segurança e estado de autenticação" val="Sessão" />
                <Row name="__stripe_mid" origin="Stripe" desc="Detecção de fraude em pagamentos" val="1 ano" />
                <Row name="__stripe_sid" origin="Stripe" desc="Sessão de checkout no Stripe" val="30 min" />
                <Row name="__Host-next-auth.*" origin="Next.js" desc="Estado de roteamento seguro (CSRF)" val="Sessão" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="2. Cookies de análise">
          <p>Usamos o Google Analytics para entender como a plataforma é usada: quais páginas são mais visitadas, de onde vêm os acessos e onde as pessoas encontram dificuldade. Esses dados são <strong>agregados e anonimizados</strong> &mdash; não usamos o Analytics para rastrear você individualmente ou para fins publicitários.</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 540 }}>
              <thead>
                <tr style={{ background: "#f0eeea" }}>
                  <th style={th}>Cookie</th>
                  <th style={th}>Origem</th>
                  <th style={th}>Função</th>
                  <th style={th}>Validade</th>
                </tr>
              </thead>
              <tbody>
                <Row name="_ga" origin="Google" desc="Identifica sessões únicas para métricas de audiência" val="2 anos" />
                <Row name="_ga_*" origin="Google" desc="Mantém estado da sessão do Analytics" val="2 anos" />
              </tbody>
            </table>
          </div>

          <p>Para desativar o rastreamento pelo Google Analytics sem precisar ajustar configurações do navegador, você pode instalar o <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a", fontWeight: 600 }}>complemento oficial de exclusão do Google Analytics</a>.</p>
        </Section>

        <Section title="3. O que não usamos">
          <p>Para deixar claro: o Raio Publicador <strong>não utiliza</strong>:</p>
          <ul>
            <li>Cookies de rastreamento publicitário ou remarketing</li>
            <li>Pixels de redes sociais (Facebook, TikTok, LinkedIn etc.)</li>
            <li>Cookies de terceiros para segmentação de audiência</li>
            <li>Qualquer tecnologia de rastreamento entre sites (<em>cross-site tracking</em>)</li>
          </ul>
        </Section>

        <Section title="4. Como gerenciar cookies no seu navegador">
          <p>Você pode configurar seu navegador para bloquear, excluir ou alertá-lo sobre cookies. Lembre-se: bloquear cookies essenciais impede o uso da plataforma. Para cookies de análise, o impacto é apenas na nossa capacidade de entender o uso.</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/pt-BR/kb/limpar-cookies-e-dados-de-sites-no-firefox" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Safari (Mac e iOS)</a></li>
            <li><a href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Microsoft Edge</a></li>
          </ul>
        </Section>

        <Section title="5. Atualizações nesta Política">
          <p>Se introduzirmos novos cookies &mdash; especialmente de categorias diferentes das que já usamos &mdash; atualizaremos esta página e notificaremos por e-mail com antecedência mínima de 10 dias. Mudanças em cookies essenciais de fornecedores existentes (por exemplo, uma versão nova do Clerk) podem ser feitas sem aviso prévio, mas sempre serão refletidas aqui.</p>
          <p>Dúvidas: <a href="mailto:adrianovaladao@raiopublicador.com.br" style={{ color: "#1a1a1a", fontWeight: 600 }}>adrianovaladao@raiopublicador.com.br</a></p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e8e8e4", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/termos" style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>Termos de Uso →</Link>
          <Link href="/privacidade" style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>Política de Privacidade →</Link>
          <Link href="/" style={{ fontSize: 14, color: "#888", textDecoration: "none", marginLeft: "auto" }}>← Voltar para o início</Link>
        </div>
      </main>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 700,
  borderBottom: "2px solid #e0ddd8",
  whiteSpace: "nowrap",
};

function Row({ name, origin, desc, val }: { name: string; origin: string; desc: string; val: string }) {
  return (
    <tr style={{ borderBottom: "1px solid #eee" }}>
      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 13, color: "#333", whiteSpace: "nowrap" }}>{name}</td>
      <td style={{ padding: "8px 12px", color: "#555", whiteSpace: "nowrap" }}>{origin}</td>
      <td style={{ padding: "8px 12px", color: "#444" }}>{desc}</td>
      <td style={{ padding: "8px 12px", color: "#666", whiteSpace: "nowrap" }}>{val}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #eee" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "#444", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}
