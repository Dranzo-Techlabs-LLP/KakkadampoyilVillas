import { NextRequest } from "next/server";
import { exec } from "@/lib/db";
import { guard, json } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return guard("expenses.manage", async (user) => {
    const { id } = await params;
    await exec(`DELETE FROM expenses WHERE id = :id`, { id });
    await audit(user.id, "delete", "expense", Number(id));
    return json({ ok: true });
  });
}
