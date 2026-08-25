export type ConverterMode = "pdf" | "image";

export type OcrLanguage = "por" | "eng" | "spa";

export interface ConversionProgress {
  percent: number;
  label: string;
}

export interface ConversionResult {
  sourceName: string;
  text: string;
  pages: number;
  usedOcr: boolean;
}
