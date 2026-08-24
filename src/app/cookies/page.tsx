import Link from "next/link";
import { RaioLockup } from "@/components/logo/RaioLockup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — Raio Publicador",
  description: "Entenda como o Raio Publicador utiliza cookies e tecnologias similares.",
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
        <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Última atualização: agosto de 2026</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", marginBottom: 32, lineHeight: 1.2 }}>Política de Cookies</h1>

        <Section title="1. O que são cookies">
          <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa um site ou aplicativo. Eles permitem que a plataforma reconheça seu dispositivo, mantenha sua sessão ativa, lembre suas preferências e colete informações sobre como você usa o serviço.</p>
        </Section>

        <Section title="2. Cookies que utilizamos">
          <p>O Raio Publicador utiliza dois tipos de cookies:</p>

          <div style={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f4f4f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#1a1a1a", borderBottom: "1px solid #e8e8e4" }}>Tipo</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#1a1a1a", borderBottom: "1px solid #e8e8e4" }}>Nome</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#1a1a1a", borderBottom: "1px solid #e8e8e4" }}>Finalidade</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#1a1a1a", borderBottom: "1px solid #e8e8e4" }}>Duração</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f0f0ec" }}>
                  <td style={{ padding: "12px 16px", color: "#444", verticalAlign: "top" }}><span style={{ background: "#e8f5ee", color: "#2F8A5B", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>Essencial</span></td>
                  <td style={{ padding: "12px 16px", color: "#444", fontFamily: "monospace", fontSize: 13 }}>__session, __clerk_*</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>Autenticação e manutenção da sessão do usuário</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>Sessão</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f0f0ec" }}>
                  <td style={{ padding: "12px 16px", color: "#444", verticalAlign: "top" }}><span style={{ background: "#e8f5ee", color: "#2F8A5B", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>Essencial</span></td>
                  <td style={{ padding: "12px 16px", color: "#444", fontFamily: "monospace", fontSize: 13 }}>__stripe_*</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>Prevenção de fraude em transações de pagamento (Stripe)</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>1 ano</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f0f0ec" }}>
                  <td style={{ padding: "12px 16px", color: "#444", verticalAlign: "top" }}><span style={{ background: "#fff3cd", color: "#8A6500", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>Analítico</span></td>
                  <td style={{ padding: "12px 16px", color: "#444", fontFamily: "monospace", fontSize: 13 }}>_ga, _ga_*</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>Google Analytics — análise de uso e comportamento de navegação (dados anonimizados)</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>2 anos</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", color: "#444", verticalAlign: "top" }}><span style={{ background: "#e8f5ee", color: "#2F8A5B", fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>Essencial</span></td>
                  <td style={{ padding: "12px 16px", color: "#444", fontFamily: "monospace", fontSize: 13 }}>next-auth.*, __Host-*</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>Proteção contra CSRF e segurança da aplicação</td>
                  <td style={{ padding: "12px 16px", color: "#444" }}>Sessão</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. Cookies essenciais">
          <p>Os cookies essenciais são estritamente necessários para o funcionamento da plataforma. Sem eles, a autenticação, o gerenciamento de sessão e a segurança das transações não funcionariam adequadamente. Por essa razão, esses cookies não podem ser desativados.</p>
        </Section>

        <Section title="4. Cookies analíticos (Google Analytics)">
          <p>Utilizamos o Google Analytics para entender como os usuários interagem com nossa plataforma. Os dados coletados são anonimizados e não permitem identificar usuários individualmente. Essas informações nos ajudam a melhorar a experiência do produto.</p>
          <p>Você pode optar por não ser rastreado pelo Google Analytics instalando o <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a", fontWeight: 600 }}>complemento de desativação do Google Analytics</a> no seu navegador.</p>
          <p>Para mais informações sobre como o Google trata esses dados, consulte a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a", fontWeight: 600 }}>Política de Privacidade do Google</a>.</p>
        </Section>

        <Section title="5. Como gerenciar cookies">
          <p>A maioria dos navegadores permite que você visualize, gerencie e exclua cookies por meio das configurações de privacidade. Veja como fazer isso nos principais navegadores:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/pt-BR/kb/cookies-informacoes-sites-armazenam-no-computador" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406" target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a" }}>Microsoft Edge</a></li>
          </ul>
          <p>Atenção: desativar cookies essenciais pode impedir o correto funcionamento da plataforma, incluindo o login e o acesso à área logada.</p>
        </Section>

        <Section title="6. Alterações nesta Política">
          <p>Esta Política de Cookies pode ser atualizada periodicamente para refletir mudanças nos cookies que utilizamos ou alterações regulatórias. A data de revisão no topo deste documento indica quando a última versão foi publicada.</p>
        </Section>

        <Section title="7. Contato">
          <p>Para dúvidas sobre o uso de cookies pelo Raio Publicador:<br />
          <a href="mailto:adrianovaladao@raiopublicador.com.br" style={{ color: "#1a1a1a", fontWeight: 600 }}>adrianovaladao@raiopublicador.com.br</a></p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e8e8e4" }}>
          <Link href="/" style={{ fontSize: 14, color: "#888", textDecoration: "none" }}>← Voltar para o início</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 15, color: "#444", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}
