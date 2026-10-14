import { NextRequest } from "next/server";
import { q, q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";
import { MAX_DOC_BYTES, MAX_DOCS_PER_BOOKING, sniffDocType, safeFileName } from "@/lib/documents";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// ID proofs are sensitive personal data: every endpoint here requires
// bookings.manage, so view-only roles (e.g. Owner) can never read them.

// GET — metadata only; the file bytes are served by ./[docId].
export async function GET(_req: NextRequest, { params }: Ctx) {
  return guard("bookings.manage", async () => {
    const { id } = await params;
    const documents = await q(
      `SELECT id, kind, file_name AS fileName, mime_type AS mimeType,
              size_bytes AS sizeBytes, created_at AS createdAt
         FROM booking_documents WHERE booking_id = :id ORDER BY id`,
      { id }
    );
    return json({ documents });
  });
}

// POST multipart/form-data { file } — one file per request.
export async function POST(req: NextRequest, { params }: Ctx) {
  return guard("bookings.manage", async (user) => {
    const { id } = await params;
    const booking = await q1<any>(`SELECT id FROM bookings WHERE id = :id`, { id });
    if (!booking) return err("Booking not found", 404);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string") return err("No file uploaded");
    if (file.size === 0) return err("The file is empty");
    if (file.size > MAX_DOC_BYTES) {
      return err(`File is too large (max ${MAX_DOC_BYTES / 1024 / 1024} MB)`, 413);
    }

    const count = await q1<{ n: number }>(
      `SELECT COUNT(*) AS n FROM booking_documents WHERE booking_id = :id`,
      { id }
    );
    if (Number(count?.n) >= MAX_DOCS_PER_BOOKING) {
      return err(`A booking can have at most ${MAX_DOCS_PER_BOOKING} documents`);
    }

    const data = Buffer.from(await file.arrayBuffer());
    const mime = sniffDocType(data);
    if (!mime) return err("Only JPG, PNG, WEBP or PDF files are allowed");

    const res = await exec(
      `INSERT INTO booking_documents (booking_id, kind, file_name, mime_type, size_bytes, data, uploaded_by)
       VALUES (:bid, 'id_proof', :name, :mime, :size, :data, :uid)`,
      {
        bid: id,
        name: safeFileName(file.name || "document"),
        mime,
        size: data.length,
        data,
        uid: user.id,
      }
    );
    await audit(user.id, "upload", "booking_document", res.insertId, `booking ${id}`);
    return json({ ok: true, id: res.insertId });
  });
}
