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
  onImageInserted?: (url: string) => void;
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
  onImageInserted,
}: RichEditorProps) {
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiErr,        setAiErr]        = useState("");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [aiAction,     setAiAction]     = useState<"generate"|"rewrite"|"summarize"|"tone">("generate");
  const [aiDirection,  setAiDirection]  = useState("");
  const [aiTone,       setAiTone]       = useState<"institucional"|"jornalistico"|"descontraido">("jornalistico");
  const [aiWordRange,  setAiWordRange]  = useState<[number, number]>([400, 600]);
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
        editor.commands.setContent(content, { emitUpdate: false });
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
      else {
        onContentChange(editor.getHTML());
        onImageInserted?.(data.url);
      }
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Falha de conexão.");
    }
    finally { setImgUploading(false); }
  }

  async function runAI(action: "generate"|"rewrite"|"summarize"|"tone", direction: string, tone: string, wordRange?: [number, number]) {
    if (!editor || aiLoading) return;
    setBriefingOpen(false);
    setAiErr("");

    const { from, to } = editor.state.selection;
    const fullText = editor.getText();
    const hasContent = fullText.trim().length > 0;
    const selectedText = hasContent ? editor.state.doc.textBetween(from, to, " ") : "";

    const mode = !hasContent ? "generate" : action;
    const body = selectedText || fullText;

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle, body, brandName, mode, direction, tone, wordRange }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || !data.text) { setAiErr(data.error ?? "Erro na IA."); return; }

      if (!hasContent || (selectedText.length === 0)) {
        editor.commands.setContent(data.text);
        onContentChange(editor.getHTML());
      } else {
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, data.text).run();
        onContentChange(editor.getHTML());
      }
      onAIUsed?.();
      window.dispatchEvent(new Event("credits-changed"));
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
          onClick={() => { setAiErr(""); setBriefingOpen(true); }}
          disabled={aiLoading || !title.trim() || !subtitle.trim()}
          title={!title.trim() || !subtitle.trim() ? "Preencha o título e o subtítulo para usar a IA" : "Gerar ou reescrever com IA"}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 12px", width: "auto", background: aiLoading ? "#e6a800" : (!title.trim() || !subtitle.trim()) ? "var(--line)" : "#FAB500", color: (!title.trim() || !subtitle.trim()) ? "var(--stone)" : "#000", fontWeight: 700, fontSize: 13, borderRadius: 99, height: 32, cursor: (!title.trim() || !subtitle.trim()) ? "not-allowed" : "pointer" }}
        >
          {aiLoading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
          {aiLoading ? "Gerando…" : "Gerar ou reescrever com IA"}
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

    {briefingOpen && (
      <AIBriefingModal
        title={title}
        subtitle={subtitle}
        action={aiAction}
        direction={aiDirection}
        tone={aiTone}
        wordRange={aiWordRange}
        onActionChange={setAiAction}
        onDirectionChange={setAiDirection}
        onToneChange={setAiTone}
        onWordRangeChange={setAiWordRange}
        onConfirm={() => runAI(aiAction, aiDirection, aiTone, aiWordRange)}
        onClose={() => setBriefingOpen(false)}
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

// ── AI Briefing Modal ────────────────────────────────────────────────────────

const AI_ACTIONS = [
  { key: "generate",  label: "Gerar do zero"  },
  { key: "rewrite",   label: "Reescrever"     },
  { key: "summarize", label: "Resumir"         },
  { key: "tone",      label: "Ajustar tom"    },
] as const;

const AI_TONES = [
  { key: "institucional",  label: "Institucional"  },
  { key: "jornalistico",   label: "Jornalístico"   },
  { key: "descontraido",   label: "Descontraído"   },
] as const;

const WORD_PRESETS: { label: string; range: [number, number] }[] = [
  { label: "Curto (200–350)",   range: [200, 350] },
  { label: "Médio (400–600)",   range: [400, 600] },
  { label: "Longo (700–1000)",  range: [700, 1000] },
];

function AIBriefingModal({ title, subtitle, action, direction, tone, wordRange, onActionChange, onDirectionChange, onToneChange, onWordRangeChange, onConfirm, onClose }: {
  title: string; subtitle: string;
  action: "generate"|"rewrite"|"summarize"|"tone";
  direction: string; tone: string;
  wordRange: [number, number];
  onActionChange: (v: "generate"|"rewrite"|"summarize"|"tone") => void;
  onDirectionChange: (v: string) => void;
  onToneChange: (v: "institucional"|"jornalistico"|"descontraido") => void;
  onWordRangeChange: (v: [number, number]) => void;
  onConfirm: () => void; onClose: () => void;
}) {
  const canConfirm = title.trim().length > 0 && subtitle.trim().length > 0;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const mono: React.CSSProperties = { fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 8 };
  const chipBase: React.CSSProperties = { border: "1px solid var(--line)", borderRadius: 99, padding: "6px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", background: "none", transition: "all .14s" };
  const chipOn:   React.CSSProperties = { ...chipBase, background: "#FAB500", borderColor: "#FAB500", color: "#000", fontWeight: 700 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ background: "var(--paper,#fff)", borderRadius: 18, width: 480, maxWidth: "calc(100vw - 32px)", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 16px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: "#FAB500", display: "grid", placeItems: "center" }}>
              <Sparkles size={16} color="#000" />
            </span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>Direcionamento para a IA</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--stone)", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Title/subtitle validation */}
          {(!title.trim() || !subtitle.trim()) && (
            <div style={{ background: "rgba(250,181,0,0.10)", border: "1px solid rgba(250,181,0,0.35)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink,#111)", lineHeight: 1.5 }}>
              <strong>Título e subtítulo obrigatórios.</strong> Preencha-os no editor antes de gerar — eles são o ponto de partida da IA.
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  {title.trim() ? "✅" : "⬜"} <span style={{ color: title.trim() ? "var(--green,#2f8a5b)" : "var(--stone)" }}>Título</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  {subtitle.trim() ? "✅" : "⬜"} <span style={{ color: subtitle.trim() ? "var(--green,#2f8a5b)" : "var(--stone)" }}>Subtítulo</span>
                </span>
              </div>
            </div>
          )}

          {/* O que você quer? */}
          <div>
            <label style={mono}>O que você quer?</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AI_ACTIONS.map(a => (
                <button key={a.key} type="button"
                  style={action === a.key ? chipOn : chipBase}
                  onClick={() => onActionChange(a.key)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tom */}
          <div>
            <label style={mono}>Tom</label>
            <div style={{ display: "flex", gap: 8 }}>
              {AI_TONES.map(t => (
                <button key={t.key} type="button"
                  style={tone === t.key ? chipOn : chipBase}
                  onClick={() => onToneChange(t.key as "institucional"|"jornalistico"|"descontraido")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contagem de palavras */}
          <div>
            <label style={mono}>Contagem de palavras</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {WORD_PRESETS.map(p => {
                const active = wordRange[0] === p.range[0] && wordRange[1] === p.range[1];
                return (
                  <button key={p.label} type="button"
                    style={active ? chipOn : chipBase}
                    onClick={() => onWordRangeChange(p.range)}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orientação livre */}
          <div>
            <label style={mono}>Orientação <span style={{ textTransform: "none", letterSpacing: 0, fontSize: 10 }}>(opcional · máx. 280 caracteres)</span></label>
            <textarea
              value={direction}
              onChange={e => onDirectionChange(e.target.value.slice(0, 280))}
              placeholder="Ex: Foque nos benefícios para o consumidor final, use linguagem direta e evite jargões técnicos."
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", resize: "none", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "var(--sans)", lineHeight: 1.5, background: "var(--bg,#f9f9f9)", color: "var(--ink)" }}
            />
            <div style={{ textAlign: "right", fontSize: 11, color: "var(--stone)", marginTop: 4 }}>{direction.length}/280</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "0 22px 20px" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-sm"
            disabled={!canConfirm}
            onClick={onConfirm}
            style={{ background: canConfirm ? "#FAB500" : "var(--line)", color: canConfirm ? "#000" : "var(--stone)", border: "none", fontWeight: 700, gap: 6, cursor: canConfirm ? "pointer" : "not-allowed", transition: "all .15s" }}
          >
            <Sparkles size={14} /> Gerar com IA · 25 créditos
          </button>
        </div>
      </div>
    </div>
  );
}
