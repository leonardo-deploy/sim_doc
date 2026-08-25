import { Code2, Mail, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface ContentPageProps {
  eyebrow: string;
  title: string;
  introduction: string;
  children: ReactNode;
}

function ContentPage({ eyebrow, title, introduction, children }: ContentPageProps) {
  return (
    <main className="content-page">
      <header className="content-hero">
        <div className="page-shell content-hero-inner">
          <span className="section-kicker section-kicker-light">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{introduction}</p>
        </div>
      </header>
      <article className="page-shell prose-card">{children}</article>
    </main>
  );
}

export function AboutPage() {
  return (
    <ContentPage
      eyebrow="SOBRE O PROJETO"
      title="Tecnologia útil, simples e respeitosa"
      introduction="O Converge PDF nasceu para tornar documentos mais fáceis de editar sem transformar privacidade em uma complicação."
    >
      <h2>O que fazemos</h2>
      <p>
        O Converge PDF transforma textos de arquivos PDF e fotos de documentos em um arquivo
        Word editável. A ferramenta combina leitura de PDF e reconhecimento óptico de caracteres
        (OCR) em uma experiência direta, acessível no computador ou no celular.
      </p>
      <h2>Nosso princípio</h2>
      <p>
        Documentos podem conter informações pessoais, profissionais ou financeiras. Por isso,
        projetamos a conversão para acontecer localmente no navegador sempre que você usa a
        ferramenta. O arquivo não precisa ser enviado para uma infraestrutura do Converge PDF.
      </p>
      <div className="prose-highlight">
        <ShieldCheck size={28} />
        <div><strong>Privacidade por arquitetura</strong><p>Menos dados coletados significa menos dados expostos.</p></div>
      </div>
      <h2>Projeto em evolução</h2>
      <p>
        O reconhecimento automático pode cometer erros, especialmente em imagens desfocadas,
        textos manuscritos ou documentos com diagramação complexa. Continuaremos aprimorando a
        experiência, sempre preservando a facilidade de uso.
      </p>
    </ContentPage>
  );
}

export function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="TRANSPARÊNCIA"
      title="Política de privacidade"
      introduction="Esta política explica de forma clara o que acontece com seus documentos e dados ao usar o Converge PDF."
    >
      <p className="prose-updated">Última atualização: 25 de agosto de 2026.</p>
      <h2>1. Processamento dos documentos</h2>
      <p>
        Os arquivos escolhidos para conversão são processados localmente pelo navegador. O
        Converge PDF não recebe, armazena ou mantém cópias do conteúdo desses arquivos em seus
        servidores. Ao fechar ou atualizar a página, o resultado que não foi salvo por você é
        descartado pelo navegador.
      </p>
      <h2>2. Dados de navegação</h2>
      <p>
        A hospedagem pode registrar informações técnicas necessárias para segurança e entrega do
        site, como endereço IP, tipo de navegador, data e horário do acesso. Esses registros são
        administrados pelos provedores de infraestrutura conforme suas próprias políticas.
      </p>
      <h2>3. Publicidade e cookies</h2>
      <p>
        Quando a publicidade estiver habilitada, parceiros como o Google AdSense poderão usar
        cookies ou tecnologias semelhantes para exibir e medir anúncios. O carregamento desses
        anúncios depende da preferência informada no aviso de privacidade. Você pode recusar e
        continuar usando o conversor.
      </p>
      <h2>4. Armazenamento local</h2>
      <p>
        O site pode guardar no próprio navegador apenas a sua preferência sobre anúncios. Essa
        informação não contém o conteúdo dos documentos convertidos e pode ser apagada nas
        configurações do navegador.
      </p>
      <h2>5. Seus direitos</h2>
      <p>
        Você pode solicitar informações, correção ou exclusão de eventuais dados pessoais sob
        nossa responsabilidade, de acordo com a Lei Geral de Proteção de Dados (LGPD). Consulte a
        página de contato para falar conosco.
      </p>
      <h2>6. Alterações desta política</h2>
      <p>
        Esta política poderá ser atualizada para refletir mudanças no serviço ou na legislação. A
        data da versão mais recente será sempre informada nesta página.
      </p>
    </ContentPage>
  );
}

export function TermsPage() {
  return (
    <ContentPage
      eyebrow="USO RESPONSÁVEL"
      title="Termos de uso"
      introduction="Ao utilizar o Converge PDF, você concorda com as condições abaixo."
    >
      <p className="prose-updated">Última atualização: 25 de agosto de 2026.</p>
      <h2>1. Finalidade do serviço</h2>
      <p>
        O Converge PDF oferece ferramentas automatizadas para extrair texto de PDFs e imagens e
        gerar documentos editáveis. O serviço não substitui uma revisão humana.
      </p>
      <h2>2. Precisão da conversão</h2>
      <p>
        OCR e extração de PDF podem apresentar falhas em nomes, números, símbolos, tabelas,
        assinaturas, textos manuscritos ou diagramações complexas. Você é responsável por revisar
        o conteúdo antes de utilizá-lo, especialmente em contextos jurídicos, médicos, financeiros
        ou acadêmicos.
      </p>
      <h2>3. Responsabilidade pelos arquivos</h2>
      <p>
        Você declara ter autorização para processar os documentos selecionados e concorda em não
        usar o serviço para atividades ilícitas, violação de direitos autorais ou tratamento não
        autorizado de dados de terceiros.
      </p>
      <h2>4. Disponibilidade</h2>
      <p>
        A ferramenta é fornecida conforme disponível. Poderemos realizar melhorias, alterar
        limites ou interromper temporariamente recursos para manutenção e segurança.
      </p>
      <h2>5. Propriedade intelectual</h2>
      <p>
        Você mantém os direitos sobre seus documentos e sobre o texto extraído. A marca, o design
        e o código próprio do Converge PDF permanecem protegidos por seus respectivos direitos.
      </p>
      <h2>6. Alterações</h2>
      <p>
        Estes termos podem ser atualizados. O uso continuado do serviço após uma alteração
        representa a aceitação da versão vigente.
      </p>
    </ContentPage>
  );
}

export function ContactPage() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
  return (
    <ContentPage
      eyebrow="FALE CONOSCO"
      title="Contato"
      introduction="Dúvidas, sugestões ou relatos de problema ajudam o Converge PDF a melhorar."
    >
      <h2>Como entrar em contato</h2>
      <p>
        Escolha um dos canais abaixo. Não anexe documentos pessoais ou confidenciais: para
        investigar um problema, basta descrever o tipo de arquivo, o navegador e a mensagem
        exibida.
      </p>
      <div className="contact-options">
        {contactEmail && (
          <a href={`mailto:${contactEmail}`}>
            <Mail size={24} /><span><strong>E-mail</strong><small>{contactEmail}</small></span>
          </a>
        )}
        <a href="https://github.com/leonardo-deploy/converge-pdf/issues" target="_blank" rel="noreferrer">
          <Code2 size={24} /><span><strong>Relatar problema no GitHub</strong><small>Abra uma issue pública no repositório</small></span>
        </a>
      </div>
      <h2>Prazo de resposta</h2>
      <p>
        As mensagens são analisadas conforme a disponibilidade da equipe. Problemas que afetam
        segurança ou privacidade recebem prioridade.
      </p>
    </ContentPage>
  );
}
