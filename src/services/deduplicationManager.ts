import { DeduplicationRecord } from '../types';

export class DeduplicationManager {
  private cache: Map<string, DeduplicationRecord> = new Map();
  // Configurable 10-15 minute rolling suppression window (Default 12 minutes = 720,000 ms)
  private windowDurationMs: number = 12 * 60 * 1000;

  constructor(windowMinutes: number = 12) {
    this.windowDurationMs = Math.max(10, Math.min(15, windowMinutes)) * 60 * 1000;
  }

  public setWindowMinutes(minutes: number) {
    this.windowDurationMs = Math.max(10, Math.min(15, minutes)) * 60 * 1000;
  }

  public getWindowMinutes(): number {
    return Math.round(this.windowDurationMs / 60000);
  }

  public generateSignature(plateNumber: string, zoneId: number, defectType: string): string {
    return `${plateNumber.toUpperCase().trim()}_${zoneId}_${defectType.toLowerCase()}`;
  }

  /**
   * Evaluates if a newly detected plate/hazard should trigger a fresh incident alert
   * or be suppressed by the 10-15 minute rolling deduplication filter.
   */
  public evaluateDetection(
    plateNumber: string,
    zoneId: number,
    defectType: string
  ): {
    allowAlert: boolean;
    isDuplicateSuppressed: boolean;
    remainingCooldownSeconds: number;
    record: DeduplicationRecord;
  } {
    const now = Date.now();
    const sig = this.generateSignature(plateNumber, zoneId, defectType);
    const existing = this.cache.get(sig);

    if (!existing || now >= existing.suppressUntil) {
      // First detection or suppression window has expired -> Allow alert!
      const record: DeduplicationRecord = {
        signature: sig,
        plateNumber: plateNumber.toUpperCase(),
        zoneId,
        defectType,
        firstSeenAt: existing ? existing.firstSeenAt : now,
        lastSeenAt: now,
        suppressUntil: now + this.windowDurationMs,
        alertCount: existing ? existing.alertCount + 1 : 1,
      };
      this.cache.set(sig, record);
      return {
        allowAlert: true,
        isDuplicateSuppressed: false,
        remainingCooldownSeconds: Math.round(this.windowDurationMs / 1000),
        record,
      };
    }

    // Inside 10-15 min suppression window -> Suppress alert to prevent duplicate flood!
    existing.lastSeenAt = now;
    const remainingCooldownSeconds = Math.max(0, Math.round((existing.suppressUntil - now) / 1000));

    return {
      allowAlert: false,
      isDuplicateSuppressed: true,
      remainingCooldownSeconds,
      record: existing,
    };
  }

  public getCachedSignatures(): DeduplicationRecord[] {
    const now = Date.now();
    return Array.from(this.cache.values()).filter((r) => r.suppressUntil > now);
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const deduplicationManager = new DeduplicationManager(12);
