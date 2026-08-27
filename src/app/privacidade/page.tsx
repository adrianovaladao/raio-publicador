import Link from "next/link";
import { RaioLockup } from "@/components/logo/RaioLockup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Raio Publicador trata, armazena e protege seus dados pessoais.",
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
        <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Vigência a partir de: agosto de 2026</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", marginBottom: 16, lineHeight: 1.2 }}>Política de Privacidade</h1>
        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.7, marginBottom: 40, borderLeft: "3px solid #FAB500", paddingLeft: 16 }}>
          Privacidade não é burocracia &mdash; é respeito. Aqui explicamos, sem rodeios, o que coletamos, por que coletamos e o que fazemos com os seus dados. Este documento é regido pela <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
        </p>

        <Section title="1. Quem responde pelos seus dados">
          <p>A controladora dos seus dados pessoais é a <strong>RAIO PUBLICADOR TECNOLOGIA DE COMUNICACAO LTDA</strong>, CNPJ 68.372.169/0001-06, com sede em São Paulo &ndash; SP. Sempre que &ldquo;Raio&rdquo;, &ldquo;nós&rdquo; ou &ldquo;nosso&rdquo; aparecerem nesta Política, é a ela que nos referimos.</p>
          <p>Para dúvidas relacionadas à privacidade, proteção de dados ou exercício dos direitos previstos nesta Política, entre em contato pelo e-mail: <a href="mailto:raiopublicador@gmail.com" style={{ color: "#1a1a1a", fontWeight: 600 }}>raiopublicador@gmail.com</a></p>
        </Section>

        <Section title="2. O que coletamos e em qual momento">
          <p><strong>Ao criar sua conta:</strong></p>
          <ul>
            <li>Nome, endereço de e-mail e foto de perfil (via autenticação gerenciada pelo Clerk)</li>
            <li>Dados de acesso: endereço IP, tipo de dispositivo, sistema operacional e navegador</li>
          </ul>
          <p><strong>Ao assinar um plano:</strong></p>
          <ul>
            <li>Dados fiscais obrigatórios para emissão de NFS-e: CPF ou CNPJ, nome completo ou razão social, endereço completo</li>
            <li>Dados de pagamento — processados diretamente pelo Stripe (não armazenamos número de cartão, CVV ou dados bancários)</li>
          </ul>
          <p><strong>Ao usar a plataforma:</strong></p>
          <ul>
            <li>Conteúdo dos releases criados, editados e publicados</li>
            <li>Informações de marcas, logos e membros de equipe</li>
            <li>Histórico de publicações e uso de créditos</li>
            <li>Logs de acesso e eventos da plataforma</li>
          </ul>
          <p><strong>Automaticamente, durante a navegação:</strong></p>
          <ul>
            <li>Dados de navegação e interação com a plataforma, como páginas visitadas, cliques e duração da sessão, por meio de ferramentas de análise, quando autorizadas pelo Usuário e conforme descrito na Política de Cookies.</li>
            <li>Cookies de sessão e autenticação (ver nossa <Link href="/cookies" style={{ color: "#1a1a1a", fontWeight: 600 }}>Política de Cookies</Link>)</li>
          </ul>
          <p><strong>Dados fornecidos pelo Usuário sobre terceiros:</strong> ao utilizar a plataforma, o Usuário poderá inserir informações relacionadas a membros de sua equipe ou terceiros mencionados nos conteúdos submetidos à publicação, como nomes, cargos, imagens, depoimentos e outras informações. Nesses casos, o Usuário declara possuir autorização ou outra base legal adequada para o tratamento e compartilhamento desses dados.</p>
        </Section>

        <Section title="3. Por que usamos seus dados">
          <p>Cada finalidade tem uma base legal correspondente na LGPD:</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 4 }}>
            <thead>
              <tr style={{ background: "#f0eeea" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #e0ddd8" }}>Finalidade</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, borderBottom: "2px solid #e0ddd8" }}>Base legal</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Prestar o serviço contratado (publicação de releases, gestão de créditos)", "Execução de contrato — art. 7º, V"],
                ["Emitir NFS-e e cumprir obrigações tributárias", "Obrigação legal — art. 7º, II"],
                ["Enviar notificações e e-mails operacionais do serviço", "Execução de contrato — art. 7º, V"],
                ["Prevenir fraudes e garantir a segurança da plataforma", "Legítimo interesse — art. 7º, IX"],
                ["Analisar a utilização da plataforma por meio de cookies e ferramentas analíticas não essenciais", "Legítimo interesse — art. 7º, IX / Consentimento — art. 7º, I, quando aplicável"],
                ["Enviar comunicações de marketing e novidades (opt-out a qualquer momento). O consentimento para comunicações de marketing poderá ser revogado a qualquer momento por meio do link de descadastramento presente nas mensagens ou pelos canais de atendimento, sem prejuízo do recebimento de comunicações operacionais necessárias à prestação do serviço.", "Consentimento — art. 7º, I"],
              ].map(([fin, base], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 12px", color: "#444" }}>{fin}</td>
                  <td style={{ padding: "8px 12px", color: "#666", whiteSpace: "nowrap" }}>{base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="4. Inteligência artificial e seus dados">
          <p>Quando você usa o assistente de IA para criar ou reescrever releases, o conteúdo do briefing é enviado ao modelo de linguagem para gerar o texto solicitado. Esses dados:</p>
          <ul>
            <li>Os dados e conteúdos inseridos nos recursos de inteligência artificial são tratados para viabilizar a funcionalidade solicitada pelo Usuário e poderão ser processados pelos fornecedores tecnológicos responsáveis por esses recursos, conforme suas condições contratuais e de privacidade.</li>
            <li>O Raio Publicador não utiliza o conteúdo inserido pelo Usuário nos recursos de IA para fins próprios de publicidade comportamental ou comercialização de dados.</li>
            <li>O Usuário não deverá inserir informações confidenciais, segredos comerciais ou dados pessoais de terceiros sem possuir autorização ou base legal adequada para esse tratamento.</li>
          </ul>
        </Section>

        <Section title="5. Com quem compartilhamos">
          <p>Seus dados poderão ser compartilhados com fornecedores necessários à operação da plataforma, observadas as finalidades descritas nesta Política e as medidas de proteção aplicáveis.</p>
          <ul>
            <li><strong>Clerk Inc.</strong> — autenticação, sessões e gestão de identidade</li>
            <li><strong>Stripe Inc.</strong> — processamento de pagamentos com cartão e boleto (PCI DSS)</li>
            <li><strong>NFe.io</strong> — emissão de notas fiscais de serviço eletrônicas</li>
            <li><strong>Resend Inc.</strong> — envio de e-mails transacionais (confirmações, notificações)</li>
            <li><strong>Google LLC</strong> — analytics de uso (Google Analytics) e infraestrutura de hospedagem (Vercel / GCP)</li>
            <li><strong>Portais jornalísticos parceiros</strong> — recebem o conteúdo e as informações necessárias à realização da publicação contratada, que poderão incluir dados pessoais constantes do próprio material enviado pelo Usuário</li>
          </ul>
          <p><strong>Não vendemos, alugamos nem comercializamos seus dados pessoais</strong> com anunciantes ou quaisquer terceiros para fins de segmentação ou marketing.</p>
        </Section>

        <Section title="6. Por quanto tempo ficamos com seus dados">
          <p>Retemos os dados pelo tempo mínimo necessário a cada finalidade:</p>
          <ul>
            <li><strong>Dados de conta e releases:</strong> enquanto a conta estiver ativa; após o encerramento, por até 5 anos para eventual resolução de litígios</li>
            <li><strong>Dados fiscais (NFS-e, CNPJ/CPF, endereço):</strong> 5 anos, conforme exigência da legislação tributária brasileira (Código Tributário Nacional)</li>
            <li><strong>Logs de acesso:</strong> 6 meses, conforme o Marco Civil da Internet (Lei nº 12.965/2014, art. 15)</li>
            <li><strong>Dados de pagamento:</strong> gerenciados pelo Stripe conforme a política de retenção deles (máximo 7 anos para fins de conformidade PCI)</li>
          </ul>
        </Section>

        <Section title="7. Como protegemos suas informações">
          <p>O Raio Publicador adota medidas técnicas, administrativas e organizacionais razoáveis e compatíveis com a natureza dos dados tratados e os riscos envolvidos, buscando proteger as informações contra acessos não autorizados, destruição, perda, alteração, comunicação ou tratamento inadequado ou ilícito.</p>
          <ul>
            <li>Transmissão criptografada via HTTPS com TLS 1.2+ em todos os ambientes</li>
            <li>Banco de dados com controle de acesso por autenticação e segregação de ambientes</li>
            <li>Pagamentos processados exclusivamente pelo Stripe (certificação PCI DSS nível 1)</li>
            <li>Autenticação gerenciada pelo Clerk com suporte a MFA</li>
            <li>Acesso interno aos dados restrito ao princípio do menor privilégio</li>
            <li>Monitoramento de atividades suspeitas e alertas de segurança</li>
          </ul>
          <p>Em caso de incidente de segurança envolvendo dados pessoais, o Raio Publicador adotará as medidas previstas na legislação aplicável, incluindo, quando exigido, a comunicação à ANPD e aos titulares afetados.</p>
        </Section>

        <Section title="8. Seus direitos como titular">
          <p>A LGPD garante a você os seguintes direitos, que podem ser exercidos a qualquer momento pelo e-mail <a href="mailto:adrianovaladao@raiopublicador.com.br" style={{ color: "#1a1a1a", fontWeight: 600 }}>adrianovaladao@raiopublicador.com.br</a>:</p>
          <ul>
            <li><strong>Confirmação e acesso</strong> &mdash; saber se processamos seus dados e obter uma cópia</li>
            <li><strong>Correção</strong> &mdash; atualizar dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Eliminação</strong> &mdash; solicitar a exclusão de dados tratados com base em consentimento</li>
            <li><strong>Portabilidade</strong> &mdash; receber seus dados em formato legível por máquina</li>
            <li><strong>Oposição</strong> &mdash; contestar o tratamento com base em legítimo interesse</li>
            <li><strong>Revogação do consentimento</strong> &mdash; retirar a qualquer momento autorizações dadas voluntariamente</li>
            <li><strong>Informação sobre compartilhamento</strong> &mdash; saber com quais entidades seus dados foram compartilhados</li>
            <li>Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências dessa negativa</li>
            <li>Revisão de decisões tomadas unicamente com base em tratamento automatizado, quando aplicável</li>
          </ul>
          <p>As solicitações serão analisadas e respondidas nos prazos previstos pela legislação e regulamentação aplicáveis. Quando necessário para proteção do titular e prevenção a fraudes, poderemos solicitar informações adicionais para confirmar a identidade do solicitante.</p>
        </Section>

        <Section title="9. Crianças e adolescentes">
          <p>A plataforma é destinada exclusivamente a maiores de 18 anos. Não coletamos intencionalmente dados de menores de idade. Caso identifiquemos que dados de crianças ou adolescentes foram fornecidos em desacordo com esta Política ou com os Termos de Uso, adotaremos as medidas adequadas, que poderão incluir o bloqueio ou encerramento da conta e a eliminação dos dados, ressalvadas as hipóteses legais de conservação.</p>
        </Section>

        <Section title="10. Como comunicamos mudanças">
          <p>Esta Política poderá ser atualizada para refletir mudanças na plataforma, nas práticas de tratamento de dados, nos fornecedores utilizados ou na legislação aplicável. Alterações relevantes serão comunicadas aos Usuários pelos meios disponíveis na plataforma ou pelo endereço eletrônico cadastrado, quando necessário. A versão vigente estará sempre disponível nesta página, acompanhada da respectiva data de atualização.</p>
        </Section>

        <Section title="11. Documentos relacionados">
          <p>Esta Política de Privacidade deve ser lida em conjunto com os <Link href="/termos" style={{ color: "#1a1a1a", fontWeight: 600 }}>Termos de Uso</Link> e a <Link href="/cookies" style={{ color: "#1a1a1a", fontWeight: 600 }}>Política de Cookies</Link> do Raio Publicador, disponíveis na plataforma.</p>
          <p>Esses documentos apresentam informações complementares sobre as condições de utilização do serviço, tratamento de dados pessoais e tecnologias utilizadas durante a navegação.</p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e8e8e4", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/termos" style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>Termos de Uso →</Link>
          <Link href="/cookies" style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>Política de Cookies →</Link>
          <Link href="/" style={{ fontSize: 14, color: "#888", textDecoration: "none", marginLeft: "auto" }}>← Voltar para o início</Link>
        </div>
      </main>
    </div>
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
