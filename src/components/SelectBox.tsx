"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption { value: string; label: string }

interface Props {
  value: string;
  options: (string | SelectOption)[];
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}

function normalize(opt: string | SelectOption): SelectOption {
  return typeof opt === "string" ? { value: opt, label: opt } : opt;
}

export function SelectBox({ value, options, onChange, style }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opts = options.map(normalize);
  const selected = opts.find(o => o.value === value);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button
        type="button"
        className="input"
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={15} style={{ color: "var(--stone)", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden" }}>
          {opts.map(opt => (
            <button
              key={opt.value}
              type="button"
              style={{ width: "100%", textAlign: "left", padding: "9px 14px", background: opt.value === value ? "var(--cream)" : "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--ink)", fontWeight: opt.value === value ? 600 : 400 }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
