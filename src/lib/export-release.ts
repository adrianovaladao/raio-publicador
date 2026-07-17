import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { saveAs } from "file-saver";

interface ReleaseExport {
  title: string;
  summary: string | null;
  body: string;
  shortId: string;
  brandName?: string | null;
  vehicleNames?: Array<{ name: string }>;
  publishedVehicleUrls?: Record<string, string> | null;
}

function htmlToPlainLines(html: string): string[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.innerText ?? div.textContent ?? "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
}

function stripAboutSection(html: string): string {
  return html.replace(/<h[23][^>]*>\s*Sobre[^<]*<\/h[23]>[\s\S]*$/i, "").trimEnd();
}

export async function exportDocx(release: ReleaseExport) {
  const slug = release.title.slice(0, 40).replace(/\s+/g, "-").toLowerCase() || "release";
  const brandName = release.brandName ?? "";
  const bodyLines = htmlToPlainLines(stripAboutSection(release.body));

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 24 } } },
    },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      children: [
        ...(brandName ? [new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: brandName.toUpperCase(), bold: true, size: 18, color: "848484", font: "Calibri" })],
        })] : []),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 160 },
          children: [new TextRun({ text: release.title || "Título do release", bold: true, size: 52, font: "Calibri" })],
        }),

        ...(release.summary ? [new Paragraph({
          spacing: { after: 320 },
          children: [new TextRun({ text: release.summary, italics: true, size: 30, color: "555555", font: "Calibri" })],
        })] : []),

        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
          spacing: { after: 320 },
          children: [],
        }),

        ...bodyLines.map(line =>
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: line, size: 24, font: "Calibri" })],
            alignment: AlignmentType.JUSTIFIED,
          })
        ),

        ...(release.vehicleNames && release.vehicleNames.length > 0 ? [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 400 },
            children: [new TextRun({ text: "VEÍCULOS", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Veículo"].map(h =>
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, color: "F1F0EC" },
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri" })] })],
                  })
                ),
              }),
              ...release.vehicleNames.map(v =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: v.name, size: 18, font: "Calibri" })] })],
                    }),
                  ],
                })
              ),
            ],
          }),
        ] : []),

        ...(release.publishedVehicleUrls && Object.keys(release.publishedVehicleUrls).length > 0 ? [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E0DFDB" } },
            spacing: { after: 200, before: 400 },
            children: [new TextRun({ text: "LINKS DE PUBLICAÇÃO", bold: true, size: 18, color: "848484", font: "Calibri" })],
          }),
          ...Object.entries(release.publishedVehicleUrls).map(([k, u]) =>
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({ text: `${k}: `, bold: true, size: 18, font: "Calibri" }),
                new TextRun({ text: u, size: 18, font: "Calibri", color: "2563EB" }),
              ],
            })
          ),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `release-${release.shortId}.docx`);
}

export function exportPdf(release: ReleaseExport) {
  const bodyHtml = stripAboutSection(release.body);
  const vehicleList = release.vehicleNames?.map(v => `<li>${v.name}</li>`).join("") ?? "";
  const urlList = release.publishedVehicleUrls
    ? Object.entries(release.publishedVehicleUrls)
        .map(([k, u]) => `<li>${k}: <a href="${u}">${u}</a></li>`).join("")
    : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${release.title}</title>
  <style>
    @page { margin: 32mm 24mm; }
    body { font-family: Georgia, serif; font-size: 11pt; color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 22pt; font-weight: 700; margin: 0 0 10px; line-height: 1.2; }
    .subtitle { font-style: italic; font-size: 13pt; color: #444; margin: 0 0 20px; }
    .brand { font-size: 9pt; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    .body { font-size: 11pt; }
    .section-label { font-size: 8pt; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .08em; margin: 28px 0 8px; border-top: 1px solid #eee; padding-top: 14px; }
    ul { padding-left: 18px; margin: 0; }
    li { margin-bottom: 4px; font-size: 10pt; }
    img { max-width: 100%; height: auto; }
    a { color: #2563EB; }
  </style>
</head>
<body>
  ${release.brandName ? `<div class="brand">${release.brandName}</div>` : ""}
  <h1>${release.title}</h1>
  ${release.summary ? `<p class="subtitle">${release.summary}</p>` : ""}
  <hr>
  <div class="body">${bodyHtml}</div>
  ${vehicleList ? `<div class="section-label">Veículos</div><ul>${vehicleList}</ul>` : ""}
  ${urlList ? `<div class="section-label">Links de publicação</div><ul>${urlList}</ul>` : ""}
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 300);
}
