import Link from "next/link";
import { RaioLockup } from "@/components/logo/RaioLockup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Raio Publicador",
  description: "Leia os termos e condições de uso da plataforma Raio Publicador.",
};

export default function TermosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f7", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#000", padding: "20px 0" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center" }}>
            <RaioLockup height={28} variant="dark" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Última atualização: agosto de 2026</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", marginBottom: 32, lineHeight: 1.2 }}>Termos de Uso</h1>

        <Section title="1. Aceitação dos Termos">
          <p>Ao acessar ou utilizar a plataforma Raio Publicador, operada por <strong>RAIO PUBLICADOR TECNOLOGIA DE COMUNICACAO LTDA</strong>, CNPJ 68.372.169/0001-06, com sede em São Paulo &ndash; SP (&ldquo;Raio&rdquo;, &ldquo;nós&rdquo; ou &ldquo;empresa&rdquo;), você (&ldquo;Usuário&rdquo;) concorda integralmente com estes Termos de Uso.</p>
          <p>Se você não concordar com qualquer disposição destes termos, não utilize a plataforma.</p>
        </Section>

        <Section title="2. Descrição do Serviço">
          <p>O Raio Publicador é uma plataforma SaaS de publicação de releases e branded content. Por meio de um sistema de créditos, o Usuário pode criar, agendar e publicar releases jornalísticos em portais parceiros previamente selecionados.</p>
          <p>Os serviços incluem:</p>
          <ul>
            <li>Criação e edição de releases com suporte a IA</li>
            <li>Seleção e publicação em portais parceiros</li>
            <li>Gestão de marcas e equipes</li>
            <li>Painel de acompanhamento de publicações</li>
          </ul>
        </Section>

        <Section title="3. Cadastro e Conta">
          <p>Para utilizar a plataforma, o Usuário deve criar uma conta com informações verdadeiras, precisas e atualizadas. O Usuário é integralmente responsável pela confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
          <p>O Raio reserva-se o direito de encerrar contas que contenham informações falsas ou que violem estes Termos.</p>
        </Section>

        <Section title="4. Planos e Pagamento">
          <p>O acesso à plataforma está condicionado à contratação de um plano de assinatura pago. Os valores, funcionalidades e limites de cada plano estão descritos na página de planos em <strong>raiopublicador.com.br</strong>.</p>
          <p>O pagamento pode ser realizado via cartão de crédito, boleto bancário ou Pix. A assinatura é renovada automaticamente ao final de cada período contratado, exceto no caso de cancelamento pelo Usuário.</p>
        </Section>

        <Section title="5. Política de Reembolso">
          <p>Em conformidade com o Art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), o Usuário que contratar um plano por meio eletrônico tem direito ao arrependimento e reembolso integral em até <strong>7 (sete) dias corridos</strong> a partir da data de contratação, desde que <strong>nenhum crédito do período tenha sido utilizado</strong>.</p>
          <p>Após o prazo de 7 dias ou com créditos utilizados, o cancelamento encerra a renovação automática, mantendo o acesso ativo até o final do ciclo vigente, sem direito a reembolso proporcional.</p>
        </Section>

        <Section title="6. Conteúdo Publicado">
          <p>O Usuário é o único e exclusivo responsável pelo conteúdo dos releases que cria e submete à publicação. Ao utilizar a plataforma, o Usuário declara e garante que o conteúdo:</p>
          <ul>
            <li>É verdadeiro, preciso e não contém informações enganosas ou fraudulentas</li>
            <li>Não infringe direitos autorais, marcas registradas ou outros direitos de propriedade intelectual de terceiros</li>
            <li>Não é de natureza difamatória, discriminatória, ofensiva ou ilegal</li>
            <li>Não contém publicidade enganosa conforme definida pelo CONAR e pela legislação consumerista</li>
            <li>Está em conformidade com as diretrizes editoriais dos portais parceiros</li>
          </ul>
          <p>O Raio reserva-se o direito de recusar ou remover qualquer conteúdo que viole estas diretrizes, sem obrigação de reembolso, exceto quando o cancelamento ocorrer dentro do prazo legal de arrependimento.</p>
        </Section>

        <Section title="7. Créditos">
          <p>Os créditos são a unidade de consumo da plataforma. Cada plano concede uma quantidade mensal de créditos que podem ser usados para publicar releases em portais parceiros. Os créditos não utilizados ao final do ciclo mensal expiram e não são acumulados ou reembolsados.</p>
          <p>Créditos avulsos podem ser adquiridos separadamente conforme disponibilidade na plataforma.</p>
        </Section>

        <Section title="8. Propriedade Intelectual">
          <p>Todos os direitos de propriedade intelectual relacionados à plataforma Raio Publicador, incluindo interface, marca, logotipo, código-fonte e materiais desenvolvidos pela empresa, pertencem exclusivamente ao Raio.</p>
          <p>O Usuário mantém todos os direitos sobre o conteúdo original que produz na plataforma, concedendo ao Raio uma licença limitada, não exclusiva e intransferível para processar e publicar esse conteúdo conforme as instruções do próprio Usuário.</p>
        </Section>

        <Section title="9. Limitação de Responsabilidade">
          <p>O Raio não se responsabiliza por:</p>
          <ul>
            <li>Decisões editoriais dos portais parceiros quanto à aceitação ou rejeição de releases</li>
            <li>Conteúdo produzido pelo Usuário com auxílio das ferramentas de IA da plataforma</li>
            <li>Danos indiretos, lucros cessantes ou danos emergentes decorrentes do uso ou impossibilidade de uso da plataforma</li>
            <li>Interrupções temporárias do serviço por manutenção, falhas técnicas ou motivos de força maior</li>
          </ul>
        </Section>

        <Section title="10. Suspensão e Encerramento">
          <p>O Raio pode suspender ou encerrar o acesso do Usuário, sem aviso prévio, em caso de violação destes Termos, uso fraudulento, atividade ilegal ou qualquer comportamento que prejudique a plataforma ou outros usuários.</p>
        </Section>

        <Section title="11. Alterações nos Termos">
          <p>O Raio pode modificar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por e-mail ou notificação na plataforma com antecedência mínima de 10 dias. O uso continuado da plataforma após a vigência das alterações implica aceitação dos novos termos.</p>
        </Section>

        <Section title="12. Lei Aplicável e Foro">
          <p>Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de São Paulo – SP para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
        </Section>

        <Section title="13. Contato">
          <p>Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: <a href="mailto:adrianovaladao@raiopublicador.com.br" style={{ color: "#1a1a1a", fontWeight: 600 }}>adrianovaladao@raiopublicador.com.br</a></p>
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
