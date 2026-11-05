import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityMetadata = Record<string, string | number | boolean | null>;

/**
 * <<entity>> ActivityLog
 * Jejak aktivitas penting (tabel `activity_logs`: action + metadata JSONB).
 * Kegagalan mencatat log tidak boleh menggagalkan operasi utama.
 */
export class ActivityLog {
  private constructor(
    readonly propertyId: string,
    readonly actorId: string,
    readonly action: string,
    readonly metadata: ActivityMetadata
  ) {}

  static async record(
    db: SupabaseClient,
    entry: {
      propertyId: string;
      actorId: string;
      action: string;
      metadata?: ActivityMetadata;
    }
  ): Promise<void> {
    const log = new ActivityLog(
      entry.propertyId,
      entry.actorId,
      entry.action,
      entry.metadata ?? {}
    );

    try {
      await db.from("activity_logs").insert({
        property_id: log.propertyId,
        actor_id: log.actorId,
        action: log.action,
        metadata: log.metadata
      });
    } catch {
      // Activity logs should never block the main operation.
    }
  }
}
