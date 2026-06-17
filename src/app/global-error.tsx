"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "sans-serif", padding: 40, background: "#f5f5f0", minHeight: "100vh" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ color: "#c0392b", fontSize: 22 }}>Erro na aplicação</h1>
          <p style={{ color: "#555", marginBottom: 8 }}>Detalhes do erro (copie e envie para o suporte):</p>
          <pre style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, fontSize: 13, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {error?.message ?? "Sem mensagem"}
            {"\n\n"}
            {error?.stack ?? "Sem stack trace"}
            {error?.digest ? `\n\nDigest: ${error.digest}` : ""}
          </pre>
          <button
            onClick={reset}
            style={{ marginTop: 16, padding: "10px 20px", background: "#FAB500", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
