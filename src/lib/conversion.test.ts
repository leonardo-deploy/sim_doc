import { describe, expect, it } from "vitest";
import { createWordBlob, normalizeExtractedText } from "./conversion";

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
});
