/**
 * Gerador de payload Pix estático (BR Code / EMV) — sem dependências externas.
 * Spec: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 */

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload(opts: {
  key: string;           // chave Pix (CNPJ sem formatação)
  merchantName: string;  // max 25 chars
  city: string;          // max 15 chars
  amountCents: number;
  txId?: string;         // referência opcional (max 25 chars, só alfanum)
}): string {
  const amount = (opts.amountCents / 100).toFixed(2);
  const txId = (opts.txId ?? "***").replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "***";

  const pixKey = tlv("01", opts.key);
  const merchantAccount = tlv("26", tlv("00", "br.gov.bcb.pix") + pixKey);
  const additionalData = tlv("62", tlv("05", txId));

  const payload =
    tlv("00", "01") +
    merchantAccount +
    tlv("52", "0000") +          // MCC genérico
    tlv("53", "986") +           // BRL
    tlv("54", amount) +
    tlv("58", "BR") +
    tlv("59", opts.merchantName.slice(0, 25)) +
    tlv("60", opts.city.slice(0, 15)) +
    additionalData +
    "6304";                      // CRC placeholder

  return payload + crc16(payload);
}
