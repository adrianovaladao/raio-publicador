import Link from "next/link";
import { RaioLockup } from "@/components/logo/RaioLockup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
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
          Estes Termos regem o uso da plataforma Raio Publicador. Leia com atenção — ao criar uma conta ou assinar um plano, você concorda com tudo o que está aqui. Se tiver dúvidas, escreva para <a href="mailto:raiopublicador@gmail.com" style={{ color: "#1a1a1a", fontWeight: 600 }}>raiopublicador@gmail.com</a> antes de prosseguir.
        </p>

        <Section title="1. O que é o Raio Publicador">
          <p>O Raio Publicador é uma plataforma SaaS brasileira de publicação de releases e branded content, operada por <strong>RAIO PUBLICADOR TECNOLOGIA DE COMUNICACAO LTDA</strong> (CNPJ 68.372.169/0001-06, São Paulo &ndash; SP). Por meio de um sistema de créditos, marcas e profissionais de comunicação criam, agendam e publicam releases em portais jornalísticos parceiros.</p>
          <p>O Raio Publicador não é uma agência de relações públicas nem um veículo de imprensa. A plataforma funciona como uma infraestrutura tecnológica que conecta marcas, empresas e profissionais aos portais parceiros para publicação de conteúdo patrocinado, mediante contratação por créditos e observância das regras editoriais aplicáveis.</p>
          <p>A publicação é garantida para conteúdos que atendam às diretrizes editoriais e do portal selecionado. Caso, após a aprovação do conteúdo pelo Raio Publicador, a publicação se torne inviável no portal escolhido por motivo alheio ao Usuário, serão oferecidas, conforme o caso, a restituição dos créditos utilizados ou alternativas de publicação disponíveis na plataforma.</p>
        </Section>

        <Section title="2. Quem pode usar">
          <p>A plataforma é destinada exclusivamente a pessoas físicas maiores de 18 anos e a pessoas jurídicas regularmente constituídas no Brasil. Ao criar uma conta, você declara que atende a esses requisitos e que as informações fornecidas no cadastro são verdadeiras.</p>
          <p>Uma conta é pessoal e intransferível. Você pode convidar membros de equipe (editores e revisores) dentro dos limites do seu plano, mas a titularidade da assinatura e a responsabilidade pelo conteúdo publicado são sempre do titular da conta.</p>
        </Section>

        <Section title="3. O sistema de créditos">
          <p>O acesso às funcionalidades de publicação é medido em créditos. Cada plano concede uma cota mensal de créditos que é renovada automaticamente a cada ciclo de cobrança. Os créditos representam a capacidade de distribuição contratada &mdash; não são moeda virtual, não têm valor em dinheiro e não podem ser transferidos entre contas.</p>
          <p><strong>Créditos não utilizados expiram ao final do ciclo mensal</strong> e não são acumulados, transferidos ou reembolsados. Créditos avulsos, quando disponíveis na plataforma, seguem as condições descritas na própria oferta.</p>
          <p>A quantidade de créditos consumida por publicação varia conforme o portal de destino e está visível na etapa de seleção de veículos antes de qualquer confirmação. Créditos promocionais, vouchers, bonificações, cortesias ou créditos concedidos gratuitamente poderão possuir regras e prazos de validade próprios. Esses créditos não possuem valor monetário, não podem ser convertidos em dinheiro e não são reembolsáveis.</p>
          <p>O consumo dos créditos ocorre de acordo com o valor indicado para cada portal no momento da contratação da publicação. Alterações futuras na quantidade de créditos exigida por determinado portal não afetarão publicações já confirmadas.</p>
        </Section>

        <Section title="4. Planos, pagamento e renovação">
          <p>Os planos disponíveis, seus preços e os créditos incluídos estão descritos na página de planos em <strong>raiopublicador.com.br</strong>.</p>
          <p>Os meios de pagamento disponíveis serão aqueles apresentados ao Usuário no momento da contratação e poderão variar conforme o plano, valor ou modalidade escolhida.</p>
          <p>A assinatura é <strong>renovada automaticamente</strong> ao término de cada período mensal, exceto em caso de cancelamento pelo Usuário antes do próximo vencimento. O valor cobrado na renovação será o vigente para o plano contratado no momento do novo ciclo.</p>
          <p>Eventuais reajustes serão comunicados previamente ao Usuário.</p>
        </Section>

        <Section title="5. Direito de arrependimento, cancelamento e reembolso">
          <p>Quando aplicável uma relação de consumo, será assegurado ao Usuário o direito de arrependimento nos termos do artigo 49 do Código de Defesa do Consumidor e demais normas aplicáveis. Fora das hipóteses de reembolso obrigatório previstas em lei, valores correspondentes a créditos já utilizados em serviços efetivamente prestados ou publicações já realizadas não serão reembolsados.</p>
          <p>O cancelamento da assinatura interrompe as renovações futuras. Salvo nas hipóteses de reembolso integral previstas em lei, o Usuário poderá utilizar os créditos remanescentes e acessar a plataforma até o término do período já contratado.</p>
          <p>Quando houver reembolso, a devolução será realizada preferencialmente pelo mesmo meio utilizado no pagamento ou por outro meio acordado com o Usuário, observados os prazos e procedimentos das instituições financeiras envolvidas.</p>
        </Section>

        <Section title="6. Responsabilidade pelo conteúdo">
          <p>O Usuário é o único e exclusivo responsável por tudo que escreve, edita e submete à publicação na plataforma. Ao enviar um release, você declara que o conteúdo:</p>
          <ul>
            <li>É verdadeiro, preciso e passível de verificação</li>
            <li>Não viola direitos autorais, marcas ou qualquer outro direito de propriedade intelectual de terceiros</li>
            <li>Não contém publicidade enganosa, afirmações falsas ou desinformação</li>
            <li>Não é de natureza ofensiva, discriminatória ou ilegal sob qualquer perspectiva</li>
            <li>Está em conformidade com a legislação aplicável, com as normas de autorregulamentação publicitária, quando cabíveis, e com as diretrizes editoriais do Raio Publicador e dos portais parceiros</li>
          </ul>
          <p>O Raio Publicador reserva-se o direito de recusar, suspender ou remover qualquer conteúdo que viole essas condições, a critério exclusivo da equipe editorial, sem obrigação de reembolso (exceto dentro do prazo legal de arrependimento).</p>
          <p>O Usuário declara possuir todas as autorizações, licenças e direitos necessários para utilização de nomes, marcas, imagens, fotografias, depoimentos, dados, pesquisas, cases, declarações e demais conteúdos de terceiros eventualmente incluídos no material.</p>
          <p>As publicações também estão sujeitas ao <strong>Manual para Envio de Conteúdo de Branded Content do Raio Publicador</strong>, disponível na plataforma, que integra estes Termos para fins de definição das regras e critérios editoriais aplicáveis às publicações.</p>
        </Section>

        <Section title="7. Inteligência artificial na plataforma">
          <p>O Raio Publicador oferece recursos de geração e reescrita de texto assistidos por IA. Esses recursos são ferramentas de apoio à criação e o conteúdo gerado pela IA é um ponto de partida, não uma entrega finalizada. O Usuário é responsável por revisar, editar e aprovar todo conteúdo antes do envio, independentemente de ter utilizado ou não os recursos de IA. O Raio Publicador não garante que textos gerados automaticamente sejam precisos, completos ou adequados para publicação sem revisão humana.</p>
          <p>O tratamento das informações inseridas nos recursos de inteligência artificial observará a Política de Privacidade do Raio Publicador e, quando aplicável, as condições dos fornecedores tecnológicos utilizados pela plataforma.</p>
          <p>O Usuário não deverá inserir nos recursos de inteligência artificial informações confidenciais, segredos comerciais, dados pessoais ou informações de terceiros sem possuir autorização ou base legal adequada para seu tratamento.</p>
        </Section>

        <Section title="8. Revisão editorial e publicação garantida">
          <p>Todo conteúdo submetido à plataforma passa por análise editorial antes de ser encaminhado ao portal selecionado. Essa análise tem como objetivo verificar a conformidade do material com estes Termos, com o Manual para Envio de Conteúdo de Branded Content e com as diretrizes do veículo escolhido. Caso sejam necessárias adequações, o conteúdo poderá ser devolvido ao Usuário para revisão antes da publicação.</p>
          <p>A publicação é garantida para conteúdos aprovados que atendam às diretrizes aplicáveis. Caso a publicação se torne inviável no portal escolhido por circunstância alheia ao Usuário, o Raio Publicador poderá oferecer a restituição integral dos créditos utilizados naquela publicação ou, mediante concordância do Usuário, a possibilidade de publicação em outro portal disponível.</p>
          <p>Os portais parceiros poderão realizar ajustes técnicos, editoriais ou de formatação necessários à publicação, incluindo adequações em título, subtítulo, intertítulos, imagens, links e disposição do conteúdo, desde que não alterem substancialmente o sentido das informações apresentadas.</p>
          <p>A garantia de publicação não representa garantia de audiência, número de acessos, repercussão, compartilhamentos, geração de negócios ou qualquer outro resultado decorrente da publicação.</p>
        </Section>

        <Section title="9. Permanência, indexação e disponibilidade das publicações">
          <p>A publicação do conteúdo não implica garantia de permanência por prazo indeterminado no portal parceiro. A manutenção, arquivamento, atualização, desindexação ou eventual retirada do conteúdo poderá estar sujeita às políticas e decisões editoriais ou técnicas do respectivo veículo.</p>
          <p>O Raio Publicador também não garante a indexação, posicionamento ou permanência da publicação em mecanismos de busca, Google News, plataformas de inteligência artificial, redes sociais, agregadores de notícias ou quaisquer outros sistemas de recomendação.</p>
          <p>Eventuais alterações na estrutura, domínio, tecnologia, política editorial ou funcionamento dos portais parceiros que ocorram após a publicação e que estejam fora do controle do Raio Publicador não caracterizam descumprimento da obrigação de publicação.</p>
        </Section>

        <Section title="10. Alterações e retirada após a publicação">
          <p>Após a publicação, solicitações de correção, alteração, substituição de imagens, inclusão ou remoção de links ou retirada integral do conteúdo estarão sujeitas à análise e às regras do portal parceiro. O Raio Publicador realizará os esforços razoáveis para encaminhar essas solicitações, mas não garante que alterações ou retiradas possam ser realizadas após a publicação, nem estabelece prazo para sua execução quando dependerem exclusivamente do veículo.</p>
          <p>Alterações substanciais solicitadas pelo Usuário após a publicação poderão ser consideradas uma nova publicação e estar sujeitas ao consumo de novos créditos.</p>
        </Section>

        <Section title="11. Marcas, equipes e dados de conta">
          <p>Cada conta pode cadastrar marcas e convidar membros de equipe conforme os limites do plano contratado. O titular da conta responde integralmente por todas as ações realizadas pelos membros da equipe que foram por ele convidados.</p>
          <p>Após o encerramento da conta, os dados pessoais e demais informações associadas poderão ser eliminados, anonimizados ou conservados de acordo com os critérios e prazos previstos na Política de Privacidade, ressalvadas as hipóteses de conservação permitidas ou exigidas pela legislação.</p>
        </Section>

        <Section title="12. Proteção de dados pessoais">
          <p>O tratamento de dados pessoais realizado pelo Raio observará a legislação aplicável, especialmente a Lei nº 13.709/2018 &mdash; Lei Geral de Proteção de Dados Pessoais (LGPD).</p>
          <p>As informações sobre coleta, utilização, armazenamento, compartilhamento, segurança, retenção e direitos dos titulares estão descritas na <Link href="/privacidade" style={{ color: "#1a1a1a", fontWeight: 600 }}>Política de Privacidade</Link> disponível na plataforma, que integra estes Termos para todos os fins aplicáveis.</p>
          <p>Ao utilizar a plataforma, o Usuário declara estar ciente de que determinados dados poderão ser tratados por fornecedores tecnológicos necessários ao funcionamento do serviço, observadas as condições previstas na Política de Privacidade.</p>
        </Section>

        <Section title="13. Propriedade intelectual">
          <p>O Usuário mantém todos os direitos autorais sobre o conteúdo original que produz. Ao submeter um release, você concede ao Raio Publicador uma licença limitada, não exclusiva e gratuita para processar, revisar e encaminhar esse conteúdo aos portais selecionados, conforme suas instruções.</p>
          <p>A plataforma Raio Publicador &mdash; interface, código, marca, logotipo, metodologia editorial e demais elementos &mdash; é propriedade exclusiva da empresa e está protegida pela legislação brasileira de propriedade intelectual. É proibida qualquer reprodução, adaptação ou engenharia reversa sem autorização expressa e por escrito.</p>
          <p>A licença concedida pelo Usuário compreende também as utilizações tecnicamente necessárias à publicação, hospedagem, reprodução, distribuição e manutenção do conteúdo nos portais selecionados, inclusive durante o período em que a publicação permanecer disponível, arquivada ou acessível no respectivo portal.</p>
        </Section>

        <Section title="14. Suspensão e encerramento de conta">
          <p>O Raio pode suspender ou encerrar o acesso de qualquer Usuário, sem aviso prévio, em casos de: violação destes Termos, uso fraudulento da plataforma, tentativa de burla ao sistema de créditos, publicação de conteúdo ilegal ou qualquer comportamento que prejudique a integridade do serviço ou de outros usuários.</p>
          <p>O Usuário pode encerrar sua conta a qualquer momento pelo painel de configurações ou por solicitação ao suporte.</p>
          <p>A suspensão ou encerramento motivado por fraude, ilegalidade, violação de direitos de terceiros ou descumprimento grave destes Termos não gera direito ao reembolso de créditos já utilizados ou de serviços já prestados, ressalvados os direitos assegurados pela legislação aplicável.</p>
        </Section>

        <Section title="15. Limitação de responsabilidade">
          <p>O Raio não se responsabiliza por:</p>
          <ul>
            <li>Decisões editoriais ou técnicas dos portais parceiros relacionadas a alterações, manutenção, arquivamento ou remoção do conteúdo após sua publicação</li>
            <li>Conteúdo produzido, revisado ou aprovado pelo Usuário, com ou sem auxílio da IA</li>
            <li>Interrupções temporárias do serviço por manutenção programada, falhas técnicas, ataques cibernéticos ou eventos de força maior</li>
            <li>Danos indiretos, lucros cessantes ou perda de oportunidades de negócio decorrentes do uso ou da indisponibilidade da plataforma</li>
          </ul>
          <p>Na máxima extensão permitida pela legislação aplicável e ressalvadas as hipóteses em que a limitação de responsabilidade seja vedada por lei, a responsabilidade total do Raio Publicador decorrente destes Termos estará limitada ao valor efetivamente pago pelo Usuário nos três meses anteriores ao evento que originou a reclamação.</p>
        </Section>

        <Section title="16. Disponibilidade da plataforma e dos portais parceiros">
          <p>O Raio poderá realizar manutenções, atualizações e intervenções técnicas necessárias ao funcionamento da plataforma.</p>
          <p>A disponibilidade dos portais parceiros poderá sofrer alterações independentemente da vontade do Raio Publicador. Veículos poderão ser temporária ou definitivamente incluídos, suspensos ou removidos da plataforma. Caso um portal deixe de estar disponível após a confirmação de uma publicação ainda não realizada, o Usuário poderá receber de volta os créditos correspondentes ou escolher, quando disponível e mediante concordância, outro portal compatível.</p>
        </Section>

        <Section title="17. Atualizações nestes Termos">
          <p>Podemos atualizar estes Termos a qualquer momento. Alterações que impactem direitos ou obrigações do Usuário serão comunicadas por e-mail com antecedência mínima de 10 dias, salvo quando a alteração decorrer de obrigação legal, regulatória ou necessidade urgente de segurança.</p>
          <p>As novas condições serão aplicáveis a partir da data de vigência informada na comunicação, respeitados os direitos adquiridos e a legislação aplicável.</p>
        </Section>

        <Section title="18. Lei aplicável e foro">
          <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo &ndash; SP para dirimir controvérsias decorrentes destes Termos, ressalvadas as hipóteses em que a legislação aplicável assegure ao Usuário o direito de ajuizar demanda em foro diverso, especialmente nas relações de consumo.</p>
        </Section>

        <Section title="19. Atendimento e contato">
          <p>Dúvidas, solicitações, comunicações relacionadas à conta, exercício de direitos ou questões referentes a estes Termos poderão ser encaminhadas pelos canais oficiais de atendimento disponibilizados na plataforma ou pelo e-mail: <a href="mailto:raiopublicador@gmail.com" style={{ color: "#1a1a1a", fontWeight: 600 }}>raiopublicador@gmail.com</a></p>
          <p>Para fins de comunicação relacionada à conta, o Usuário é responsável por manter seus dados cadastrais e endereço eletrônico atualizados.</p>
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
