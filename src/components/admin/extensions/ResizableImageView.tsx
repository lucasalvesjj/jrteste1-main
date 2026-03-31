import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewRendererProps } from "@tiptap/core";
import { useRef, useState } from "react";

const MIN_WIDTH = 80;

export default function ResizableImageView({
  node,
  updateAttributes,
  selected,
}: NodeViewRendererProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  const { src, alt, title, width, align } = node.attrs as {
    src: string;
    alt?: string;
    title?: string;
    width?: string;
    align?: string;
  };

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startWidth = imgRef.current!.getBoundingClientRect().width;
    const editorEl = imgRef.current!.closest(".ProseMirror");
    const maxWidth = editorEl ? editorEl.clientWidth - 16 : 9999;
    setIsResizing(true);

    function onMove(ev: PointerEvent) {
      const newWidth = Math.min(
        maxWidth,
        Math.max(MIN_WIDTH, startWidth + (ev.clientX - startX))
      );
      setLiveWidth(Math.round(newWidth));
      if (imgRef.current) imgRef.current.style.width = `${newWidth}px`;
    }

    function onUp(ev: PointerEvent) {
      const finalWidth = Math.min(
        maxWidth,
        Math.max(MIN_WIDTH, startWidth + (ev.clientX - startX))
      );
      updateAttributes({ width: `${Math.round(finalWidth)}px` });
      setIsResizing(false);
      setLiveWidth(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <NodeViewWrapper data-align={align ?? undefined}>
      <div
        className="image-resize-container"
        data-selected={selected || undefined}
        contentEditable={false}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ""}
          title={title}
          className="media-content-image"
          loading="lazy"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            maxWidth: "100%",
            height: "auto",
            width: width ?? undefined,
          }}
        />
        {selected && (
          <div className="resize-overlay">
            {/* Botões de alinhamento */}
            <div className="image-align-buttons">
              <button
                className={`align-btn${align === "left" ? " active" : ""}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  updateAttributes({ align: align === "left" ? null : "left" });
                }}
                title="Alinhar à esquerda (texto ao lado)"
              >
                ◀
              </button>
              <button
                className={`align-btn${!align || align === "center" ? " active" : ""}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  updateAttributes({ align: "center" });
                }}
                title="Centralizar"
              >
                ■
              </button>
              <button
                className={`align-btn${align === "right" ? " active" : ""}`}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  updateAttributes({ align: align === "right" ? null : "right" });
                }}
                title="Alinhar à direita (texto ao lado)"
              >
                ▶
              </button>
            </div>
            {/* Handles de resize */}
            <div
              className="resize-handle handle-e"
              onPointerDown={onPointerDown}
            />
            <div
              className="resize-handle handle-se"
              onPointerDown={onPointerDown}
            />
            {isResizing && liveWidth !== null && (
              <div className="resize-tooltip">{liveWidth}px</div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
