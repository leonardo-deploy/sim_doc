import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFPageProxy } from "pdfjs-dist";
import type {
  ConversionProgress,
  ConversionResult,
  DocumentLayout,
  LayoutPage,
  LayoutTextItem,
  LayoutTextLine,
  OcrLanguage,
} from "../types";
import { MAX_PDF_PAGES } from "./fileRules";
import { layoutToEditableText } from "./layoutWord";

export { createWordBlob, downloadAsWord } from "./layoutWord";

type ProgressCallback = (progress: ConversionProgress) => void;

const PDF_RENDER_SCALE = 1.55;
const OCR_RENDER_SCALE = 1.8;
const MAX_IMAGE_CANVAS_EDGE = 2_600;

interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

interface PdfTextStyle {
  fontFamily?: string;
  ascent?: number;
  descent?: number;
}

interface OcrBbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface OcrLine {
  text: string;
  bbox: OcrBbox;
}

interface OcrBlock {
  paragraphs: Array<{ lines: OcrLine[] }>;
}

interface OcrResult {
  data: {
    text: string;
    blocks: OcrBlock[] | null;
  };
}

interface OcrWorker {
  recognize: (
    image: File | HTMLCanvasElement,
    options?: Record<string, unknown>,
    output?: { text?: boolean; blocks?: boolean },
  ) => Promise<OcrResult>;
  terminate: () => Promise<unknown>;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isPdfTextItem(value: unknown): value is PdfTextItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "str" in value &&
    "transform" in value &&
    "width" in value &&
    "fontName" in value
  );
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

function normalizeFontFamily(value?: string) {
  const firstFamily = value?.split(",")[0].replace(/["']/g, "").trim() ?? "";
  const lower = firstFamily.toLowerCase();

  if (!firstFamily || lower === "sans-serif") return "Arial";
  if (lower === "serif") return "Times New Roman";
  if (lower === "monospace") return "Courier New";
  return firstFamily;
}

function inferFontTraits(fontName: string, fontFamily: string) {
  const descriptor = `${fontName} ${fontFamily}`.toLowerCase();
  return {
    bold: /(bold|black|heavy|semibold|demi)/.test(descriptor),
    italic: /(italic|oblique)/.test(descriptor),
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function rgbToHex({ r, g, b }: Rgb) {
  return [r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function colorDistance(first: Rgb, second: Rgb) {
  return Math.abs(first.r - second.r) + Math.abs(first.g - second.g) + Math.abs(first.b - second.b);
}

function safeImageData(context: CanvasRenderingContext2D, rect: PixelRect) {
  const x = clamp(Math.floor(rect.x), 0, context.canvas.width - 1);
  const y = clamp(Math.floor(rect.y), 0, context.canvas.height - 1);
  const width = clamp(Math.ceil(rect.width), 1, context.canvas.width - x);
  const height = clamp(Math.ceil(rect.height), 1, context.canvas.height - y);
  return { imageData: context.getImageData(x, y, width, height), x, y, width, height };
}

function dominantDifferentColor(
  foreground: ImageData,
  backgroundAt: (pixelIndex: number) => Rgb,
) {
  const candidates: Array<{ color: Rgb; distance: number }> = [];
  const pixelCount = foreground.width * foreground.height;
  const step = Math.max(1, Math.floor(Math.sqrt(pixelCount / 2_500)));

  for (let pixel = 0; pixel < pixelCount; pixel += step) {
    const offset = pixel * 4;
    if (foreground.data[offset + 3] < 64) continue;

    const color = {
      r: foreground.data[offset],
      g: foreground.data[offset + 1],
      b: foreground.data[offset + 2],
    };
    const distance = colorDistance(color, backgroundAt(pixel));
    if (distance > 54) candidates.push({ color, distance });
  }

  if (candidates.length === 0) return "000000";
  candidates.sort((first, second) => second.distance - first.distance);
  const strongest = candidates.slice(0, Math.max(1, Math.ceil(candidates.length * 0.3)));
  const values = (channel: keyof Rgb) => strongest.map((entry) => entry.color[channel]).sort((a, b) => a - b);
  const red = values("r");
  const green = values("g");
  const blue = values("b");
  const middle = Math.floor(strongest.length / 2);
  return rgbToHex({ r: red[middle], g: green[middle], b: blue[middle] });
}

function inferDigitalTextColor(
  rendered: HTMLCanvasElement,
  background: HTMLCanvasElement,
  rect: PixelRect,
) {
  const renderedContext = rendered.getContext("2d", { willReadFrequently: true });
  const backgroundContext = background.getContext("2d", { willReadFrequently: true });
  if (!renderedContext || !backgroundContext) return "000000";

  const foreground = safeImageData(renderedContext, rect);
  const behind = backgroundContext.getImageData(
    foreground.x,
    foreground.y,
    foreground.width,
    foreground.height,
  );
  return dominantDifferentColor(foreground.imageData, (pixel) => {
    const offset = pixel * 4;
    return { r: behind.data[offset], g: behind.data[offset + 1], b: behind.data[offset + 2] };
  });
}

function sampleBackgroundColor(canvas: HTMLCanvasElement, rect: PixelRect): Rgb {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { r: 255, g: 255, b: 255 };

  const x0 = clamp(Math.floor(rect.x) - 3, 0, canvas.width - 1);
  const y0 = clamp(Math.floor(rect.y) - 3, 0, canvas.height - 1);
  const x1 = clamp(Math.ceil(rect.x + rect.width) + 3, 0, canvas.width - 1);
  const y1 = clamp(Math.ceil(rect.y + rect.height) + 3, 0, canvas.height - 1);
  const captured = context.getImageData(x0, y0, Math.max(1, x1 - x0 + 1), Math.max(1, y1 - y0 + 1));
  const samples: Rgb[] = [];
  const addPixel = (x: number, y: number) => {
    const offset = ((y - y0) * captured.width + (x - x0)) * 4;
    samples.push({
      r: captured.data[offset],
      g: captured.data[offset + 1],
      b: captured.data[offset + 2],
    });
  };
  const horizontalStep = Math.max(1, Math.ceil((x1 - x0) / 40));
  const verticalStep = Math.max(1, Math.ceil((y1 - y0) / 40));

  for (let x = x0; x <= x1; x += horizontalStep) {
    addPixel(x, y0);
    addPixel(x, y1);
  }
  for (let y = y0; y <= y1; y += verticalStep) {
    addPixel(x0, y);
    addPixel(x1, y);
  }

  if (samples.length === 0) return { r: 255, g: 255, b: 255 };
  const median = (channel: keyof Rgb) => {
    const sorted = samples.map((sample) => sample[channel]).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  return { r: median("r"), g: median("g"), b: median("b") };
}

function inferOcrTextColor(canvas: HTMLCanvasElement, rect: PixelRect, background: Rgb) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "000000";
  const foreground = safeImageData(context, rect).imageData;
  return dominantDifferentColor(foreground, () => background);
}

function maskOcrText(canvas: HTMLCanvasElement, rect: PixelRect, background: Rgb) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.save();
  context.fillStyle = `rgb(${background.r}, ${background.g}, ${background.b})`;
  context.fillRect(
    Math.max(0, rect.x - 1),
    Math.max(0, rect.y - 1),
    Math.min(canvas.width - rect.x + 1, rect.width + 2),
    Math.min(canvas.height - rect.y + 1, rect.height + 2),
  );
  context.restore();
}

async function createOcrWorker(
  language: OcrLanguage,
  onProgress: (value: number) => void,
): Promise<OcrWorker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(language, undefined, {
    logger: (message: { status: string; progress: number }) => {
      if (message.status === "recognizing text") onProgress(message.progress);
    },
  }) as Promise<OcrWorker>;
}

async function renderPdfPage(
  page: PDFPageProxy,
  scale: number,
  operationsFilter?: (index: number) => boolean,
) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Seu navegador não conseguiu preparar a página para conversão.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({
    canvas,
    canvasContext: context,
    viewport,
    background: "#FFFFFF",
    operationsFilter,
  }).promise;
  return canvas;
}

async function canvasToJpeg(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Não foi possível preservar os elementos visuais."))),
      "image/jpeg",
      0.9,
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function joinItemsAsLine(items: LayoutTextItem[]) {
  const ordered = [...items].sort((first, second) => first.x - second.x);
  let output = "";
  let previousRight: number | null = null;

  for (const item of ordered) {
    const gap = previousRight === null ? 0 : item.x - previousRight;
    if (
      output &&
      gap > Math.max(0.8, item.fontSize * 0.12) &&
      !output.endsWith(" ") &&
      !item.text.startsWith(" ")
    ) {
      output += gap > item.fontSize * 2.5 ? "    " : " ";
    }
    output += item.text;
    previousRight = Math.max(previousRight ?? 0, item.x + item.width);
  }

  return output.trim();
}

function groupIntoLines(items: LayoutTextItem[]): LayoutTextLine[] {
  const ordered = [...items].sort((first, second) => first.y - second.y || first.x - second.x);
  const groups: LayoutTextItem[][] = [];

  for (const item of ordered) {
    const previous = groups.at(-1);
    const reference = previous?.[0];
    const sameLine =
      reference &&
      Math.abs(reference.y - item.y) <= Math.max(2.5, Math.min(reference.fontSize, item.fontSize) * 0.38) &&
      Math.abs(reference.rotation - item.rotation) < 2;

    if (sameLine && previous) previous.push(item);
    else groups.push([item]);
  }

  return groups
    .map((lineItems) => ({ text: joinItemsAsLine(lineItems), items: lineItems }))
    .filter((line) => line.text);
}

function createPdfTextItems(
  items: unknown[],
  styles: Record<string, PdfTextStyle>,
  viewport: ReturnType<PDFPageProxy["getViewport"]>,
  rendered: HTMLCanvasElement,
  background: HTMLCanvasElement,
  transform: (first: number[], second: number[]) => number[],
) {
  return items.flatMap((value): LayoutTextItem[] => {
    if (!isPdfTextItem(value) || !value.str.trim()) return [];

    const matrix = transform(viewport.transform, value.transform);
    const fontHeight = Math.max(4, Math.hypot(matrix[2], matrix[3]));
    const style = styles[value.fontName] ?? {};
    const ascent = style.ascent ?? (style.descent ? 1 + style.descent : 0.8);
    const x = clamp(matrix[4], 0, viewport.width);
    const y = clamp(matrix[5] - fontHeight * ascent, 0, viewport.height);
    const width = Math.max(Math.abs(value.width), value.str.length * fontHeight * 0.2, 1);
    const height = Math.max(Math.abs(value.height), fontHeight * 1.15);
    const fontFamily = normalizeFontFamily(style.fontFamily);
    const traits = inferFontTraits(value.fontName, fontFamily);
    const rotation = Math.abs(matrix[1]) < 0.01 ? 0 : (Math.atan2(matrix[1], matrix[0]) * 180) / Math.PI;
    const color = inferDigitalTextColor(rendered, background, {
      x: x * PDF_RENDER_SCALE,
      y: y * PDF_RENDER_SCALE,
      width: width * PDF_RENDER_SCALE,
      height: height * PDF_RENDER_SCALE,
    });

    return [
      {
        text: value.str,
        x,
        y,
        width: Math.min(width, viewport.width - x),
        height,
        rotation,
        fontFamily,
        fontSize: fontHeight,
        bold: traits.bold,
        italic: traits.italic,
        color,
      },
    ];
  });
}

function ocrLines(result: OcrResult) {
  return (result.data.blocks ?? []).flatMap((block) =>
    block.paragraphs.flatMap((paragraph) => paragraph.lines),
  );
}

async function createOcrLayoutPage(
  canvas: HTMLCanvasElement,
  pageWidth: number,
  pageHeight: number,
  result: OcrResult,
): Promise<LayoutPage> {
  const scaleX = pageWidth / canvas.width;
  const scaleY = pageHeight / canvas.height;
  const lines: LayoutTextLine[] = [];

  for (const line of ocrLines(result)) {
    const text = normalizeExtractedText(line.text);
    if (!text) continue;

    const pixelRect = {
      x: line.bbox.x0,
      y: line.bbox.y0,
      width: Math.max(1, line.bbox.x1 - line.bbox.x0),
      height: Math.max(1, line.bbox.y1 - line.bbox.y0),
    };
    const sampledBackground = sampleBackgroundColor(canvas, pixelRect);
    const color = inferOcrTextColor(canvas, pixelRect, sampledBackground);
    const item: LayoutTextItem = {
      text,
      x: pixelRect.x * scaleX,
      y: pixelRect.y * scaleY,
      width: pixelRect.width * scaleX,
      height: pixelRect.height * scaleY,
      rotation: 0,
      fontFamily: "Arial",
      fontSize: clamp(pixelRect.height * scaleY * 0.76, 6, 72),
      bold: false,
      italic: false,
      color,
    };
    lines.push({ text, items: [item] });
    maskOcrText(canvas, pixelRect, sampledBackground);
  }

  if (lines.length === 0 && result.data.text.trim()) {
    const text = normalizeExtractedText(result.data.text);
    lines.push({
      text,
      items: [
        {
          text,
          x: 36,
          y: 36,
          width: Math.max(72, pageWidth - 72),
          height: Math.max(24, pageHeight - 72),
          rotation: 0,
          fontFamily: "Arial",
          fontSize: 11,
          bold: false,
          italic: false,
          color: "000000",
        },
      ],
    });
  }

  return {
    width: pageWidth,
    height: pageHeight,
    background: await canvasToJpeg(canvas),
    backgroundType: "jpg",
    lines,
  };
}

function hasEnoughSelectableText(items: unknown[]) {
  const count = items.reduce<number>(
    (total, item) => total + (isPdfTextItem(item) ? item.str.replace(/\s/g, "").length : 0),
    0,
  );
  return count >= 20;
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
  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;

  if (pageCount > MAX_PDF_PAGES) {
    await loadingTask.destroy();
    throw new Error(`O PDF pode ter no máximo ${MAX_PDF_PAGES} páginas nesta versão.`);
  }

  const pages: LayoutPage[] = [];
  let worker: OcrWorker | null = null;
  let usedOcr = false;

  try {
    for (let index = 1; index <= pageCount; index += 1) {
      const pageStart = 5 + ((index - 1) / pageCount) * 90;
      const pageShare = 90 / pageCount;
      report({
        percent: Math.round(pageStart),
        label: `Reconstruindo página ${index} de ${pageCount}…`,
      });

      const page = await pdfDocument.getPage(index);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();

      if (hasEnoughSelectableText(textContent.items)) {
        const operatorList = await page.getOperatorList();
        const textDrawingOperations = new Set([
          pdfjs.OPS.showText,
          pdfjs.OPS.showSpacedText,
          pdfjs.OPS.nextLineShowText,
          pdfjs.OPS.nextLineSetSpacingShowText,
        ]);
        const rendered = await renderPdfPage(page, PDF_RENDER_SCALE);
        const background = await renderPdfPage(
          page,
          PDF_RENDER_SCALE,
          (operationIndex) => !textDrawingOperations.has(operatorList.fnArray[operationIndex]),
        );
        const items = createPdfTextItems(
          textContent.items,
          textContent.styles as Record<string, PdfTextStyle>,
          viewport,
          rendered,
          background,
          pdfjs.Util.transform,
        );
        pages.push({
          width: viewport.width,
          height: viewport.height,
          background: await canvasToJpeg(background),
          backgroundType: "jpg",
          lines: groupIntoLines(items),
        });
        rendered.width = 1;
        rendered.height = 1;
        background.width = 1;
        background.height = 1;
      } else {
        usedOcr = true;
        const canvas = await renderPdfPage(page, OCR_RENDER_SCALE);
        if (!worker) {
          worker = await createOcrWorker(language, (ocrProgress) => {
            report({
              percent: Math.min(94, Math.round(pageStart + ocrProgress * pageShare)),
              label: `Reconhecendo e posicionando o texto da página ${index}…`,
            });
          });
        }
        const result = await worker.recognize(canvas, undefined, { text: true, blocks: true });
        pages.push(await createOcrLayoutPage(canvas, viewport.width, viewport.height, result));
        canvas.width = 1;
        canvas.height = 1;
      }

      page.cleanup();
    }
  } finally {
    await worker?.terminate();
    await loadingTask.destroy();
  }

  const layout: DocumentLayout = { pages };
  const text = layoutToEditableText(layout);
  if (!text) {
    throw new Error("Não encontramos texto legível neste PDF. Tente uma cópia mais nítida.");
  }

  report({ percent: 100, label: "Documento preparado com o layout preservado." });
  return { sourceName: file.name, text, pages: pageCount, usedOcr, layout };
}

async function imageFileToCanvas(file: File) {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_CANVAS_EDGE / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    source.close();
    throw new Error("Seu navegador não conseguiu preparar a imagem para conversão.");
  }
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas;
}

function pageSizeForImage(canvas: HTMLCanvasElement) {
  const ratio = canvas.width / canvas.height;
  if (ratio >= 1) {
    const height = 595;
    return { width: Math.min(1_008, height * ratio), height };
  }
  const width = 595;
  return { width, height: Math.min(1_008, width / ratio) };
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
      label: `Reconhecendo e posicionando imagem ${activeIndex + 1} de ${files.length}…`,
    });
  });

  const pages: LayoutPage[] = [];

  try {
    for (activeIndex = 0; activeIndex < files.length; activeIndex += 1) {
      report({
        percent: Math.round((activeIndex / files.length) * 100),
        label: `Preparando imagem ${activeIndex + 1} de ${files.length}…`,
      });
      const canvas = await imageFileToCanvas(files[activeIndex]);
      const pageSize = pageSizeForImage(canvas);
      const result = await worker.recognize(canvas, undefined, { text: true, blocks: true });
      pages.push(await createOcrLayoutPage(canvas, pageSize.width, pageSize.height, result));
      canvas.width = 1;
      canvas.height = 1;
    }
  } finally {
    await worker.terminate();
  }

  const layout: DocumentLayout = { pages };
  const text = layoutToEditableText(layout);
  if (!text) {
    throw new Error("Não encontramos texto legível nas imagens. Tente fotos mais nítidas.");
  }

  report({ percent: 100, label: "Documento preparado com o layout preservado." });
  return {
    sourceName: files.length === 1 ? files[0].name : "imagens",
    text,
    pages: files.length,
    usedOcr: true,
    layout,
  };
}
