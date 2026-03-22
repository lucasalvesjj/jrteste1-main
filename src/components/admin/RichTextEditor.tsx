import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Image,
  Undo, Redo, Code, Quote, Minus,
} from "lucide-react";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  error?: boolean;
}

const ToolbarButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
  >
    {children}
  </button>
);

const Separator = () => <div className="w-px h-6 bg-border mx-1" />;

const RichTextEditor = ({ content, onChange, error }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ inline: false }),
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Comece a escrever o conteúdo do post..." }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL do link:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL da imagem:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={`border rounded-lg bg-background overflow-hidden ${error ? "border-destructive" : "border-input"}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/50">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Código">
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinhar esquerda">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centralizar">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinhar direita">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton active={editor.isActive("link")} onClick={addLink} title="Inserir link">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Inserir imagem">
          <Image className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
