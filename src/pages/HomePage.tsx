import {
  BadgeCheck,
  Check,
  Download,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  LockKeyhole,
  MousePointerClick,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";
import { Converter } from "../components/Converter";

const faqs = [
  {
    question: "Meus arquivos são enviados para algum servidor?",
    answer:
      "Não. A leitura do PDF, o reconhecimento das fotos e a criação do Word acontecem no seu próprio navegador. O Texto Doc não armazena o conteúdo dos documentos.",
  },
  {
    question: "O resultado fica igual ao documento original?",
    answer:
      "O objetivo é recuperar o texto e organizá-lo em um Word editável. Elementos complexos, como tabelas, colunas, assinaturas e diagramações especiais, podem exigir ajustes manuais.",
  },
  {
    question: "Funciona com PDF digitalizado?",
    answer:
      "Sim. Quando uma página não contém texto selecionável, o sistema usa OCR para tentar reconhecer o conteúdo visual automaticamente.",
  },
  {
    question: "Preciso instalar algum programa ou criar conta?",
    answer:
      "Não. Basta abrir o site em um navegador atualizado, selecionar o documento e iniciar a conversão.",
  },
  {
    question: "Quais idiomas são reconhecidos?",
    answer:
      "Nesta primeira versão, você pode escolher português, inglês ou espanhol como idioma principal do documento.",
  },
];

export function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="page-shell hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15} /> CONVERSÃO SIMPLES E PRIVADA</span>
            <h1>
              Transforme PDFs e fotos em <span>documentos editáveis</span>
            </h1>
            <p>
              Extraia textos de documentos e baixe tudo em Word, sem instalar programas e
              sem enviar seus arquivos para a nuvem.
            </p>
            <a className="button button-primary hero-button" href="#converter">
              Converter meu documento <MousePointerClick size={19} />
            </a>
            <div className="hero-trust" aria-label="Benefícios">
              <span><Check size={16} /> Sem cadastro</span>
              <span><Check size={16} /> Conversão gratuita</span>
              <span><Check size={16} /> Arquivos protegidos</span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="visual-card visual-pdf">
              <span><FileText size={23} /></span>
              <div><strong>contrato.pdf</strong><small>Documento original</small></div>
              <BadgeCheck size={19} />
            </div>
            <div className="conversion-flow">
              <span /><span /><span />
              <div><ScanText size={26} /></div>
              <span /><span /><span />
            </div>
            <div className="visual-card visual-word">
              <span><FileCheck2 size={23} /></span>
              <div><strong>contrato.docx</strong><small>Pronto para editar</small></div>
              <Download size={19} />
            </div>
            <div className="visual-floating visual-floating-one"><LockKeyhole size={16} /> 100% local</div>
            <div className="visual-floating visual-floating-two"><Zap size={16} /> Rápido</div>
          </div>
        </div>
      </section>

      <section id="converter" className="tool-section" aria-labelledby="tool-title">
        <div className="page-shell tool-heading">
          <span className="section-kicker">CONVERTA AGORA</span>
          <h2 id="tool-title">Escolha o documento e deixe o resto conosco</h2>
          <p>Nenhum upload para nossos servidores. O arquivo permanece no seu dispositivo.</p>
        </div>
        <div className="tool-layout page-shell-wide">
          <Converter />
        </div>
        <div className="page-shell converter-assurances">
          <span><ShieldCheck size={18} /> Processamento local</span>
          <span><Zap size={18} /> Sem filas de espera</span>
          <span><FileCheck2 size={18} /> Word editável</span>
        </div>
      </section>

      <section id="como-funciona" className="section how-section">
        <div className="page-shell">
          <div className="section-heading centered">
            <span className="section-kicker">COMO FUNCIONA</span>
            <h2>Do documento ao Word em três passos</h2>
            <p>Um fluxo direto, pensado para funcionar bem no computador e no celular.</p>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon"><UploadCloud size={25} /></div>
              <h3>Selecione o arquivo</h3>
              <p>Escolha um PDF ou adicione fotos nítidas das páginas do documento.</p>
            </article>
            <article className="step-card featured">
              <span className="step-number">02</span>
              <div className="step-icon"><ScanText size={25} /></div>
              <h3>Revise o texto</h3>
              <p>O conteúdo é reconhecido no navegador e fica disponível para correções.</p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon"><Download size={25} /></div>
              <h3>Baixe em Word</h3>
              <p>Gere um arquivo DOCX editável, pronto para continuar o seu trabalho.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="seguranca" className="section privacy-section">
        <div className="page-shell privacy-grid">
          <div className="privacy-visual" aria-hidden="true">
            <div className="privacy-ring privacy-ring-large" />
            <div className="privacy-ring privacy-ring-small" />
            <div className="shield-core"><ShieldCheck size={52} /></div>
            <span className="privacy-chip chip-one"><LockKeyhole size={15} /> Sem upload</span>
            <span className="privacy-chip chip-two"><FileCheck2 size={15} /> Sem cópias</span>
          </div>
          <div className="privacy-copy">
            <span className="section-kicker section-kicker-light">PRIVACIDADE DE VERDADE</span>
            <h2>Seu documento não precisa sair do seu dispositivo</h2>
            <p>
              A tecnologia do Texto Doc roda diretamente no navegador. Isso reduz riscos,
              elimina filas de processamento e permite usar a ferramenta sem criar uma conta.
            </p>
            <ul>
              <li><Check size={18} /> O conteúdo não é armazenado pelo Texto Doc</li>
              <li><Check size={18} /> Nenhum cadastro é necessário para converter</li>
              <li><Check size={18} /> Você decide quando apagar ou salvar o resultado</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section format-section">
        <div className="page-shell format-grid">
          <div>
            <span className="section-kicker">FEITO PARA O DIA A DIA</span>
            <h2>Documentos editáveis sem complicação</h2>
            <p>
              Recupere textos de contratos, declarações, anotações, formulários, apostilas e
              outros materiais. Revise o reconhecimento e continue trabalhando no Word.
            </p>
            <div className="format-pills">
              <span><FileText size={17} /> PDF</span>
              <span><ImageIcon size={17} /> JPG</span>
              <span><ImageIcon size={17} /> PNG</span>
              <span><ImageIcon size={17} /> WebP</span>
              <span><FileCheck2 size={17} /> DOCX</span>
            </div>
          </div>
          <div className="quality-card">
            <div className="quality-icon"><Sparkles size={25} /></div>
            <h3>Para obter um resultado melhor</h3>
            <ul>
              <li><span>1</span> Fotografe com boa iluminação</li>
              <li><span>2</span> Mantenha a página reta e inteira</li>
              <li><span>3</span> Evite sombras, reflexos e desfoque</li>
              <li><span>4</span> Revise nomes, números e assinaturas</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="duvidas" className="section faq-section">
        <div className="page-shell faq-grid">
          <div className="section-heading">
            <span className="section-kicker">DÚVIDAS FREQUENTES</span>
            <h2>Respostas rápidas antes de converter</h2>
            <p>Ainda ficou alguma dúvida? Você pode consultar nossas páginas de transparência no rodapé.</p>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary>{faq.question}<span>+</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="page-shell closing-cta-inner">
          <div>
            <span className="section-kicker section-kicker-light">PRONTO PARA COMEÇAR?</span>
            <h2>Transforme seu próximo documento agora</h2>
            <p>Grátis, sem cadastro e com processamento no seu navegador.</p>
          </div>
          <a className="button button-light" href="#converter">Converter documento <UploadCloud size={19} /></a>
        </div>
      </section>
    </main>
  );
}
