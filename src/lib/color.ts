function pixelsToColor(data: Uint8ClampedArray): string {
  let whiteCount = 0;
  let darkCount  = 0;
  let totalOpaque = 0;
  const counts: Record<string, number> = {};

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    totalOpaque++;

    const brightness = (r + g + b) / 3;

    if (brightness > 230) { whiteCount++; continue; }
    if (brightness < 25)  { darkCount++;  continue; }

    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;

    const max = Math.max(qr, qg, qb);
    const min = Math.min(qr, qg, qb);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const weight = 1 + saturation * 3;

    const key = `${qr},${qg},${qb}`;
    counts[key] = (counts[key] ?? 0) + weight;
  }

  if (totalOpaque === 0) return "#1A1A1A";

  // Se mais de 55% dos pixels opacos são brancos → fundo branco
  if (whiteCount / totalOpaque > 0.55) return "#FFFFFF";

  // Se mais de 55% são pretos/escuros → fundo escuro
  if (darkCount / totalOpaque > 0.55) return "#1A1A1A";

  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!best) return "#1A1A1A";

  const [r, g, b] = best[0].split(",").map(Number);
  const toHex = (n: number) => Math.min(255, n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function drawAndExtract(img: HTMLImageElement): string {
  const SIZE = 80;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#1A1A1A";
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  return pixelsToColor(ctx.getImageData(0, 0, SIZE, SIZE).data);
}

/** Extrai a cor dominante de um File local (upload). */
export function extractDominantColor(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => { resolve(drawAndExtract(img)); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve("#1A1A1A"); };
    img.src = url;
  });
}

/** Extrai a cor dominante de uma URL pública (logo já salvo). */
export function extractDominantColorFromUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(drawAndExtract(img));
    img.onerror = () => resolve("#1A1A1A");
    img.src = src;
  });
}
