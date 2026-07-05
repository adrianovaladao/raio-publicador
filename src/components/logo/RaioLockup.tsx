import Image from "next/image";

interface RaioLockupProps {
  /** "dark" = logotipo branco (fundos escuros). "light" = logotipo preto (fundos claros). */
  variant?: "dark" | "light";
  height?: number;
  className?: string;
}

/**
 * Logotipo oficial do Raio Publicador.
 * O SVG inclui o símbolo (colchete + raio âmbar) e o wordmark.
 * Use variant="dark" em fundos escuros e variant="light" em fundos claros.
 */
export function RaioLockup({ variant = "dark", height = 28, className }: RaioLockupProps) {
  const aspectRatio = 388 / 72; // dimensões originais do SVG
  const width = Math.round(height * aspectRatio);

  return (
    <Image
      src="/assets/logo/raio-logo.svg"
      alt="Raio Publicador"
      width={width}
      height={height}
      className={className}
      style={{
        height,
        width: "auto",
        // O SVG usa "white" no wordmark — em fundos claros invertemos
        filter: variant === "light" ? "invert(1) brightness(0)" : undefined,
      }}
      priority
    />
  );
}
