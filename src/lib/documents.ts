// Guest ID-proof uploads. Files are stored in the DB (MEDIUMBLOB), so the cap
// keeps rows — and the hex-encoded INSERT statement — comfortably small.
export const MAX_DOC_BYTES = 6 * 1024 * 1024;
export const MAX_DOCS_PER_BOOKING = 10;

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Identify the real file type from its leading bytes. The client-declared
 * MIME type is never trusted, so only these four types can ever be stored or
 * served back (no HTML/SVG that could run script on our origin).
 */
export function sniffDocType(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && PNG_MAGIC.every((v, i) => b[i] === v)) return "image/png";
  if (b.length >= 5 && b.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (
    b.length >= 12 &&
    b.subarray(0, 4).toString("latin1") === "RIFF" &&
    b.subarray(8, 12).toString("latin1") === "WEBP"
  ) return "image/webp";
  return null;
}

/** Strip anything that could break a Content-Disposition header. */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[\x00-\x1f\x7f"\\/]/g, "_").trim();
  return (cleaned || "document").slice(0, 200);
}
