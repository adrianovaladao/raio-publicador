import Link from "next/link";
import { RaioLockup } from "@/components/logo/RaioLockup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Raio Publicador",
  description: "Termos e condições de uso da plataforma Raio Publicador.",
};

export default function TermosPage() {
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
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", marginBottom: 16, lineHeight: 1.2 }}>Termos de Uso</h1>
        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.7, marginBottom: 40, borderLeft: "3px solid #FAB500", paddingLeft: 16 }}>
          Estes Termos regem o uso da plataforma Raio Publicador. Leia com atenção — ao criar uma conta ou assinar um plano, você concorda com tudo o que está aqui. Se tiver dúvidas, escreva para <a href="mailto:adrianovaladao@raiopublicador.com.br" style={{ color: "#1a1a1a", fontWeight: 600 }}>adrianovaladao@raiopublicador.com.br</a> antes de prosseguir.
        </p>

        <Section title="1. O que é o Raio Publicador">
          <p>O Raio Publicador é uma plataforma SaaS brasileira de publicação de releases e branded content, operada por <strong>RAIO PUBLICADOR TECNOLOGIA DE COMUNICACAO LTDA</strong> (CNPJ 68.372.169/0001-06, São Paulo &ndash; SP). Por meio de um sistema de créditos, marcas e profissionais de comunicação criam, agendam e publicam releases em portais jornalísticos parceiros.</p>
          <p>O Raio não é uma agência de relações públicas nem um veículo de imprensa. Somos a infraestrutura tecnológica entre quem quer publicar e os portais que publicam.</p>
        </Section>

        <Section title="2. Quem pode usar">
          <p>A plataforma é destinada exclusivamente a pessoas físicas maiores de 18 anos e a pessoas jurídicas regularmente constituídas no Brasil. Ao criar uma conta, você declara que atende a esses requisitos e que as informações fornecidas no cadastro são verdadeiras.</p>
          <p>Uma conta é pessoal e intransferível. Você pode convidar membros de equipe (editores e revisores) dentro dos limites do seu plano, mas a titularidade da assinatura e a responsabilidade pelo conteúdo publicado são sempre do titular da conta.</p>
        </Section>

        <Section title="3. O sistema de créditos">
          <p>O acesso às funcionalidades de publicação é medido em créditos. Cada plano concede uma cota mensal de créditos que é renovada automaticamente a cada ciclo de cobrança. Os créditos representam a capacidade de distribuição contratada &mdash; não são moeda virtual, não têm valor em dinheiro e não podem ser transferidos entre contas.</p>
          <p><strong>Créditos não utilizados expiram ao final do ciclo mensal</strong> e não são acumulados, transferidos ou reembolsados. Créditos avulsos, quando disponíveis na plataforma, seguem as condições descritas na própria oferta.</p>
          <p>A quantidade de créditos consumida por publicação varia conforme o portal de destino e está visível na etapa de seleção de veículos antes de qualquer confirmação.</p>
        </Section>

        <Section title="4. Planos, pagamento e renovação">
          <p>Os planos disponíveis, seus preços e os créditos incluídos estão descritos na página de planos em <strong>raiopublicador.com.br</strong>. O pagamento pode ser realizado via:</p>
          <ul>
            <li><strong>Cartão de crédito ou boleto bancário</strong> &mdash; processados pelo Stripe</li>
            <li><strong>Pix</strong> &mdash; pagamento manual com confirmação pela nossa equipe</li>
          </ul>
          <p>A assinatura é <strong>renovada automaticamente</strong> ao término de cada período mensal, exceto em caso de cancelamento pelo Usuário antes do próximo vencimento. O valor cobrado na renovação é o vigente no momento do ciclo, podendo ser reajustado com aviso prévio de 30 dias.</p>
        </Section>

        <Section title="5. Garantia de satisfação e reembolso">
          <p>Acreditamos no que entregamos. Por isso, e em conformidade com o Art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), garantimos reembolso integral para cancelamentos realizados em até <strong>7 dias corridos</strong> após a contratação, desde que <strong>nenhum crédito do período tenha sido utilizado</strong>.</p>
          <p>Após o prazo de 7 dias ou com qualquer crédito consumido, o cancelamento é processado sem reembolso: o acesso e os créditos remanescentes do ciclo atual permanecem ativos até o fim do período pago, e a renovação automática é interrompida.</p>
          <p>Pagamentos realizados via boleto bancário que sejam elegíveis a reembolso são devolvidos por Pix, mediante informação da chave pelo Usuário. Pagamentos via Pix também são reembolsados por Pix. Não reembolsamos tarifas de processamento bancário cobradas diretamente pelas instituições financeiras.</p>
        </Section>

        <Section title="6. Responsabilidade pelo conteúdo">
          <p>O Usuário é o único e exclusivo responsável por tudo que escreve, edita e submete à publicação na plataforma. Ao enviar um release, você declara que o conteúdo:</p>
          <ul>
            <li>É verdadeiro, preciso e passível de verificação</li>
            <li>Não viola direitos autorais, marcas ou qualquer outro direito de propriedade intelectual de terceiros</li>
            <li>Não contém publicidade enganosa, afirmações falsas ou desinformação</li>
            <li>Não é de natureza ofensiva, discriminatória ou ilegal sob qualquer perspectiva</li>
            <li>Está em conformidade com as diretrizes editoriais dos portais selecionados</li>
            <li>Respeita o Código de Ética dos Jornalistas Brasileiros e as normas do CONAR quando aplicáveis</li>
          </ul>
          <p>O Raio reserva-se o direito de recusar, suspender ou remover qualquer conteúdo que viole essas condições, a critério exclusivo da equipe editorial, sem obrigação de reembolso (exceto dentro do prazo legal de arrependimento).</p>
        </Section>

        <Section title="7. Inteligência artificial na plataforma">
          <p>O Raio oferece recursos de geração e reescrita de texto assistidos por IA. Esses recursos são ferramentas de apoio à criação &mdash; o conteúdo gerado pela IA é um ponto de partida, não uma entrega finalizada.</p>
          <p><strong>O Usuário é responsável por revisar, editar e aprovar todo conteúdo antes do envio</strong>, independentemente de ter utilizado ou não os recursos de IA. O Raio não garante que textos gerados automaticamente sejam precisos, completos ou adequados para publicação sem revisão humana.</p>
          <p>Os dados inseridos nos formulários de briefing para geração de IA são usados exclusivamente para produzir o conteúdo solicitado e não são utilizados para treinar modelos de linguagem externos.</p>
        </Section>

        <Section title="8. Revisão editorial e critérios de publicação">
          <p>Todo release submetido passa por uma análise editorial antes de ser encaminhado aos portais parceiros. A revisão verifica conformidade com as diretrizes desta plataforma e dos veículos selecionados &mdash; não é uma prestação de serviço de edição nem uma garantia de aprovação.</p>
          <p>Em caso de não conformidade, o release pode ser devolvido para ajustes (&ldquo;precisa de revisão&rdquo;) ou cancelado pela equipe editorial. Releases cancelados têm os créditos devolvidos ao saldo do Usuário. O Raio não garante a aceitação de conteúdo por nenhum portal parceiro específico &mdash; a decisão final de publicar é sempre do veículo.</p>
        </Section>

        <Section title="9. Marcas, equipes e dados de conta">
          <p>Cada conta pode cadastrar marcas e convidar membros de equipe conforme os limites do plano contratado. O titular da conta responde integralmente por todas as ações realizadas pelos membros da equipe que foram por ele convidados.</p>
          <p>Em caso de cancelamento da assinatura com reembolso integral (dentro de 7 dias), todas as marcas, releases e dados associados à conta são removidos permanentemente. Cancelamentos fora do prazo de reembolso mantêm o acesso aos dados até o fim do ciclo pago.</p>
        </Section>

        <Section title="10. Propriedade intelectual">
          <p>O Usuário mantém todos os direitos autorais sobre o conteúdo original que produz. Ao submeter um release, você concede ao Raio uma licença limitada, não exclusiva e gratuita para processar, revisar e encaminhar esse conteúdo aos portais selecionados, conforme suas instruções.</p>
          <p>A plataforma Raio Publicador &mdash; interface, código, marca, logotipo, metodologia editorial e demais elementos &mdash; é propriedade exclusiva da empresa e está protegida pela legislação brasileira de propriedade intelectual. É proibida qualquer reprodução, adaptação ou engenharia reversa sem autorização expressa e por escrito.</p>
        </Section>

        <Section title="11. Suspensão e encerramento de conta">
          <p>O Raio pode suspender ou encerrar o acesso de qualquer Usuário, sem aviso prévio, em casos de: violação destes Termos, uso fraudulento da plataforma, tentativa de burla ao sistema de créditos, publicação de conteúdo ilegal ou qualquer comportamento que prejudique a integridade do serviço ou de outros usuários.</p>
          <p>O Usuário pode encerrar sua conta a qualquer momento pelo painel de configurações ou por solicitação ao suporte.</p>
        </Section>

        <Section title="12. Limitação de responsabilidade">
          <p>O Raio não se responsabiliza por:</p>
          <ul>
            <li>Decisões editoriais dos portais parceiros quanto à aceitação, alteração ou remoção de conteúdo após a publicação</li>
            <li>Conteúdo produzido, revisado ou aprovado pelo Usuário, com ou sem auxílio da IA</li>
            <li>Interrupções temporárias do serviço por manutenção programada, falhas técnicas, ataques cibernéticos ou eventos de força maior</li>
            <li>Danos indiretos, lucros cessantes ou perda de oportunidades de negócio decorrentes do uso ou da indisponibilidade da plataforma</li>
          </ul>
          <p>Quando aplicável, nossa responsabilidade está limitada ao valor pago pelo Usuário nos 3 meses anteriores ao evento que originou a reclamação.</p>
        </Section>

        <Section title="13. Atualizações nestes Termos">
          <p>Podemos atualizar estes Termos a qualquer momento. Alterações que impactem direitos ou obrigações do Usuário serão comunicadas por e-mail com antecedência mínima de 10 dias. O uso continuado da plataforma após a data de vigência das novas condições equivale à aceitação integral das mudanças.</p>
        </Section>

        <Section title="14. Lei aplicável e foro">
          <p>Estes Termos são regidos exclusivamente pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo &ndash; SP para dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro foro, por mais privilegiado que seja.</p>
          <p>Dúvidas ou solicitações: <a href="mailto:adrianovaladao@raiopublicador.com.br" style={{ color: "#1a1a1a", fontWeight: 600 }}>adrianovaladao@raiopublicador.com.br</a></p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e8e8e4", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/privacidade" style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>Política de Privacidade →</Link>
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
