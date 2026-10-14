import { NextRequest } from "next/server";
import { q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; docId: string }> };

// GET — stream the stored file back (inline, so images/PDFs open in a tab).
export async function GET(_req: NextRequest, { params }: Ctx) {
  return guard("bookings.manage", async () => {
    const { id, docId } = await params;
    const doc = await q1<any>(
      `SELECT file_name AS fileName, mime_type AS mimeType, data
         FROM booking_documents WHERE id = :docId AND booking_id = :id`,
      { id, docId }
    );
    if (!doc) return err("Not found", 404);

    const bytes = new Uint8Array(doc.data);
    const ascii = String(doc.fileName).replace(/[^\x20-\x7e]/g, "_");
    return new Response(bytes, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return guard("bookings.manage", async (user) => {
    const { id, docId } = await params;
    const res = await exec(
      `DELETE FROM booking_documents WHERE id = :docId AND booking_id = :id`,
      { id, docId }
    );
    if (!res.affectedRows) return err("Not found", 404);
    await audit(user.id, "delete", "booking_document", Number(docId), `booking ${id}`);
    return json({ ok: true });
  });
}
