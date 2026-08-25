import type { ConverterMode } from "../types";

export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_COUNT = 10;
export const MAX_PDF_PAGES = 40;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "bmp", "tif", "tiff"];
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function validateFiles(files: File[], mode: ConverterMode): string | null {
  if (files.length === 0) {
    return "Selecione pelo menos um arquivo.";
  }

  if (mode === "pdf") {
    if (files.length !== 1) {
      return "Selecione um PDF por vez.";
    }

    const file = files[0];
    const isPdf = file.type === "application/pdf" || extensionOf(file.name) === "pdf";

    if (!isPdf) {
      return "Escolha um arquivo no formato PDF.";
    }

    if (file.size > MAX_PDF_BYTES) {
      return "O PDF deve ter no máximo 25 MB.";
    }

    return null;
  }

  if (files.length > MAX_IMAGE_COUNT) {
    return `Selecione no máximo ${MAX_IMAGE_COUNT} imagens por conversão.`;
  }

  for (const file of files) {
    const isImage = IMAGE_MIME_TYPES.includes(file.type) || IMAGE_EXTENSIONS.includes(extensionOf(file.name));

    if (!isImage) {
      return `O arquivo “${file.name}” não é uma imagem compatível.`;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return `A imagem “${file.name}” deve ter no máximo 15 MB.`;
    }
  }

  return null;
}

export function getOutputName(sourceName: string) {
  const withoutExtension = sourceName.replace(/\.[^/.]+$/, "");
  const safeName = withoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${safeName || "documento"}-convertido.docx`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
