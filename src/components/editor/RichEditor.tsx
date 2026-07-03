"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2,
  List, ListOrdered, Quote, Link as LinkIcon, Undo, Redo,
  Sparkles, Loader, X, Image as ImageIcon,
} from "lucide-react";

// ── Figure NodeView ──────────────────────────────────────────────────────────

function FigureView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <figure className="editor-figure" contentEditable={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={node.attrs.src as string} className="editor-img" alt={node.attrs.caption as string || ""} />
        <figcaption>
          <input
            className="figure-caption-input"
            placeholder="Fonte: Getty Images, Divulgação, Arquivo pessoal…"
            value={(node.attrs.caption as string) || ""}
            onChange={e => updateAttributes({ caption: e.target.value })}
          />
        </figcaption>
      </figure>
    </NodeViewWrapper>
  );
}

const FigureExtension = Node.create({
  name: "figure",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src:     { default: null },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{
      tag: "figure",
      getAttrs: (node) => ({
        src:     (node as HTMLElement).querySelector("img")?.getAttribute("src") ?? null,
        caption: (node as HTMLElement).querySelector("figcaption")?.textContent ?? "",
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure", mergeAttributes({ class: "editor-figure" }),
      ["img", { src: HTMLAttributes.src, class: "editor-img", alt: HTMLAttributes.caption || "" }],
      ["figcaption", {}, HTMLAttributes.caption || ""],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

interface RichEditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  subtitle: string;
  onSubtitleChange: (v: string) => void;
  content: string;
  onContentChange: (html: string) => void;
  brandName?: string;
  onAIUsed?: () => void;
}

function AutoTextarea({ className, value, onChange, placeholder, style }: {
  className?: string; value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      placeholder={placeholder}
      rows={1}
      style={{ resize: "none", overflow: "hidden", ...style }}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────

export function RichEditor({
  title, onTitleChange,
  subtitle, onSubtitleChange,
  content, onContentChange,
  brandName,
  onAIUsed,
}: RichEditorProps) {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiErr,      setAiErr]      = useState("");
  const [wordCount,  setWordCount]  = useState(0);
  const [linkModal,  setLinkModal]  = useState<{ open: boolean; initial: string }>({ open: false, initial: "" });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Placeholder.configure({ placeholder: "Escreva o corpo do release… Comece com o lide: o quê, quem, quando, onde e por quê." }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "editor-link" } }),
      FigureExtension,
    ],
    content: content || "",
    onCreate: ({ editor }) => {
      // Restore content when editor remounts (e.g. navigating between steps)
      if (content && editor.isEmpty) {
        editor.commands.setContent(content, false);
      }
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
      const words = editor.getText().trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
    },
    editorProps: {
      attributes: { class: "tiptap-body" },
    },
    immediatelyRender: false,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkModal({ open: true, initial: prev ?? "https://" });
  }, [editor]);

  function applyLink(url: string) {
    if (!editor) return;
    setLinkModal({ open: false, initial: "" });
    if (!url.trim()) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  async function handleImageFile(file: File) {
    if (!editor || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { setAiErr("Imagem muito grande (máx. 5 MB)."); return; }
    setImgUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) { setAiErr(data.error ?? "Falha no upload da imagem."); return; }
      const ok = editor.chain().focus().insertContent({
        type: "figure",
        attrs: { src: data.url, caption: "" },
      }).run();
      if (!ok) setAiErr("Não foi possível inserir a imagem no editor.");
      else onContentChange(editor.getHTML());
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Falha de conexão.");
    }
    finally { setImgUploading(false); }
  }

  async function runAI() {
    if (!editor || aiLoading) return;
    setAiErr("");

    const { from, to, empty } = editor.state.selection;
    const fullText = editor.getText();
    const hasContent = fullText.trim().length > 0;

    if (hasContent && empty) {
      setAiErr("Selecione um trecho para a IA editar, ou apague o conteúdo para gerar do zero.");
      return;
    }

    setAiLoading(true);
    try {
      if (!hasContent) {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, subtitle, body: "", brandName, mode: "generate" }),
        });
        const data = await res.json() as { text?: string; error?: string };
        if (!res.ok || !data.text) { setAiErr(data.error ?? "Erro na IA."); return; }
        editor.commands.setContent(data.text);
        onContentChange(editor.getHTML());
        onAIUsed?.();
      } else {
        const selectedText = editor.state.doc.textBetween(from, to, " ");
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, subtitle, body: selectedText, brandName, mode: "rewrite" }),
        });
        const data = await res.json() as { text?: string; error?: string };
        if (!res.ok || !data.text) { setAiErr(data.error ?? "Erro na IA."); return; }
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, data.text).run();
        onContentChange(editor.getHTML());
        onAIUsed?.();
      }
    } catch { setAiErr("Falha de conexão com a IA."); }
    finally { setAiLoading(false); }
  }

  const RECOMMENDED = 600;
  const wordPct   = Math.min(wordCount / RECOMMENDED, 1);
  const wordOver  = wordCount > RECOMMENDED * 1.2;
  const wordDone  = wordCount >= RECOMMENDED * 0.9 && !wordOver;
  const wordColor = wordOver ? "var(--red,#c0392b)" : wordDone ? "var(--green,#2f8a5b)" : "var(--stone)";

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      className={`tb${active ? " on" : ""}`}
      onClick={onClick}
      title={title}
      style={{ color: active ? "var(--ink)" : undefined }}
    >
      {children}
    </button>
  );

  return (
    <>
    <input
      ref={imageFileRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style={{ display: "none" }}
      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
    />
    <div className="card editor">
      <div className="toolbtns">
        {btn(editor.isActive("bold"),      () => editor.chain().focus().toggleBold().run(),      <Bold size={15} />,          "Negrito (Ctrl+B)")}
        {btn(editor.isActive("italic"),    () => editor.chain().focus().toggleItalic().run(),    <Italic size={15} />,        "Itálico (Ctrl+I)")}
        {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={15} />, "Sublinhado (Ctrl+U)")}

        <span className="div" />

        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={15} />, "Subtítulo")}
        {btn(editor.isActive("bulletList"),   () => editor.chain().focus().toggleBulletList().run(),  <List size={15} />,        "Lista")}
        {btn(editor.isActive("orderedList"),  () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={15} />, "Lista numerada")}
        {btn(editor.isActive("blockquote"),   () => editor.chain().focus().toggleBlockquote().run(),  <Quote size={15} />,       "Citação")}
        {btn(editor.isActive("link"),         setLink,                                                <LinkIcon size={15} />,    "Inserir link")}

        <span className="div" />

        <button type="button" className="tb" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer">
          <Undo size={15} />
        </button>
        <button type="button" className="tb" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer">
          <Redo size={15} />
        </button>

        <span className="div" />
        <button
          type="button"
          className={`tb${imgUploading ? " on" : ""}`}
          onClick={() => imageFileRef.current?.click()}
          title="Inserir imagem"
          disabled={imgUploading}
        >
          <ImageIcon size={15} />
        </button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          className="tb ai-btn"
          onClick={runAI}
          disabled={aiLoading}
          title="Gerar ou reescrever com IA (custa 25 créditos)"
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 10px", width: "auto", color: "var(--coral-ink)", fontWeight: 600, fontSize: 13 }}
        >
          {aiLoading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
          {aiLoading ? "Gerando…" : "✦ IA · 25 créditos"}
        </button>
      </div>

      {aiErr && (
        <div style={{ padding: "6px 16px", background: "var(--red-soft,#fff0f0)", fontSize: 12, color: "var(--red,#c0392b)", borderBottom: "1px solid var(--line)" }}>
          {aiErr}
        </div>
      )}

      <div className="body-pad">
        <AutoTextarea
          className="title-input"
          placeholder="Título do release"
          value={title}
          onChange={onTitleChange}
        />
        <AutoTextarea
          className="sub-input"
          placeholder="Subtítulo / linha de apoio"
          value={subtitle}
          onChange={onSubtitleChange}
        />
        <EditorContent editor={editor} />
      </div>

      <div style={{ padding: "10px 26px 14px", borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--stone)" }}>Contagem de palavras</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: wordColor, fontFamily: "var(--mono)" }}>
            {wordCount} <span style={{ fontWeight: 400, color: "var(--stone)" }}>/ {RECOMMENDED} recomendadas</span>
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: "var(--line)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${wordPct * 100}%`,
            borderRadius: 99,
            background: wordOver ? "var(--red,#c0392b)" : wordDone ? "var(--green,#2f8a5b)" : "var(--coral)",
            transition: "width 0.2s, background 0.3s",
          }} />
        </div>
        {wordOver && (
          <p style={{ fontSize: 11, color: "var(--red,#c0392b)", margin: "5px 0 0" }}>
            {wordCount - RECOMMENDED} palavras acima do recomendado
          </p>
        )}
      </div>
    </div>

    {linkModal.open && (
      <LinkModal
        initial={linkModal.initial}
        onConfirm={applyLink}
        onClose={() => setLinkModal({ open: false, initial: "" })}
      />
    )}
    </>
  );
}

function LinkModal({ initial, onConfirm, onClose }: {
  initial: string;
  onConfirm: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 9999, display: "grid", placeItems: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, width: 420, maxWidth: "calc(100vw - 32px)", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--sans)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
            Inserir link
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)", padding: 4, borderRadius: 6, display: "flex" }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: "18px 20px" }}>
          <label style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 8 }}>
            URL
          </label>
          <input
            ref={inputRef}
            className="input"
            style={{ width: "100%", boxSizing: "border-box" }}
            placeholder="https://exemplo.com.br"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onConfirm(url); } }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "0 20px 18px" }}>
          {url && url !== "https://" && (
            <button className="btn btn-ghost btn-sm" onClick={() => onConfirm("")}>
              Remover link
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onConfirm(url)}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
