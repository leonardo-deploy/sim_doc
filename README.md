# Sim Doc

Uma ferramenta web simples e privada para transformar arquivos PDF e fotos de documentos em arquivos Word editáveis.

Site publicado: <https://sim-doc.pages.dev/>

O Sim Doc foi projetado para funcionar no **Cloudflare Pages no plano gratuito**. A leitura do documento, o OCR e a criação do `.docx` acontecem no navegador do usuário, sem backend e sem upload do conteúdo para servidores do projeto.

## Recursos

- PDF com texto selecionável para Word
- OCR automático para páginas digitalizadas
- Fotos JPG, PNG, WebP, BMP e TIFF para Word
- Português, inglês e espanhol
- Revisão e edição do texto antes do download
- Até 40 páginas por PDF ou 10 imagens por conversão
- Processamento local e sem cadastro
- Layout responsivo para computador e celular
- Páginas de privacidade, termos, sobre e contato
- SEO básico, manifesto PWA e configuração do Cloudflare Pages

## Tecnologias

- React 19 + TypeScript
- Vite
- PDF.js para leitura e renderização de PDFs
- Tesseract.js para reconhecimento óptico de caracteres
- docx para geração dos arquivos Word
- Cloudflare Pages para publicação estática na rede global
- Wrangler para validação, prévia e deploy por linha de comando

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

## Publicar no Cloudflare Pages

A opção recomendada é conectar o próprio repositório ao Cloudflare para ter deploy automático:

1. Acesse **Workers & Pages** no painel do Cloudflare.
2. Selecione **Create application → Pages → Import an existing Git repository**.
3. Autorize o GitHub e escolha `leonardo-deploy/texto_doc`.
4. Use a branch de produção `main`.
5. Configure o comando de build como `npm run build`.
6. Configure o diretório de saída como `dist`.
7. Salve e inicie o primeiro deploy.

Cada atualização enviada para `main` será compilada e publicada automaticamente. Pull requests também recebem URLs de prévia.

Para testar a versão com o ambiente local do Cloudflare:

```bash
npm run preview:cloudflare
```

Depois que o projeto `sim-doc` existir na conta, também é possível publicar manualmente:

```bash
npx wrangler login
npm run deploy:cloudflare
```

O projeto não usa Pages Functions, Workers, D1, KV ou R2. Assim, todas as visitas permanecem como requisições estáticas gratuitas e os documentos continuam sendo processados somente no navegador.

## Preparação para o domínio

O domínio atual do projeto é `https://sim-doc.pages.dev`. Se um domínio próprio for conectado no futuro:

1. Substitua o domínio do Pages em `public/robots.txt` e `public/sitemap.xml`.
2. Configure `VITE_CONTACT_EMAIL`.
3. Cadastre o domínio em **Workers & Pages → Custom domains**.
4. Confirme o domínio no Google Search Console.

## Limitações conhecidas

- A conversão prioriza o texto editável, não uma reprodução idêntica da diagramação.
- Tabelas, múltiplas colunas, assinaturas e textos manuscritos podem exigir revisão.
- OCR depende da nitidez, iluminação e enquadramento da imagem.
- O primeiro OCR pode demorar um pouco porque o navegador precisa carregar o modelo do idioma.
- Dispositivos com pouca memória podem ter dificuldade com documentos muito extensos.

## Estrutura principal

```text
src/
├── components/      # Navegação e conversor
├── lib/             # Validação, PDF, OCR e geração de DOCX
├── pages/           # Início e páginas institucionais
└── test/            # Configuração dos testes
public/              # SEO, manifesto, favicon e ads.txt
wrangler.jsonc       # Configuração do Cloudflare Pages
public/_headers      # Segurança e cache dos arquivos estáticos
```

## Privacidade

O conteúdo selecionado pelo usuário permanece no dispositivo durante a conversão. Para detalhes sobre hospedagem e privacidade, consulte a Política de Privacidade dentro do próprio site.
