"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useState, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2,
  List, ListOrdered, Quote, Link as LinkIcon, Undo, Redo,
  Sparkles, Loader,
} from "lucide-react";

interface RichEditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  subtitle: string;
  onSubtitleChange: (v: string) => void;
  content: string;
  onContentChange: (html: string) => void;
  brandName?: string;
}

export function RichEditor({
  title, onTitleChange,
  subtitle, onSubtitleChange,
  content, onContentChange,
  brandName,
}: RichEditorProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr,     setAiErr]     = useState("");

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
    ],
    content: content || "",
    onUpdate: ({ editor }) => onContentChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "tiptap-body" },
    },
    immediatelyRender: false,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  async function runAI() {
    if (!editor || aiLoading) return;
    setAiErr("");
    setAiLoading(true);
    try {
      const currentBody = editor.getText();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle, body: currentBody, brandName }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || !data.text) { setAiErr(data.error ?? "Erro na IA."); return; }
      editor.commands.setContent(data.text);
      onContentChange(editor.getHTML());
    } catch { setAiErr("Falha de conexão com a IA."); }
    finally { setAiLoading(false); }
  }

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
    <div className="card editor">
      <div className="toolbtns">
        {/* Text style */}
        {btn(editor.isActive("bold"),      () => editor.chain().focus().toggleBold().run(),      <Bold size={15} />,          "Negrito (Ctrl+B)")}
        {btn(editor.isActive("italic"),    () => editor.chain().focus().toggleItalic().run(),    <Italic size={15} />,        "Itálico (Ctrl+I)")}
        {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={15} />, "Sublinhado (Ctrl+U)")}

        <span className="div" />

        {/* Headings & lists */}
        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={15} />, "Subtítulo")}
        {btn(editor.isActive("bulletList"),   () => editor.chain().focus().toggleBulletList().run(),  <List size={15} />,        "Lista")}
        {btn(editor.isActive("orderedList"),  () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={15} />, "Lista numerada")}
        {btn(editor.isActive("blockquote"),   () => editor.chain().focus().toggleBlockquote().run(),  <Quote size={15} />,       "Citação")}
        {btn(editor.isActive("link"),         setLink,                                                <LinkIcon size={15} />,    "Inserir link")}

        <span className="div" />

        {/* History */}
        <button type="button" className="tb" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer">
          <Undo size={15} />
        </button>
        <button type="button" className="tb" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer">
          <Redo size={15} />
        </button>

        <div style={{ flex: 1 }} />

        {/* AI */}
        <button
          type="button"
          className="tb ai-btn"
          onClick={runAI}
          disabled={aiLoading}
          title="Melhorar com IA"
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 10px", width: "auto", color: "var(--coral-ink)", fontWeight: 600, fontSize: 13 }}
        >
          {aiLoading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
          {aiLoading ? "Gerando…" : "✦ IA"}
        </button>
      </div>

      {aiErr && (
        <div style={{ padding: "6px 16px", background: "var(--red-soft,#fff0f0)", fontSize: 12, color: "var(--red,#c0392b)", borderBottom: "1px solid var(--line)" }}>
          {aiErr}
        </div>
      )}

      <div className="body-pad">
        <input
          className="title-input"
          placeholder="Título do release"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
        />
        <input
          className="sub-input"
          placeholder="Subtítulo / linha de apoio"
          value={subtitle}
          onChange={e => onSubtitleChange(e.target.value)}
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
