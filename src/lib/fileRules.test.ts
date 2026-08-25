import { describe, expect, it } from "vitest";
import { getOutputName, validateFiles } from "./fileRules";

describe("validateFiles", () => {
  it("aceita um PDF válido", () => {
    const file = new File(["pdf"], "contrato.pdf", { type: "application/pdf" });
    expect(validateFiles([file], "pdf")).toBeNull();
  });

  it("recusa uma imagem no modo PDF", () => {
    const file = new File(["imagem"], "foto.jpg", { type: "image/jpeg" });
    expect(validateFiles([file], "pdf")).toContain("formato PDF");
  });

  it("aceita várias imagens válidas", () => {
    const files = [
      new File(["a"], "pagina-1.jpg", { type: "image/jpeg" }),
      new File(["b"], "pagina-2.png", { type: "image/png" }),
    ];
    expect(validateFiles(files, "image")).toBeNull();
  });
});

describe("getOutputName", () => {
  it("gera um nome seguro para download", () => {
    expect(getOutputName("Declaração Médica 2026.pdf")).toBe(
      "declaracao-medica-2026-convertido.docx",
    );
  });
});
