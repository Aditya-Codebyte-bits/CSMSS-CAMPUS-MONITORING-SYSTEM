import { VehicleDwellRecord, DwellState } from '../types';

export interface SpatialZoneBoundary {
  zoneId: number;
  zoneCode: string;
  name: string;
  // Normalized 0..1 bounding box [x1, y1, x2, y2] within 16:9 camera feed
  boundary: [number, number, number, number];
  isRestrictedNoParking: boolean;
  dwellThresholdSeconds: number; // default 30
}

export const CAMPUS_SPATIAL_BOUNDARIES: Record<number, SpatialZoneBoundary> = {
  1: {
    zoneId: 1,
    zoneCode: 'ZONE-GATE-03',
    name: 'Gate 3 Red Emergency Buffer',
    boundary: [0.18, 0.42, 0.62, 0.88], // Fire-exit clearance box
    isRestrictedNoParking: true,
    dwellThresholdSeconds: 30,
  },
  2: {
    zoneId: 2,
    zoneCode: 'ZONE-GATE-02',
    name: 'Gate 2 Inbound Transit Checkpoint',
    boundary: [0.25, 0.35, 0.75, 0.85],
    isRestrictedNoParking: false,
    dwellThresholdSeconds: 45,
  },
  5: {
    zoneId: 5,
    zoneCode: 'ZONE-DENTAL',
    name: 'Dental Spine Fire Lane',
    boundary: [0.2, 0.3, 0.8, 0.7],
    isRestrictedNoParking: true,
    dwellThresholdSeconds: 30,
  },
  7: {
    zoneId: 7,
    zoneCode: 'ZONE-PARKING',
    name: 'Faculty & Student Parking Bay',
    boundary: [0.1, 0.2, 0.9, 0.9],
    isRestrictedNoParking: false,
    dwellThresholdSeconds: 60,
  },
};

export interface ZoneCalibration {
  dwellThresholdSeconds: number;
  overlapThresholdPct: number;
}

export interface DwellCalibrationSettings {
  globalDwellSeconds: number; // 10s - 120s (default 30)
  globalOverlapThresholdPct: number; // 15% - 85% (default 40)
  clearOverlapThresholdPct: number; // 10% - 30% (default 20)
  zoneOverrides: Record<number, ZoneCalibration>;
}

export const DEFAULT_CALIBRATION_SETTINGS: DwellCalibrationSettings = {
  globalDwellSeconds: 30,
  globalOverlapThresholdPct: 40,
  clearOverlapThresholdPct: 20,
  zoneOverrides: {
    1: { dwellThresholdSeconds: 30, overlapThresholdPct: 40 },
    2: { dwellThresholdSeconds: 45, overlapThresholdPct: 45 },
    5: { dwellThresholdSeconds: 30, overlapThresholdPct: 35 },
    7: { dwellThresholdSeconds: 60, overlapThresholdPct: 50 },
  },
};

const STORAGE_KEY_CALIBRATION = 'csmss_dwell_calibration_v1';

export class SpatialDwellEngine {
  private activeTrackers: Map<string, VehicleDwellRecord> = new Map();
  private validationListeners: ((record: VehicleDwellRecord) => void)[] = [];
  private calibrationListeners: ((settings: DwellCalibrationSettings) => void)[] = [];
  private calibration: DwellCalibrationSettings;

  constructor() {
    this.calibration = this.loadCalibrationFromStorage();
  }

  private loadCalibrationFromStorage(): DwellCalibrationSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CALIBRATION);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_CALIBRATION_SETTINGS,
          ...parsed,
          zoneOverrides: {
            ...DEFAULT_CALIBRATION_SETTINGS.zoneOverrides,
            ...(parsed.zoneOverrides || {}),
          },
        };
      }
    } catch {
      // Fallback to default
    }
    return JSON.parse(JSON.stringify(DEFAULT_CALIBRATION_SETTINGS));
  }

  public getCalibration(): DwellCalibrationSettings {
    return JSON.parse(JSON.stringify(this.calibration));
  }

  public setCalibration(newSettings: DwellCalibrationSettings): void {
    this.calibration = { ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY_CALIBRATION, JSON.stringify(this.calibration));
    } catch {
      // Ignore storage errors
    }
    this.calibrationListeners.forEach((l) => l(this.calibration));
  }

  public updateZoneCalibration(zoneId: number, cal: Partial<ZoneCalibration>): void {
    const currentZone = this.calibration.zoneOverrides[zoneId] || {
      dwellThresholdSeconds: this.calibration.globalDwellSeconds,
      overlapThresholdPct: this.calibration.globalOverlapThresholdPct,
    };
    this.calibration.zoneOverrides[zoneId] = {
      ...currentZone,
      ...cal,
    };
    this.setCalibration(this.calibration);
  }

  public resetCalibrationToDefault(): DwellCalibrationSettings {
    this.calibration = JSON.parse(JSON.stringify(DEFAULT_CALIBRATION_SETTINGS));
    try {
      localStorage.removeItem(STORAGE_KEY_CALIBRATION);
    } catch {
      // Ignore storage errors
    }
    this.calibrationListeners.forEach((l) => l(this.calibration));
    return this.calibration;
  }

  public registerCalibrationListener(cb: (settings: DwellCalibrationSettings) => void): () => void {
    this.calibrationListeners.push(cb);
    return () => {
      this.calibrationListeners = this.calibrationListeners.filter((l) => l !== cb);
    };
  }

  public getDwellThresholdForZone(zoneId: number): number {
    return (
      this.calibration.zoneOverrides[zoneId]?.dwellThresholdSeconds ??
      this.calibration.globalDwellSeconds ??
      30
    );
  }

  public getOverlapThresholdForZone(zoneId: number): number {
    return (
      this.calibration.zoneOverrides[zoneId]?.overlapThresholdPct ??
      this.calibration.globalOverlapThresholdPct ??
      40
    );
  }

  public getClearThresholdForZone(zoneId: number): number {
    return this.calibration.clearOverlapThresholdPct ?? 20;
  }

  public static computeIntersectionOverlap(
    box: [number, number, number, number],
    boundary: [number, number, number, number]
  ): number {
    const [bx1, by1, bx2, by2] = box;
    const [zx1, zy1, zx2, zy2] = boundary;

    const ix1 = Math.max(bx1, zx1);
    const iy1 = Math.max(by1, zy1);
    const ix2 = Math.min(bx2, zx2);
    const iy2 = Math.min(by2, zy2);

    const interWidth = Math.max(0, ix2 - ix1);
    const interHeight = Math.max(0, iy2 - iy1);
    const interArea = interWidth * interHeight;

    const boxArea = Math.max(0.0001, (bx2 - bx1) * (by2 - by1));
    const overlapRatio = interArea / boxArea;

    return Math.min(100, Math.round(overlapRatio * 100));
  }

  public registerValidationListener(cb: (record: VehicleDwellRecord) => void): () => void {
    this.validationListeners.push(cb);
    return () => {
      this.validationListeners = this.validationListeners.filter((l) => l !== cb);
    };
  }

  public processFrameDetection(
    plateNumber: string,
    zoneId: number,
    vehicleBox: [number, number, number, number],
    vehicleType: string = 'four_wheeler',
    snapshotUrl?: string
  ): VehicleDwellRecord {
    const now = Date.now();
    const zoneDef = CAMPUS_SPATIAL_BOUNDARIES[zoneId] || CAMPUS_SPATIAL_BOUNDARIES[1];
    const overlapPercentage = SpatialDwellEngine.computeIntersectionOverlap(vehicleBox, zoneDef.boundary);
    const trackerKey = `${plateNumber}_${zoneId}`;

    const dwellThreshold = this.getDwellThresholdForZone(zoneId);
    const overlapThreshold = this.getOverlapThresholdForZone(zoneId);
    const clearThreshold = this.getClearThresholdForZone(zoneId);

    let record = this.activeTrackers.get(trackerKey);

    if (!record) {
      const state: DwellState = overlapPercentage >= overlapThreshold ? 'turning' : 'approaching';
      record = {
        id: `DWELL-${now}-${Math.floor(Math.random() * 1000)}`,
        plateNumber,
        zoneId,
        zoneName: zoneDef.name,
        overlapPercentage,
        firstDetectedAt: now,
        lastSeenAt: now,
        dwellSeconds: 0,
        state,
        countdownRemaining: dwellThreshold,
        vehicleType,
        snapshotUrl,
      };
      this.activeTrackers.set(trackerKey, record);
      return record;
    }

    // Vehicle already in tracking memory
    record.lastSeenAt = now;
    record.overlapPercentage = overlapPercentage;
    if (snapshotUrl) record.snapshotUrl = snapshotUrl;

    // Spatial validation: did it leave the boundary space?
    if (overlapPercentage < clearThreshold) {
      if (record.state === 'turning' || record.state === 'approaching') {
        record.state = 'cleared'; // Turn maneuver completed without violation
      }
      record.dwellSeconds = 0;
      record.countdownRemaining = dwellThreshold;
      return record;
    }

    // If vehicle was previously cleared or approaching outside threshold and now re-enters boundary, reset dwell timer!
    if (
      (record.state === 'cleared' || record.state === 'approaching') &&
      overlapPercentage >= overlapThreshold
    ) {
      record.firstDetectedAt = now;
      record.dwellSeconds = 0;
      record.countdownRemaining = dwellThreshold;
      record.state = zoneDef.isRestrictedNoParking ? 'turning' : 'approaching';
    }

    const elapsedSeconds = Math.max(0, (now - record.firstDetectedAt) / 1000);
    record.dwellSeconds = Math.round(elapsedSeconds * 10) / 10;

    // Vehicle inside restricted boundary space
    if (zoneDef.isRestrictedNoParking && overlapPercentage >= overlapThreshold) {
      const remaining = Math.max(0, Math.round(dwellThreshold - elapsedSeconds));
      record.countdownRemaining = remaining;

      if (elapsedSeconds >= dwellThreshold) {
        if (record.state !== 'parked') {
          record.state = 'parked'; // Validated true parking violation!
          this.validationListeners.forEach((listener) => listener(record!));
        }
      } else {
        record.state = 'turning'; // Active turning / transient maneuver in progress
      }
    } else if (!zoneDef.isRestrictedNoParking) {
      record.state = 'approaching';
    }

    return record;
  }

  public getTrackedVehicles(): VehicleDwellRecord[] {
    const now = Date.now();
    for (const [key, record] of this.activeTrackers.entries()) {
      if (now - record.lastSeenAt > 120000 && record.state === 'cleared') {
        this.activeTrackers.delete(key);
      }
    }
    return Array.from(this.activeTrackers.values());
  }

  public clearTrackers(): void {
    this.activeTrackers.clear();
  }
}

export const spatialDwellEngine = new SpatialDwellEngine();
