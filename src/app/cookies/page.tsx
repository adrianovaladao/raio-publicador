import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Quais cookies o Raio Publicador usa, para que servem e como gerenciá-los.",
};

const prose: React.CSSProperties = {
  fontSize: "clamp(14px, 3.5vw, 15px)",
  color: "rgba(255,255,255,0.7)",
  lineHeight: 1.8,
};

export default function CookiesPage() {
  return (
    <>
      <SiteNav />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(80px,12vw,96px) 24px 80px" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Vigência a partir de: agosto de 2026</p>
        <h1 style={{ fontSize: "clamp(28px,7vw,40px)", fontWeight: 800, color: "rgba(255,255,255,0.95)", marginBottom: 16, lineHeight: 1.2 }}>Política de Cookies</h1>
        <p style={{ ...prose, marginBottom: 40, borderLeft: "3px solid #FAB500", paddingLeft: 16 }}>
          Cookies são pequenos arquivos que o navegador salva no seu dispositivo quando você visita um site. Utilizamos cookies essenciais para o funcionamento da plataforma e, mediante consentimento quando aplicável, cookies de análise para compreender como o Raio Publicador é utilizado e aprimorar a experiência dos usuários.
        </p>

        <Section title="1. Cookies essenciais">
          <p>São indispensáveis para que a plataforma funcione. Sem eles, você não consegue fazer login nem navegar pelas páginas autenticadas. <strong>Não há opção de desativá-los enquanto você usa o Raio Publicador</strong> &mdash; desabilitá-los significa não conseguir usar o serviço.</p>
          <p>Esses cookies são utilizados com fundamento na necessidade de execução do serviço, segurança da plataforma e demais hipóteses legais aplicáveis. Como são indispensáveis ao funcionamento do Raio Publicador, não dependem de consentimento e não podem ser desativados por meio do gerenciador de cookies da plataforma.</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 540 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
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
          <p>Utilizamos ferramentas de análise, como o Google Analytics, para compreender de forma estatística como a plataforma é utilizada, incluindo páginas acessadas, origem dos acessos, tempo de navegação e possíveis dificuldades de uso. Esses dados são utilizados para análise de desempenho e melhoria da plataforma, e não para publicidade comportamental ou remarketing.</p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 540 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
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

          <p>Os cookies de análise são não essenciais e serão utilizados somente quando houver base legal adequada, inclusive consentimento quando aplicável. O Usuário poderá aceitar, rejeitar ou posteriormente revogar sua autorização por meio do gerenciador de cookies disponibilizado na plataforma.</p>
          <p>Para desativar o rastreamento pelo Google Analytics sem precisar ajustar configurações do navegador, você pode instalar o <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a", fontWeight: 600 }}>complemento oficial de exclusão do Google Analytics</a>.</p>
        </Section>

        <Section title="3. O que não usamos">
          <p>Atualmente o Raio Publicador <strong>não utiliza</strong>:</p>
          <ul>
            <li>Cookies de rastreamento publicitário ou remarketing</li>
            <li>Pixels de redes sociais (Facebook, TikTok, LinkedIn etc.)</li>
            <li>Cookies de terceiros para segmentação de audiência</li>
            <li>Qualquer tecnologia de rastreamento entre sites (<em>cross-site tracking</em>)</li>
          </ul>
        </Section>

        <Section title="4. Como gerenciar cookies no seu navegador">
          <p>Você pode configurar seu navegador para bloquear, excluir ou alertá-lo sobre cookies. Lembre-se: bloquear cookies essenciais impede o uso da plataforma. Para cookies de análise, o impacto é apenas na nossa capacidade de entender o uso.</p>
          <p>A exclusão ou bloqueio de cookies diretamente pelo navegador poderá apagar preferências anteriormente registradas e exigir novo login ou nova configuração em acessos futuros.</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/pt-BR/kb/limpar-cookies-e-dados-de-sites-no-firefox" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Safari (Mac e iOS)</a></li>
            <li><a href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Microsoft Edge</a></li>
          </ul>
        </Section>

        <Section title="5. Cookies e tecnologias de terceiros">
          <p>Algumas funcionalidades do Raio Publicador dependem de serviços fornecidos por terceiros, como ferramentas de autenticação, pagamento e análise de uso. Esses fornecedores poderão utilizar cookies ou tecnologias semelhantes conforme suas próprias políticas de privacidade e cookies.</p>
          <p>O Raio Publicador seleciona fornecedores necessários à operação da plataforma e trata os dados relacionados a esses serviços conforme sua Política de Privacidade e a legislação aplicável.</p>
        </Section>

        <Section title="6. Atualizações nesta Política">
          <p>Esta Política poderá ser atualizada para refletir alterações na plataforma, nos fornecedores utilizados, na legislação aplicável ou nas práticas de tratamento de dados. Alterações relevantes serão comunicadas pelos meios disponíveis na plataforma quando necessário. A versão vigente estará sempre disponível nesta página, com indicação da data de atualização.</p>
          <p>Dúvidas: <a href="mailto:contato@raiopublicador.com.br" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>contato@raiopublicador.com.br</a></p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/termos" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Termos de Uso →</Link>
          <Link href="/privacidade" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Política de Privacidade →</Link>
          <Link href="/" style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", textDecoration: "none", marginLeft: "auto" }}>← Voltar para o início</Link>
        </div>
      </main>
    </>
  );
}

const th: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 700,
  borderBottom: "2px solid rgba(255,255,255,0.15)",
  whiteSpace: "nowrap",
  color: "rgba(255,255,255,0.85)",
};

function Row({ name, origin, desc, val }: { name: string; origin: string; desc: string; val: string }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap" }}>{name}</td>
      <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{origin}</td>
      <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.65)" }}>{desc}</td>
      <td style={{ padding: "8px 12px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{val}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: "clamp(15px,4vw,17px)", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{title}</h2>
      <div style={{ fontSize: "clamp(13px,3.5vw,15px)", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}
