import Link from "next/link";
import { RaioLockup } from "@/components/logo/RaioLockup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Raio Publicador",
  description: "Saiba como o Raio Publicador coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
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
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", marginBottom: 32, lineHeight: 1.2 }}>Política de Privacidade</h1>

        <Section title="1. Quem somos">
          <p><strong>RAIO PUBLICADOR TECNOLOGIA DE COMUNICACAO LTDA</strong>, CNPJ 68.372.169/0001-06, com sede em São Paulo – SP ("Raio", "nós" ou "empresa"), é a controladora dos dados pessoais tratados no âmbito da plataforma Raio Publicador.</p>
          <p>Esta Política de Privacidade foi elaborada em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD)</strong> e descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais.</p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p><strong>Dados fornecidos diretamente por você:</strong></p>
          <ul>
            <li>Nome, e-mail e foto de perfil (via autenticação com Google ou e-mail/senha)</li>
            <li>Dados cadastrais para emissão de nota fiscal: CPF ou CNPJ, razão social ou nome completo, endereço</li>
            <li>Dados de pagamento (processados diretamente pelo Stripe — não armazenamos dados de cartão)</li>
            <li>Conteúdo de releases criados na plataforma</li>
            <li>Informações de marca, logo e dados da equipe</li>
          </ul>
          <p><strong>Dados coletados automaticamente:</strong></p>
          <ul>
            <li>Endereço IP e localização aproximada</li>
            <li>Tipo de dispositivo, navegador e sistema operacional</li>
            <li>Páginas acessadas e tempo de permanência (via Google Analytics)</li>
            <li>Logs de acesso e atividade na plataforma</li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
          <p>Utilizamos seus dados para as seguintes finalidades:</p>
          <ul>
            <li><strong>Execução do contrato:</strong> processar pagamentos, gerenciar assinaturas, publicar releases e prestar o serviço contratado</li>
            <li><strong>Emissão de notas fiscais:</strong> gerar NFS-e com base nos dados cadastrais fornecidos</li>
            <li><strong>Comunicação:</strong> enviar confirmações de transações, notificações do serviço e e-mails operacionais</li>
            <li><strong>Segurança:</strong> detectar fraudes, abusos e atividades suspeitas</li>
            <li><strong>Melhoria do produto:</strong> analisar uso da plataforma para aprimorar funcionalidades (dados anonimizados)</li>
            <li><strong>Cumprimento de obrigações legais:</strong> atender requisitos fiscais, contábeis e regulatórios</li>
          </ul>
        </Section>

        <Section title="4. Base legal para o tratamento">
          <p>O tratamento dos seus dados pessoais é fundamentado nas seguintes bases legais previstas na LGPD:</p>
          <ul>
            <li><strong>Execução de contrato</strong> (art. 7º, V) — para prestação dos serviços contratados</li>
            <li><strong>Cumprimento de obrigação legal</strong> (art. 7º, II) — para emissão de notas fiscais e obrigações tributárias</li>
            <li><strong>Legítimo interesse</strong> (art. 7º, IX) — para segurança da plataforma e melhoria do serviço</li>
            <li><strong>Consentimento</strong> (art. 7º, I) — para comunicações de marketing, quando aplicável</li>
          </ul>
        </Section>

        <Section title="5. Compartilhamento de dados">
          <p>Seus dados poderão ser compartilhados com:</p>
          <ul>
            <li><strong>Stripe Inc.</strong> — processamento de pagamentos</li>
            <li><strong>Clerk Inc.</strong> — autenticação e gestão de identidade</li>
            <li><strong>NFe.io</strong> — emissão de notas fiscais eletrônicas</li>
            <li><strong>Google LLC</strong> — analytics e infraestrutura (Google Analytics, Vercel/GCP)</li>
            <li><strong>Resend Inc.</strong> — envio de e-mails transacionais</li>
            <li><strong>Portais parceiros</strong> — apenas o conteúdo do release submetido para publicação</li>
          </ul>
          <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins publicitários.</p>
        </Section>

        <Section title="6. Retenção de dados">
          <p>Mantemos seus dados pelo período necessário para cumprir as finalidades descritas nesta Política ou conforme exigido por lei:</p>
          <ul>
            <li>Dados de conta: enquanto a conta estiver ativa e por até 5 anos após o encerramento</li>
            <li>Dados fiscais e de pagamento: 5 anos, conforme exigência da legislação tributária brasileira</li>
            <li>Logs de acesso: 6 meses, conforme o Marco Civil da Internet (Lei nº 12.965/2014)</li>
          </ul>
        </Section>

        <Section title="7. Segurança">
          <p>Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, perda, alteração ou divulgação indevida, incluindo:</p>
          <ul>
            <li>Comunicação via HTTPS com certificado TLS</li>
            <li>Armazenamento em banco de dados com controle de acesso por autenticação</li>
            <li>Dados de pagamento processados exclusivamente pelo Stripe (certificação PCI DSS)</li>
            <li>Acesso restrito aos dados por parte da equipe interna com base na necessidade</li>
          </ul>
        </Section>

        <Section title="8. Seus direitos (LGPD)">
          <p>Como titular dos dados, você tem os seguintes direitos:</p>
          <ul>
            <li><strong>Confirmação e acesso</strong> — saber se tratamos seus dados e obter cópia deles</li>
            <li><strong>Correção</strong> — solicitar a correção de dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Anonimização, bloqueio ou eliminação</strong> — dos dados desnecessários ou tratados em desconformidade</li>
            <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado</li>
            <li><strong>Revogação do consentimento</strong> — a qualquer momento, para as finalidades baseadas em consentimento</li>
            <li><strong>Oposição</strong> — ao tratamento com base em legítimo interesse</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato pelo e-mail: <a href="mailto:adrianovaladao@raiopublicador.com.br" style={{ color: "#1a1a1a", fontWeight: 600 }}>adrianovaladao@raiopublicador.com.br</a></p>
        </Section>

        <Section title="9. Cookies">
          <p>Utilizamos cookies para garantir o funcionamento da plataforma e analisar o uso do serviço. Para mais detalhes, consulte nossa <Link href="/cookies" style={{ color: "#1a1a1a", fontWeight: 600 }}>Política de Cookies</Link>.</p>
        </Section>

        <Section title="10. Alterações nesta Política">
          <p>Esta Política pode ser atualizada periodicamente. Quando realizarmos alterações relevantes, notificaremos por e-mail ou aviso na plataforma. Recomendamos que você revise este documento periodicamente.</p>
        </Section>

        <Section title="11. Contato">
          <p>Para dúvidas, solicitações ou exercício de direitos relacionados à privacidade dos seus dados:<br />
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
