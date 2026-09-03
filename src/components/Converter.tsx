import {
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Languages,
  LoaderCircle,
  LockKeyhole,
  PencilLine,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  convertImagesToText,
  convertPdfToText,
  downloadAsWord,
} from "../lib/conversion";
import { formatFileSize, validateFiles } from "../lib/fileRules";
import type {
  ConversionProgress,
  ConversionResult,
  ConverterMode,
  OcrLanguage,
} from "../types";

const languageOptions: Array<{ value: OcrLanguage; label: string }> = [
  { value: "por", label: "Português" },
  { value: "eng", label: "Inglês" },
  { value: "spa", label: "Espanhol" },
];

export function Converter() {
  const [mode, setMode] = useState<ConverterMode>("pdf");
  const [files, setFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState<OcrLanguage>("por");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ConversionProgress>({ percent: 0, label: "" });
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [editableText, setEditableText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = mode === "pdf" ? ".pdf,application/pdf" : "image/jpeg,image/png,image/webp,image/bmp,image/tiff";

  const reset = () => {
    setFiles([]);
    setResult(null);
    setEditableText("");
    setError(null);
    setProgress({ percent: 0, label: "" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const switchMode = (nextMode: ConverterMode) => {
    if (busy || nextMode === mode) return;
    setMode(nextMode);
    reset();
  };

  const selectFiles = (selected: File[]) => {
    const validationError = validateFiles(selected, mode);
    if (validationError) {
      setError(validationError);
      setFiles([]);
      return;
    }
    setFiles(selected);
    setError(null);
    setResult(null);
    setEditableText("");
  };

  const removeFile = (index: number) => {
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(nextFiles);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const convert = async () => {
    const validationError = validateFiles(files, mode);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ percent: 1, label: "Preparando a conversão…" });

    try {
      const nextResult =
        mode === "pdf"
          ? await convertPdfToText(files[0], language, setProgress)
          : await convertImagesToText(files, language, setProgress);
      setResult(nextResult);
      setEditableText(nextResult.text);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "Não foi possível converter o arquivo. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!result || !editableText.trim()) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadAsWord(result.sourceName, editableText, result.layout);
    } catch {
      setError("Não foi possível gerar o Word. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="converter-card" aria-label="Conversor de documentos">
      <div className="converter-tabs" role="tablist" aria-label="Tipo de conversão">
        <button
          className={mode === "pdf" ? "converter-tab is-active" : "converter-tab"}
          type="button"
          role="tab"
          aria-selected={mode === "pdf"}
          onClick={() => switchMode("pdf")}
        >
          <FileText size={19} /> PDF para Word
        </button>
        <button
          className={mode === "image" ? "converter-tab is-active" : "converter-tab"}
          type="button"
          role="tab"
          aria-selected={mode === "image"}
          onClick={() => switchMode("image")}
        >
          <ImageIcon size={19} /> Foto para Word
        </button>
      </div>

      {!result ? (
        <div className="converter-body">
          <div
            className={`drop-zone ${dragging ? "is-dragging" : ""} ${files.length ? "has-files" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              if (event.currentTarget === event.target) setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (!busy) selectFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              multiple={mode === "image"}
              disabled={busy}
              aria-label={mode === "pdf" ? "Selecionar arquivo PDF" : "Selecionar fotos de documentos"}
              onChange={(event) => selectFiles(Array.from(event.target.files ?? []))}
            />
            <div className="upload-icon"><UploadCloud size={30} /></div>
            <h2>{mode === "pdf" ? "Envie seu arquivo PDF" : "Envie fotos do documento"}</h2>
            <p>Arraste e solte aqui ou</p>
            <button className="button button-secondary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
              Escolher {mode === "pdf" ? "PDF" : "imagens"}
            </button>
            <small>
              {mode === "pdf"
                ? "PDF de até 25 MB e 40 páginas"
                : "JPG, PNG, WebP, BMP ou TIFF · até 10 imagens"}
            </small>
          </div>

          {files.length > 0 && (
            <div className="selected-files" aria-live="polite">
              <div className="selected-files-title">
                <strong>{files.length === 1 ? "Arquivo selecionado" : `${files.length} arquivos selecionados`}</strong>
                {!busy && <button type="button" onClick={reset}>Limpar</button>}
              </div>
              <ul>
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}`}>
                    <span className="file-type-icon">
                      {mode === "pdf" ? <FileText size={18} /> : <ImageIcon size={18} />}
                    </span>
                    <span className="file-meta"><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span>
                    {!busy && (
                      <button type="button" aria-label={`Remover ${file.name}`} onClick={() => removeFile(index)}>
                        <X size={18} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {files.length > 0 && (
            <div className="conversion-settings">
              <label htmlFor="ocr-language"><Languages size={18} /> Idioma principal do documento</label>
              <select id="ocr-language" value={language} disabled={busy} onChange={(event) => setLanguage(event.target.value as OcrLanguage)}>
                {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <small>Usado apenas quando for necessário reconhecer texto em imagens.</small>
            </div>
          )}

          {busy && (
            <div className="progress-panel" aria-live="polite">
              <div className="progress-copy"><span>{progress.label}</span><strong>{progress.percent}%</strong></div>
              <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
              <small>Não feche esta página durante o processamento.</small>
            </div>
          )}

          {error && <div className="form-alert form-alert-error" role="alert">{error}</div>}

          <button className="button button-primary convert-button" type="button" disabled={busy || files.length === 0} onClick={convert}>
            {busy ? <><LoaderCircle className="spin" size={20} /> Convertendo…</> : <><Sparkles size={20} /> Converter para Word</>}
          </button>

          <div className="local-note"><LockKeyhole size={17} /><span><strong>Seus arquivos ficam com você.</strong> O processamento acontece neste navegador.</span></div>
        </div>
      ) : (
        <div className="result-panel" aria-live="polite">
          <div className="success-icon"><CheckCircle2 size={30} /></div>
          <span className="eyebrow eyebrow-success">Conversão concluída</span>
          <h2>Seu documento está pronto</h2>
          <p>
            Preservamos o tamanho, as posições e os elementos visuais de {result.pages}{" "}
            {result.pages === 1 ? "página" : "páginas"}
            {result.usedOcr ? " usando reconhecimento óptico quando necessário" : ""}.
          </p>
          <label className="editor-label" htmlFor="result-text"><PencilLine size={17} /> Texto editável</label>
          <textarea id="result-text" value={editableText} onChange={(event) => setEditableText(event.target.value)} spellCheck="true" />
          <small className="editor-help">
            Você pode corrigir o texto antes de baixar. Para manter as posições com maior precisão,
            evite adicionar ou remover linhas inteiras; no Word, todo o texto continuará editável.
          </small>
          <div className="result-actions">
            <button className="button button-ghost" type="button" onClick={reset}><RotateCcw size={18} /> Nova conversão</button>
            <button className="button button-primary" type="button" disabled={downloading || !editableText.trim()} onClick={download}>
              {downloading ? <LoaderCircle className="spin" size={19} /> : <Download size={19} />}
              {downloading ? "Gerando Word…" : "Baixar Word"}
            </button>
          </div>
          {error && <div className="form-alert form-alert-error" role="alert">{error}</div>}
        </div>
      )}
    </section>
  );
}
