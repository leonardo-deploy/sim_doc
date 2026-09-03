export type ConverterMode = "pdf" | "image";

export type OcrLanguage = "por" | "eng" | "spa";

export interface ConversionProgress {
  percent: number;
  label: string;
}

export interface LayoutTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

export interface LayoutTextLine {
  text: string;
  items: LayoutTextItem[];
}

export interface LayoutPage {
  width: number;
  height: number;
  background: Uint8Array;
  backgroundType: "jpg" | "png";
  lines: LayoutTextLine[];
}

export interface DocumentLayout {
  pages: LayoutPage[];
}

export interface ConversionResult {
  sourceName: string;
  text: string;
  pages: number;
  usedOcr: boolean;
  layout: DocumentLayout;
}
