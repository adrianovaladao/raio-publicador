/**
 * Extrai a cor dominante de um arquivo de imagem via Canvas API.
 * Pula pixels transparentes, quase-brancos e quase-pretos para
 * encontrar a cor cromática mais representativa do logotipo.
 */
export function extractDominantColor(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const SIZE = 80; // downsample — suficiente para extrair cor, muito mais rápido
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); resolve("#1A1A1A"); return; }

      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);

      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
      const counts: Record<string, number> = {};

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue; // transparente

        const brightness = (r + g + b) / 3;
        if (brightness > 230) continue; // quase-branco
        if (brightness < 25)  continue; // quase-preto

        // quantiza para reduzir espaço de cores (passos de 24)
        const qr = Math.round(r / 24) * 24;
        const qg = Math.round(g / 24) * 24;
        const qb = Math.round(b / 24) * 24;

        // penaliza cinzas (baixa saturação) para preferir cores vivas
        const max = Math.max(qr, qg, qb);
        const min = Math.min(qr, qg, qb);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const weight = 1 + saturation * 3; // cores saturadas valem mais

        const key = `${qr},${qg},${qb}`;
        counts[key] = (counts[key] ?? 0) + weight;
      }

      const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (!best) { resolve("#1A1A1A"); return; }

      const [r, g, b] = best[0].split(",").map(Number);
      const toHex = (n: number) => Math.min(255, n).toString(16).padStart(2, "0");
      resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve("#1A1A1A"); };
    img.src = url;
  });
}
