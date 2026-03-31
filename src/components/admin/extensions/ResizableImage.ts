import ImageExt from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageView from "./ResizableImageView";

const ALIGN_STYLES: Record<string, string> = {
  left:   "float:left;margin:0 16px 8px 0",
  right:  "float:right;margin:0 0 8px 16px",
  center: "display:block;margin:0 auto",
};

const ResizableImageExt = ImageExt.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.style.width || el.getAttribute("width") || null,
        renderHTML: () => ({}), // tratado no renderHTML do nó abaixo
      },
      align: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-align") || null,
        renderHTML: () => ({}), // tratado no renderHTML do nó abaixo
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    // width e align têm renderHTML:()=>({}) — não chegam em HTMLAttributes.
    // Lemos direto de node.attrs, que sempre tem os valores brutos.
    const width = node.attrs.width as string | null;
    const align = node.attrs.align as string | null;

    // Monta o style inline consolidado
    const parts: string[] = ["max-width:100%;height:auto"];
    if (width) parts.push(`width:${width}`);
    if (align && ALIGN_STYLES[align]) parts.push(ALIGN_STYLES[align]);

    const attrs: Record<string, unknown> = {
      ...HTMLAttributes,
      style: parts.join(";"),
    };
    if (align) attrs["data-align"] = align; // mantém para parseHTML de round-trip

    return ["img", mergeAttributes(this.options.HTMLAttributes, attrs)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImageExt;
