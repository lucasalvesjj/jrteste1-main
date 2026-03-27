import { EditorContent, useEditor } from "@tiptap/react";
import { Node } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import ImageExt from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Clipboard,
  ClipboardPaste,
  Code,
  Eraser,
  FolderOpen,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  PaintBucket,
  Quote,
  Redo,
  Sparkles,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
  Unlink,
} from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useMediaStore } from "@/stores/mediaStore";
import { useAdapterInfo } from "@/hooks/useAdapterInfo";
import { validateMediaFile } from "@/data/mediaTypes";
import { toast } from "sonner";

const MediaLibrary = lazy(() => import("./media/MediaLibrary"));

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  error?: boolean;
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}

const ToolbarButton = ({ active, onClick, children, title }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`rounded p-1.5 transition-colors ${
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`}
  >
    {children}
  </button>
);

const Separator = () => <div className="mx-1 h-6 w-px bg-border" />;

const colorOptions = [
  { label: "Padrão", value: "" },
  { label: "Verde", value: "#2f6f4f" },
  { label: "Laranja", value: "#b5651d" },
  { label: "Azul", value: "#1d4ed8" },
  { label: "Cinza escuro", value: "#374151" },
  { label: "Vermelho", value: "#b91c1c" },
] as const;

const highlightOptions = [
  { label: "Sem destaque", value: "" },
  { label: "Amarelo", value: "#fef08a" },
  { label: "Verde suave", value: "#bbf7d0" },
  { label: "Azul suave", value: "#bfdbfe" },
  { label: "Laranja suave", value: "#fed7aa" },
] as const;

const DivBlock = Node.create({
  name: "divBlock",
  group: "block",
  content: "inline*",
  defining: true,
  parseHTML() {
    return [{ tag: "div" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setDivBlock:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
    } as any;
  },
});

const normalizeHtml = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const extractPlainText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const EditorInputPanel = ({
  title,
  value,
  onChange,
  onConfirm,
  onCancel,
  confirmLabel,
  placeholder,
  multiline = false,
  helper,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  placeholder: string;
  multiline?: boolean;
  helper?: string;
}) => (
  <div className="border-b border-border bg-card p-3">
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={7}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    ) : (
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    )}
    {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {confirmLabel}
      </button>
    </div>
  </div>
);

const MediaLibraryLoadingOverlay = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Carregando biblioteca...
    </div>
  </div>
);

const RichTextEditor = ({ content, onChange, error }: RichTextEditorProps) => {
  const [activePanel, setActivePanel] = useState<"link" | "paste" | "plain-paste" | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [pasteValue, setPasteValue] = useState("");

  // ── Upload via galeria (vetores drag e paste) ──
  const uploadItem = useMediaStore((s) => s.uploadItem);
  const { isManual } = useAdapterInfo();
  // Ref para acesso ao editor dentro dos handlers de evento sem re-render
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  /**
   * Recebe um File de imagem, faz upload pela galeria e insere no editor.
   * Bloqueia qualquer inserção de base64 ou URL externa.
   */
  const uploadAndInsert = useCallback(
    async (file: File) => {
      // ── Guard: modo produção estática — upload geraria downloads, não URLs ──
      // O manualAdapter não salva arquivos no servidor — dispara downloads locais.
      // Inserir a URL no editor resultaria em imagem quebrada após reload.
      if (isManual) {
        toast.warning(
          "Modo produção: arraste imagens não suportado neste ambiente.",
          {
            description:
              "Use o botão 📂 da toolbar para selecionar imagens já disponíveis " +
              "na galeria, ou faça o upload manual e atualize o catálogo primeiro.",
            duration: 8000,
          }
        );
        return;
      }

      const validation = validateMediaFile(file);
      if (!validation.valid) {
        toast.error(validation.error ?? "Arquivo inválido.");
        return;
      }
      const toastId = toast.loading(`Enviando "${file.name}" para a galeria...`);
      try {
        const mediaItem = await uploadItem(file);
        toast.success(`"${file.name}" adicionado à galeria.`, { id: toastId });
        const ed = editorRef.current;
        if (!ed) return;
        ed.chain().focus().setImage({
          src: mediaItem.paths.large,
          alt: mediaItem.alt || mediaItem.name,
          title: `${mediaItem.width}x${mediaItem.height}`,
        }).run();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro no upload";
        toast.error(msg, { id: toastId });
      }
    },
    [uploadItem, isManual]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      DivBlock,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({
        inline: false,
        HTMLAttributes: {
          class: "media-content-image",
          loading: "lazy",
          style: "max-width:100%;height:auto",
        },
      }),
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder: "Comece a escrever o conteúdo do post..." }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[320px] p-4 focus:outline-none",
      },
      // ── Vetor 1: Bloquear drag de arquivo de imagem local ──
      // TipTap chamaria handleDrop antes de inserir base64.
      // Retornar true sinaliza "evento tratado", impedindo o comportamento padrão.
      handleDrop(_, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        // Processa apenas o primeiro arquivo por drop
        void uploadAndInsert(imageFiles[0]);
        return true;
      },
      // ── Vetor 2: Bloquear paste de imagem do clipboard ──
      // Cobre Ctrl+V com imagem copiada ou Print Screen.
      handlePaste(_, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((i) => i.type.startsWith("image/"));
        if (!imageItem) return false;
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) void uploadAndInsert(file);
        return true;
      },
    },
  });

  // Mantém a ref sincronizada com a instância atual do editor
  useEffect(() => {
    (editorRef as React.MutableRefObject<typeof editor>).current = editor;
  }, [editor]);

  // ── Bloqueia download do navegador ao soltar arquivo fora da área do editor ──
  // O handleDrop do TipTap só cobre a área editável. Este listener no document
  // garante que o navegador nunca abra/baixe o arquivo, independente de onde cair.
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, []);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const plainText = useMemo(() => extractPlainText(content), [content]);
  const wordCount = plainText ? plainText.split(" ").filter(Boolean).length : 0;
  const charCount = plainText.length;

  const openLinkPanel = useCallback(() => {
    if (!editor) return;
    setLinkValue(editor.getAttributes("link").href || "");
    setActivePanel("link");
  }, [editor]);

  // ── Media Library para inserir imagem inline no editor ──
  const { open: openMediaLibraryInline, modalProps: mediaLibraryInlineProps } = useMediaLibrary({
    onSelect: (info) => {
      if (!editor) return;
      editor.chain().focus().setImage({
        src: info.url,
        alt: info.alt,
        title: `${info.width}x${info.height}`,
      }).run();
    },
    title: "Inserir Imagem no Conteúdo",
  });

  const openPastePanel = useCallback(() => {
    setPasteValue(content || "");
    setActivePanel("paste");
  }, [content]);

  const openPlainPastePanel = useCallback(() => {
    setPasteValue(extractPlainText(content));
    setActivePanel("plain-paste");
  }, [content]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    if (!linkValue.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkValue.trim() }).run();
    }

    setActivePanel(null);
  }, [editor, linkValue]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkValue("");
    setActivePanel(null);
  }, [editor]);

  const applyPastedHtml = useCallback(() => {
    if (!editor) return;
    const normalized = normalizeHtml(pasteValue);
    editor.commands.setContent(normalized || "<p></p>");
    setActivePanel(null);
  }, [editor, pasteValue]);

  const applyPlainPaste = useCallback(() => {
    if (!editor) return;
    const plain = pasteValue
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join("");
    editor.commands.setContent(plain || "<p></p>");
    setActivePanel(null);
  }, [editor, pasteValue]);

  const clearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  }, [editor]);

  const setTextColor = useCallback(
    (value: string) => {
      if (!editor) return;
      if (!value) {
        editor.chain().focus().unsetColor().run();
        return;
      }
      editor.chain().focus().setColor(value).run();
    },
    [editor]
  );

  const setHighlightColor = useCallback(
    (value: string) => {
      if (!editor) return;
      if (!value) {
        editor.chain().focus().unsetHighlight().run();
        return;
      }
      editor.chain().focus().setHighlight({ color: value }).run();
    },
    [editor]
  );

  const clearSelectedStyles = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .unsetColor()
      .unsetHighlight()
      .unsetSubscript()
      .unsetSuperscript()
      .unsetUnderline()
      .unsetStrike()
      .unsetItalic()
      .unsetBold()
      .run();
  }, [editor]);

  const copyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(normalizeHtml(editor?.getHTML() || content));
    } catch {
      // no-op
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={`overflow-hidden rounded-lg border bg-background ${error ? "border-destructive" : "border-input"}`}>
      {activePanel === "link" && (
        <EditorInputPanel
          title="Link"
          value={linkValue}
          onChange={setLinkValue}
          onConfirm={applyLink}
          onCancel={() => setActivePanel(null)}
          confirmLabel="Aplicar link"
          placeholder="https://exemplo.com.br"
        />
      )}

      {activePanel === "paste" && (
        <EditorInputPanel
          title="Colar HTML"
          value={pasteValue}
          onChange={setPasteValue}
          onConfirm={applyPastedHtml}
          onCancel={() => setActivePanel(null)}
          confirmLabel="Substituir conteúdo"
          placeholder="<h2>Título</h2><p>Texto...</p>"
          multiline
          helper="Cole o HTML pronto aqui. O editor vai normalizar espaços e substituir o conteúdo atual."
        />
      )}

      {activePanel === "plain-paste" && (
        <EditorInputPanel
          title="Colar sem formatação"
          value={pasteValue}
          onChange={setPasteValue}
          onConfirm={applyPlainPaste}
          onCancel={() => setActivePanel(null)}
          confirmLabel="Substituir por texto limpo"
          placeholder="Cole aqui um texto vindo do Word, site ou mensagem..."
          multiline
          helper="O editor vai limpar estilos e converter cada linha em parágrafo simples."
        />
      )}

      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 p-2">
        <ToolbarButton active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="Parágrafo">
          <Pilcrow className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("divBlock")} onClick={() => (editor.chain().focus() as any).setDivBlock().run()} title="DIV">
          <span className="text-[10px] font-semibold">DIV</span>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Código inline">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscrito">
          <span className="text-[10px] font-semibold">x2</span>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Sobrescrito">
          <span className="text-[10px] font-semibold">x^2</span>
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloco de código">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinhar à esquerda">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centralizar">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinhar à direita">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("link")} onClick={openLinkPanel} title="Inserir ou editar link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={removeLink} title="Remover link">
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={openMediaLibraryInline} title="Inserir imagem da biblioteca">
          <FolderOpen className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={openPastePanel} title="Colar HTML pronto">
          <Sparkles className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={openPlainPastePanel} title="Colar sem formatação">
          <ClipboardPaste className="h-4 w-4" />
        </ToolbarButton>
        <div className="flex items-center gap-1 rounded bg-background px-2 py-1">
          <PaintBucket className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={editor.getAttributes("textStyle").color || ""}
            onChange={(e) => setTextColor(e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-none"
            title="Cor do texto"
          >
            {colorOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 rounded bg-background px-2 py-1">
          <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={editor.getAttributes("highlight").color || ""}
            onChange={(e) => setHighlightColor(e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-none"
            title="Destaque"
          >
            {highlightOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <ToolbarButton active={false} onClick={clearSelectedStyles} title="Remover estilo do trecho selecionado">
          <span className="text-[10px] font-semibold">Tx</span>
        </ToolbarButton>
        <ToolbarButton active={false} onClick={clearFormatting} title="Limpar formatação">
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={() => void copyHtml()} title="Copiar HTML">
          <Clipboard className="h-4 w-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={false} onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span>{wordCount} palavras</span>
          <span>{charCount} caracteres</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span>`DIV`: bloco genérico</span>
          <span>`Minus`: divider</span>
          <span>`Sparkles`: cola HTML pronto</span>
          <span>`ClipboardPaste`: cola sem formatação</span>
          <span>`Clipboard`: copia o HTML atual</span>
          <span>`FolderOpen`: inserir imagem da biblioteca</span>
        </div>
      </div>

      <EditorContent editor={editor} />

      {/* Modal da Media Library para inserir imagens inline */}
      <Suspense fallback={<MediaLibraryLoadingOverlay />}>
        <MediaLibrary {...mediaLibraryInlineProps} />
      </Suspense>
    </div>
  );
};

export default RichTextEditor;
