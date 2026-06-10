import { getSessionUser } from "@/lib/auth";
import { json, err } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return err("Unauthorized", 401);
  return json({ user });
}
