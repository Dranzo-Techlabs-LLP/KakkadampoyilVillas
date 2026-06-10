import { exec } from "./db";

export async function audit(
  userId: number | null,
  action: string,
  entity: string,
  entityId: number | null,
  detail?: string
) {
  try {
    await exec(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, detail)
       VALUES (:userId, :action, :entity, :entityId, :detail)`,
      { userId, action, entity, entityId, detail: detail ?? null }
    );
  } catch {
    // never let audit failure break the request
  }
}
