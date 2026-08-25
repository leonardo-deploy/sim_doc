# Converge PDF

Uma ferramenta web simples e privada para transformar arquivos PDF e fotos de documentos em arquivos Word editáveis.

O Converge PDF foi projetado para funcionar no **Firebase Hosting no plano Spark**. A leitura do documento, o OCR e a criação do `.docx` acontecem no navegador do usuário, sem backend e sem upload do conteúdo para servidores do projeto.

## Recursos

- PDF com texto selecionável para Word
- OCR automático para páginas digitalizadas
- Fotos JPG, PNG, WebP, BMP e TIFF para Word
- Português, inglês e espanhol
- Revisão e edição do texto antes do download
- Até 40 páginas por PDF ou 10 imagens por conversão
- Processamento local e sem cadastro
- Layout responsivo para computador e celular
- Áreas laterais e horizontal preparadas para Google AdSense
- Páginas de privacidade, termos, sobre e contato
- SEO básico, manifesto PWA e configuração do Firebase Hosting

## Tecnologias

- React 19 + TypeScript
- Vite
- PDF.js para leitura e renderização de PDFs
- Tesseract.js para reconhecimento óptico de caracteres
- docx para geração dos arquivos Word
- Firebase Hosting para publicação estática

## Executar localmente

Requisitos: Node.js 22 ou superior.

```bash
npm install
npm run dev
```

O endereço local será exibido no terminal, normalmente `http://localhost:5173`.

## Verificações de qualidade

```bash
npm run lint
npm test
npm run build
```

O resultado de produção é criado na pasta `dist/`.

## Configurar publicidade

Copie `.env.example` para `.env.local` e informe os dados fornecidos pelo Google AdSense:

```env
VITE_ADSENSE_CLIENT=ca-pub-0000000000000000
VITE_ADSENSE_LEFT_SLOT=0000000000
VITE_ADSENSE_RIGHT_SLOT=0000000000
VITE_ADSENSE_INLINE_SLOT=0000000000
VITE_CONTACT_EMAIL=contato@seu-dominio.com
```

Enquanto esses valores não forem configurados, o layout exibe marcadores discretos indicando as posições reservadas. O script do AdSense só é carregado depois que o visitante aceita a publicidade no aviso de privacidade.

Antes do lançamento, substitua o conteúdo de `public/ads.txt` pela linha fornecida no painel do AdSense.

## Publicar no Firebase Spark

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Instale e autentique o Firebase CLI.
3. Associe este diretório ao projeto.
4. Gere e publique a versão estática.

```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm run build
firebase deploy --only hosting
```

O projeto não usa Cloud Functions, Cloud Run, Firestore ou Storage. Essa decisão mantém a operação compatível com o plano Spark e evita que documentos sejam enviados ao backend.

## Preparação para o domínio

Quando o domínio definitivo for escolhido:

1. Substitua `SEU_DOMINIO` em `public/robots.txt` e `public/sitemap.xml`.
2. Configure `VITE_CONTACT_EMAIL`.
3. Cadastre o domínio no Firebase Hosting.
4. Confirme o domínio no Google Search Console e no AdSense.
5. Insira os códigos reais das unidades de anúncio e do `ads.txt`.

## Limitações conhecidas

- A conversão prioriza o texto editável, não uma reprodução idêntica da diagramação.
- Tabelas, múltiplas colunas, assinaturas e textos manuscritos podem exigir revisão.
- OCR depende da nitidez, iluminação e enquadramento da imagem.
- O primeiro OCR pode demorar um pouco porque o navegador precisa carregar o modelo do idioma.
- Dispositivos com pouca memória podem ter dificuldade com documentos muito extensos.

## Estrutura principal

```text
src/
├── components/      # Navegação, conversor, anúncios e consentimento
├── lib/             # Validação, PDF, OCR e geração de DOCX
├── pages/           # Início e páginas institucionais
└── test/            # Configuração dos testes
public/              # SEO, manifesto, favicon e ads.txt
firebase.json        # Configuração do Firebase Hosting
```

## Privacidade

O conteúdo selecionado pelo usuário permanece no dispositivo durante a conversão. Para detalhes sobre hospedagem, publicidade e preferências locais, consulte a Política de Privacidade dentro do próprio site.
