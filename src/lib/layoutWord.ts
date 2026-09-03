import type {
  DocumentLayout,
  LayoutPage,
  LayoutTextItem,
  LayoutTextLine,
} from "../types";
import { getOutputName } from "./fileRules";

const EMUS_PER_POINT = 12_700;
const PIXELS_PER_POINT = 96 / 72;

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function layoutToEditableText(layout: DocumentLayout) {
  return layout.pages
    .map((page) => page.lines.map((line) => line.text).join("\n"))
    .join("\n\n")
    .trim();
}

function editedLinesForLayout(layout: DocumentLayout, text: string) {
  const normalized = normalizeText(text);
  const original = normalizeText(layoutToEditableText(layout));

  if (!normalized || normalized === original) {
    return layout.pages.map((page) => page.lines.map((line) => line.text));
  }

  const pageGroups = normalized.split(/\n{2,}/);
  if (pageGroups.length === layout.pages.length) {
    return layout.pages.map((page, pageIndex) => {
      const edited = pageGroups[pageIndex].split("\n");
      if (edited.length === page.lines.length) return edited;
      return page.lines.map((line, lineIndex) => edited[lineIndex] ?? line.text);
    });
  }

  const flattened = normalized.split("\n");
  let index = 0;
  return layout.pages.map((page) =>
    page.lines.map((line) => flattened[index++] ?? line.text),
  );
}

function mergedLineItem(line: LayoutTextLine, editedText: string): LayoutTextItem | null {
  if (!editedText.trim() || line.items.length === 0) return null;

  const first = line.items[0];
  const x = Math.min(...line.items.map((item) => item.x));
  const y = Math.min(...line.items.map((item) => item.y));
  const right = Math.max(...line.items.map((item) => item.x + item.width));
  const bottom = Math.max(...line.items.map((item) => item.y + item.height));

  return {
    ...first,
    text: editedText,
    x,
    y,
    width: Math.max(right - x, editedText.length * first.fontSize * 0.52),
    height: bottom - y,
  };
}

function itemsForLine(line: LayoutTextLine, editedText: string) {
  if (editedText === line.text) return line.items;
  const merged = mergedLineItem(line, editedText);
  return merged ? [merged] : [];
}

function pointToPixels(value: number) {
  return Math.max(1, value * PIXELS_PER_POINT);
}

function pointToEmus(value: number) {
  return Math.round(Math.max(0, value) * EMUS_PER_POINT);
}

async function createLayoutWordBlob(
  sourceName: string,
  text: string,
  layout: DocumentLayout,
) {
  const {
    Document,
    HorizontalPositionRelativeFrom,
    ImageRun,
    LineRuleType,
    Packer,
    Paragraph,
    SectionType,
    TextRun,
    TextWrappingType,
    VerticalPositionRelativeFrom,
    WpsShapeRun,
  } = await import("docx");

  const editedPages = editedLinesForLayout(layout, text);
  const sections = layout.pages.map((page: LayoutPage, pageIndex) => {
    const background = new ImageRun({
      type: page.backgroundType,
      data: page.background,
      transformation: {
        width: pointToPixels(page.width),
        height: pointToPixels(page.height),
      },
      altText: {
        title: `Elementos visuais da página ${pageIndex + 1}`,
        description: "Imagens, linhas e formas preservadas do documento original",
        name: `Página ${pageIndex + 1}`,
      },
      floating: {
        horizontalPosition: {
          relative: HorizontalPositionRelativeFrom.PAGE,
          offset: 0,
        },
        verticalPosition: {
          relative: VerticalPositionRelativeFrom.PAGE,
          offset: 0,
        },
        allowOverlap: true,
        behindDocument: true,
        layoutInCell: false,
        lockAnchor: true,
        wrap: { type: TextWrappingType.NONE },
      },
    });

    const textShapes = page.lines.flatMap((line, lineIndex) =>
      itemsForLine(line, editedPages[pageIndex]?.[lineIndex] ?? line.text).map(
        (item) =>
          new WpsShapeRun({
            type: "wps",
            transformation: {
              width: pointToPixels(Math.max(item.width + 1.5, item.fontSize * 0.7)),
              height: pointToPixels(Math.max(item.height * 1.3, item.fontSize * 1.45)),
              rotation: item.rotation,
            },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                offset: pointToEmus(item.x),
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                offset: pointToEmus(item.y),
              },
              allowOverlap: true,
              behindDocument: false,
              layoutInCell: false,
              lockAnchor: false,
              wrap: { type: TextWrappingType.NONE },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.text,
                    size: Math.max(8, Math.round(item.fontSize * 2)),
                    font: item.fontFamily,
                    bold: item.bold,
                    italics: item.italic,
                    color: item.color,
                    noProof: true,
                  }),
                ],
                spacing: {
                  before: 0,
                  after: 0,
                  line: Math.max(1, Math.round(item.fontSize * 20)),
                  lineRule: LineRuleType.EXACT,
                },
                contextualSpacing: true,
              }),
            ],
            bodyProperties: {
              margins: { top: 0, right: 0, bottom: 0, left: 0 },
              noAutoFit: true,
            },
            outline: { type: "noFill" },
          }),
      ),
    );

    return {
      properties: {
        type: pageIndex < layout.pages.length - 1 ? SectionType.NEXT_PAGE : undefined,
        page: {
          size: {
            width: Math.round(page.width * 20),
            height: Math.round(page.height * 20),
          },
          margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            header: 0,
            footer: 0,
            gutter: 0,
          },
        },
      },
      children: [
        new Paragraph({
          children: [background, ...textShapes],
          spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT },
        }),
      ],
    };
  });

  const document = new Document({
    creator: "Sim Doc",
    title: sourceName,
    description: "Documento editável com layout preservado pelo Sim Doc",
    compatabilityModeVersion: 15,
    sections,
  });

  return Packer.toBlob(document);
}

async function createFlowingWordBlob(sourceName: string, text: string) {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } =
    await import("docx");
  const paragraphs = normalizeText(text)
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
    creator: "Sim Doc",
    title: sourceName,
    description: "Documento convertido pelo Sim Doc",
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

export async function createWordBlob(
  sourceName: string,
  text: string,
  layout?: DocumentLayout,
) {
  if (layout?.pages.length) {
    return createLayoutWordBlob(sourceName, text, layout);
  }
  return createFlowingWordBlob(sourceName, text);
}

export async function downloadAsWord(
  sourceName: string,
  text: string,
  layout?: DocumentLayout,
) {
  const blob = await createWordBlob(sourceName, text, layout);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = getOutputName(sourceName);
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
