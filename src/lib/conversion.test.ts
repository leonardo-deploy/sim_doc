import { describe, expect, it } from "vitest";
import { createWordBlob, normalizeExtractedText } from "./conversion";
import type { DocumentLayout } from "../types";

describe("normalizeExtractedText", () => {
  it("remove espaços excessivos sem destruir parágrafos", () => {
    expect(normalizeExtractedText("Olá   mundo  \n\n\n  Segundo parágrafo")).toBe(
      "Olá mundo\n\nSegundo parágrafo",
    );
  });
});

describe("createWordBlob", () => {
  it("gera um arquivo DOCX não vazio", async () => {
    const blob = await createWordBlob(
      "exemplo.pdf",
      "Primeiro parágrafo.\n\nSegundo parágrafo.",
    );

    expect(blob.size).toBeGreaterThan(1_000);
    expect(blob.type).toContain("officedocument");
  });

  it("gera um DOCX com página visual e texto posicionado editável", async () => {
    const onePixelPng = Uint8Array.from(
      atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJ1sAAAAASUVORK5CYII="),
      (character) => character.charCodeAt(0),
    );
    const layout: DocumentLayout = {
      pages: [
        {
          width: 612,
          height: 792,
          background: onePixelPng,
          backgroundType: "png",
          lines: [
            {
              text: "Texto na posição original",
              items: [
                {
                  text: "Texto na posição original",
                  x: 72,
                  y: 96,
                  width: 180,
                  height: 16,
                  rotation: 0,
                  fontFamily: "Arial",
                  fontSize: 12,
                  bold: true,
                  italic: false,
                  color: "1F2937",
                },
              ],
            },
          ],
        },
      ],
    };

    const blob = await createWordBlob("layout.pdf", "Texto na posição original", layout);

    expect(blob.size).toBeGreaterThan(2_000);
    expect(blob.type).toContain("officedocument");
  });
});
