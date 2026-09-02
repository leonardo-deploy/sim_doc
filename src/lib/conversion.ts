import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFPageProxy } from "pdfjs-dist";
import type {
  ConversionProgress,
  ConversionResult,
  OcrLanguage,
} from "../types";
import { getOutputName, MAX_PDF_PAGES } from "./fileRules";

type ProgressCallback = (progress: ConversionProgress) => void;

interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
}

interface OcrWorker {
  recognize: (
    image: File | HTMLCanvasElement,
  ) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}

function isPdfTextItem(value: unknown): value is PdfTextItem {
  return typeof value === "object" && value !== null && "str" in value;
}

export function normalizeExtractedText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textFromPdfItems(items: unknown[]) {
  let output = "";
  let previousY: number | null = null;

  for (const item of items) {
    if (!isPdfTextItem(item) || !item.str) continue;

    const currentY: number | null = item.transform?.[5] ?? previousY;
    const changedLine =
      previousY !== null && currentY !== null && Math.abs(currentY - previousY) > 3;

    if (output && changedLine) {
      output += "\n";
    } else if (output && !output.endsWith(" ") && !output.endsWith("\n")) {
      output += " ";
    }

    output += item.str;
    if (item.hasEOL) output += "\n";
    previousY = currentY;
  }

  return normalizeExtractedText(output);
}

async function createOcrWorker(
  language: OcrLanguage,
  onProgress: (value: number) => void,
): Promise<OcrWorker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(language, undefined, {
    logger: (message: { status: string; progress: number }) => {
      if (message.status === "recognizing text") {
        onProgress(message.progress);
      }
    },
  }) as Promise<OcrWorker>;
}

async function pageToCanvas(page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: 1.8 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Seu navegador não conseguiu preparar a página para leitura.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas;
}

export async function convertPdfToText(
  file: File,
  language: OcrLanguage,
  report: ProgressCallback,
): Promise<ConversionResult> {
  report({ percent: 3, label: "Abrindo o PDF…" });

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const document = await loadingTask.promise;

  if (document.numPages > MAX_PDF_PAGES) {
    throw new Error(`O PDF pode ter no máximo ${MAX_PDF_PAGES} páginas nesta versão.`);
  }

  const pages: string[] = [];
  let worker: OcrWorker | null = null;
  let usedOcr = false;

  try {
    for (let index = 1; index <= document.numPages; index += 1) {
      const pageStart = 5 + ((index - 1) / document.numPages) * 90;
      const pageShare = 90 / document.numPages;
      report({
        percent: Math.round(pageStart),
        label: `Lendo página ${index} de ${document.numPages}…`,
      });

      const page = await document.getPage(index);
      const textContent = await page.getTextContent();
      let text = textFromPdfItems(textContent.items);

      if (text.replace(/\s/g, "").length < 20) {
        usedOcr = true;
        const canvas = await pageToCanvas(page);

        if (!worker) {
          worker = await createOcrWorker(language, (ocrProgress) => {
            report({
              percent: Math.min(94, Math.round(pageStart + ocrProgress * pageShare)),
              label: `Reconhecendo texto da página ${index}…`,
            });
          });
        }

        const result = await worker.recognize(canvas);
        text = normalizeExtractedText(result.data.text);
      }

      if (text) pages.push(text);
      page.cleanup();
    }
  } finally {
    await worker?.terminate();
    await loadingTask.destroy();
  }

  const text = pages.join("\n\n");
  if (!text) {
    throw new Error("Não encontramos texto legível neste PDF. Tente uma cópia mais nítida.");
  }

  report({ percent: 100, label: "Texto extraído com sucesso." });
  return {
    sourceName: file.name,
    text,
    pages: document.numPages,
    usedOcr,
  };
}

export async function convertImagesToText(
  files: File[],
  language: OcrLanguage,
  report: ProgressCallback,
): Promise<ConversionResult> {
  let activeIndex = 0;
  const worker = await createOcrWorker(language, (ocrProgress) => {
    const completed = activeIndex / files.length;
    const current = ocrProgress / files.length;
    report({
      percent: Math.min(98, Math.round((completed + current) * 100)),
      label: `Lendo imagem ${activeIndex + 1} de ${files.length}…`,
    });
  });

  const texts: string[] = [];

  try {
    for (activeIndex = 0; activeIndex < files.length; activeIndex += 1) {
      report({
        percent: Math.round((activeIndex / files.length) * 100),
        label: `Preparando imagem ${activeIndex + 1} de ${files.length}…`,
      });
      const result = await worker.recognize(files[activeIndex]);
      const text = normalizeExtractedText(result.data.text);
      if (text) texts.push(text);
    }
  } finally {
    await worker.terminate();
  }

  const text = texts.join("\n\n");
  if (!text) {
    throw new Error("Não encontramos texto legível nas imagens. Tente fotos mais nítidas.");
  }

  report({ percent: 100, label: "Texto reconhecido com sucesso." });
  return {
    sourceName: files.length === 1 ? files[0].name : "imagens",
    text,
    pages: files.length,
    usedOcr: true,
  };
}

export async function createWordBlob(sourceName: string, text: string) {
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    TextRun,
  } = await import("docx");
  const paragraphs = normalizeExtractedText(text)
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(
      (paragraph) =>
        new Paragraph({
          children: [new TextRun({ text: paragraph.replace(/\n/g, " "), size: 22 })],
          spacing: { after: 180, line: 300 },
        }),
    );

  const document = new Document({
    creator: "Texto Doc",
    title: sourceName,
    description: "Documento convertido pelo Texto Doc",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: [
          new Paragraph({
            text: sourceName.replace(/\.[^/.]+$/, ""),
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.LEFT,
            spacing: { after: 320 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}

export async function downloadAsWord(sourceName: string, text: string) {
  const blob = await createWordBlob(sourceName, text);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = getOutputName(sourceName);
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
