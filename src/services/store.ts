import {
  CampusAnalytics,
  CampusZone,
  IncidentReport,
  IncidentStatus,
  IncidentType,
  InferenceResult,
  RegisteredVehicle,
  User,
} from '../types';
import { CSMSSInferenceEngine } from './inferenceEngine';

const STORAGE_KEYS = {
  ZONES: 'csmss_zones_v3',
  VEHICLES: 'csmss_vehicles_v3',
  INCIDENTS: 'csmss_incidents_v3',
  USERS: 'csmss_users_v3',
};

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const INITIAL_USERS: User[] = [
  {
    user_id: 1,
    full_name: 'Aarav Kulkarni',
    role: 'student',
    department_or_id: 'CSMSS-CSE-014',
    contact_phone: '9823011223',
    created_at: '2026-11-08 09:30:00',
  },
  {
    user_id: 2,
    full_name: 'Prof. S. B. Deshmukh',
    role: 'faculty',
    department_or_id: 'CSMSS-FAC-008',
    contact_phone: '9422200112',
    created_at: '2026-11-08 09:30:00',
  },
  {
    user_id: 3,
    full_name: 'Rameshwar Jadhav (Gate 3 Security)',
    role: 'security',
    department_or_id: 'CSMSS-SEC-001',
    contact_phone: '9765400987',
    created_at: '2026-11-08 09:30:00',
  },
  {
    user_id: 4,
    full_name: 'Er. V. K. Patil (Estate & Civil Engineer)',
    role: 'civil_cell',
    department_or_id: 'CSMSS-EST-002',
    contact_phone: '9850011445',
    created_at: '2026-11-08 09:30:00',
  },
];

export const INITIAL_ZONES: CampusZone[] = [
  {
    zone_id: 1,
    zone_code: 'ZONE-GATE-03',
    zone_name: 'Gate 3 (Engineering & Workshop Checkpoint)',
    latitude: 19.8160,
    longitude: 75.2908,
    is_no_parking_zone: true,
    criticality_weight: 1.8,
    roi_polygon: [0.12, 0.18, 0.88, 0.86],
    camera_position: [-20, 10, 6],
    camera_target: [-14, 1, 0],
  },
  {
    zone_id: 2,
    zone_code: 'ZONE-GATE-02',
    zone_name: 'Gate 2 (Polytechnic & CSMSS Rd Checkpoint)',
    latitude: 19.8155,
    longitude: 75.2928,
    is_no_parking_zone: true,
    criticality_weight: 1.6,
    roi_polygon: [0.15, 0.2, 0.85, 0.88],
    camera_position: [24, 9, 2],
    camera_target: [18, 1, 0],
  },
  {
    zone_id: 3,
    zone_code: 'ZONE-ENG-COLLEGE',
    zone_name: 'CSMSS Chh. Shahu College of Engineering',
    latitude: 19.8154,
    longitude: 75.2906,
    is_no_parking_zone: true,
    criticality_weight: 1.7,
    roi_polygon: [0.1, 0.15, 0.9, 0.9],
    camera_position: [-24, 16, -14],
    camera_target: [-20, 2, -10],
  },
  {
    zone_id: 4,
    zone_code: 'ZONE-POLYTECHNIC',
    zone_name: 'CSMSS College of Polytechnic',
    latitude: 19.8150,
    longitude: 75.2922,
    is_no_parking_zone: false,
    criticality_weight: 1.3,
    roi_polygon: [0.15, 0.2, 0.85, 0.85],
    camera_position: [14, 14, -12],
    camera_target: [10, 1, -8],
  },
  {
    zone_id: 5,
    zone_code: 'ZONE-DENTAL',
    zone_name: 'CSMSS Dental College & Central Spine',
    latitude: 19.8166,
    longitude: 75.2914,
    is_no_parking_zone: false,
    criticality_weight: 1.4,
    roi_polygon: [0.15, 0.2, 0.85, 0.85],
    camera_position: [-4, 14, -20],
    camera_target: [-2, 2, -14],
  },
  {
    zone_id: 6,
    zone_code: 'ZONE-AYURVEDA',
    zone_name: 'CSMSS Ayurveda College & Rugnalaya Hospital',
    latitude: 19.8174,
    longitude: 75.2912,
    is_no_parking_zone: true,
    criticality_weight: 2.0,
    roi_polygon: [0.1, 0.15, 0.9, 0.9],
    camera_position: [-2, 16, -42],
    camera_target: [-1, 2, -32],
  },
  {
    zone_id: 7,
    zone_code: 'ZONE-PARKING',
    zone_name: 'Designated Faculty & Student Parking Bay',
    latitude: 19.8168,
    longitude: 75.2924,
    is_no_parking_zone: false,
    criticality_weight: 1.1,
    roi_polygon: [0.15, 0.2, 0.85, 0.85],
    camera_position: [18, 12, -22],
    camera_target: [12, 0.5, -18],
  },
];

export const INITIAL_VEHICLES: RegisteredVehicle[] = [
  {
    vehicle_id: 1,
    plate_number: 'MH20EE4512',
    owner_name: 'Prof. S. B. Deshmukh',
    owner_role: 'faculty',
    department: 'Computer Science',
    vehicle_type: 'four_wheeler',
    pass_sticker_id: 'CSMSS-PASS-001',
    contact_phone: '9422200112',
    is_active: true,
  },
  {
    vehicle_id: 2,
    plate_number: 'MH20BY1122',
    owner_name: 'Aarav Kulkarni',
    owner_role: 'student',
    department: 'Computer Science',
    vehicle_type: 'two_wheeler',
    pass_sticker_id: 'CSMSS-PASS-104',
    contact_phone: '9823011223',
    is_active: true,
  },
  {
    vehicle_id: 3,
    plate_number: 'MH20DV8801',
    owner_name: 'Snehal Chavan',
    owner_role: 'student',
    department: 'Artificial Intelligence',
    vehicle_type: 'two_wheeler',
    pass_sticker_id: 'CSMSS-PASS-118',
    contact_phone: '9763312345',
    is_active: true,
  },
  {
    vehicle_id: 4,
    plate_number: 'MH20AZ9090',
    owner_name: 'CSMSS Campus Transit Bus #4',
    owner_role: 'college_bus',
    department: 'Logistics Cell',
    vehicle_type: 'bus',
    pass_sticker_id: 'CSMSS-BUS-004',
    contact_phone: '9422090900',
    is_active: true,
  },
  {
    vehicle_id: 5,
    plate_number: 'MH20AM1080',
    owner_name: 'CSMSS Rugnalaya Emergency Van',
    owner_role: 'ambulance',
    department: 'Ayurveda Hospital',
    vehicle_type: 'emergency',
    pass_sticker_id: 'CSMSS-EMG-108',
    contact_phone: '9422010800',
    is_active: true,
  },
  {
    vehicle_id: 6,
    plate_number: 'MH20CT3344',
    owner_name: 'Prof. M. R. Shinde',
    owner_role: 'faculty',
    department: 'Mechanical',
    vehicle_type: 'four_wheeler',
    pass_sticker_id: 'CSMSS-PASS-019',
    contact_phone: '9890122334',
    is_active: true,
  },
];

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    incident_id: 1,
    incident_type: 'unlawful_parking',
    zone_id: 1,
    zone_name: 'Gate 3 (Engineering & Workshop Checkpoint)',
    zone_code: 'ZONE-GATE-03',
    latitude: 19.8160,
    longitude: 75.2908,
    reported_by_user_id: 1,
    reporter_name: 'Rameshwar Jadhav (Gate 3 Security)',
    reporter_role: 'security',
    detected_plate: 'MH20BY1122',
    is_authorized_vehicle: true,
    vehicle_owner_name: 'Aarav Kulkarni',
    vehicle_owner_dept: 'Computer Science',
    vehicle_owner_phone: '9823011223',
    confidence_score: 0.94,
    severity: 'Critical',
    status: 'In_Progress',
    image_path: '',
    description: 'Vehicle parked inside the Red Emergency Bottleneck at Gate 3 directly obstructing workshop fire exits (Plate: MH20BY1122).',
    resolution_notes: 'Patrol guard instructed driver to shift to designated student parking bay.',
    created_at: '2026-11-08 09:45:00',
    bbox_area_ratio: 0.18,
    estimated_diameter_cm: 0,
    recommended_action: 'Dispatch security guard & alert registered driver immediately.',
  },
  {
    incident_id: 2,
    incident_type: 'road_damage',
    zone_id: 6,
    zone_name: 'CSMSS Ayurveda College & Rugnalaya Hospital',
    zone_code: 'ZONE-AYURVEDA',
    latitude: 19.8174,
    longitude: 75.2912,
    reported_by_user_id: 2,
    reporter_name: 'Prof. S. B. Deshmukh',
    reporter_role: 'faculty',
    confidence_score: 0.92,
    severity: 'Critical',
    status: 'Open',
    image_path: '',
    description: 'Surface pothole cavity (~60 cm span) along the Ayurveda Hospital ambulance link causing severe transit deceleration.',
    defect_category: 'Pothole',
    bbox_area_ratio: 0.142,
    estimated_diameter_cm: 60,
    recommended_action: 'Deploy safety cones and dispatch cold-mix asphalt patch unit within 24h.',
    created_at: '2026-11-08 10:15:00',
  },
  {
    incident_id: 3,
    incident_type: 'unauthorized_vehicle',
    zone_id: 2,
    zone_name: 'Gate 2 (Polytechnic & CSMSS Rd Checkpoint)',
    zone_code: 'ZONE-GATE-02',
    latitude: 19.8155,
    longitude: 75.2928,
    reported_by_user_id: 3,
    reporter_name: 'Main Gate Shift Officer',
    reporter_role: 'security',
    detected_plate: 'MH12XY9999',
    is_authorized_vehicle: false,
    confidence_score: 0.93,
    severity: 'High',
    status: 'Open',
    image_path: '',
    description: 'Unregistered visitor vehicle (MH12XY9999) intercepted at Gate 2 entrance on CSMSS Rd.',
    created_at: '2026-11-08 11:20:00',
    recommended_action: 'Verify visitor government ID, issue temporary visitor slip, and direct to visitor parking.',
  },
];

class CivicStore {
  private zones: CampusZone[] = [];
  private vehicles: RegisteredVehicle[] = [];
  private incidents: IncidentReport[] = [];
  private users: User[] = [];
  private isBackendOnline: boolean = false;

  constructor() {
    this.init();
    this.checkBackendSync();
  }

  private init() {
    try {
      const z = localStorage.getItem(STORAGE_KEYS.ZONES);
      this.zones = z ? JSON.parse(z) : INITIAL_ZONES;

      const v = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      this.vehicles = v ? JSON.parse(v) : INITIAL_VEHICLES;

      const inc = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
      this.incidents = inc ? JSON.parse(inc) : INITIAL_INCIDENTS;

      const u = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = u ? JSON.parse(u) : INITIAL_USERS;
    } catch {
      this.zones = [...INITIAL_ZONES];
      this.vehicles = [...INITIAL_VEHICLES];
      this.incidents = [...INITIAL_INCIDENTS];
      this.users = [...INITIAL_USERS];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(this.zones));
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(this.vehicles));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      // Keep Base64 images only on the 5 most recent incidents in localStorage to prevent QuotaExceededError
      const compactIncidents = this.incidents.map((inc, idx) =>
        idx < 5 ? inc : { ...inc, image_path: '' }
      );
      localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(compactIncidents));
    } catch (e) {
      // Fallback: strip all base64 images if localStorage quota is still tight
      try {
        const stripped = this.incidents.map((inc) => ({ ...inc, image_path: '' }));
        localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(stripped));
      } catch (innerErr) {
        console.warn('LocalStorage save failed:', innerErr);
      }
    }
  }

  public async checkBackendSync(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const serverIncidents = await res.json();
        if (Array.isArray(serverIncidents) && serverIncidents.length > 0) {
          this.incidents = serverIncidents;
        }
        this.isBackendOnline = true;
        this.save();
        return true;
      }
    } catch {
      this.isBackendOnline = false;
    }
    return false;
  }

  public getIsBackendOnline(): boolean {
    return this.isBackendOnline;
  }

  public resetAll() {
    this.zones = [...INITIAL_ZONES];
    this.vehicles = [...INITIAL_VEHICLES];
    this.incidents = [...INITIAL_INCIDENTS];
    this.users = [...INITIAL_USERS];
    this.save();
  }

  public getZones(): CampusZone[] {
    return [...this.zones];
  }

  public getZoneById(id: number): CampusZone | undefined {
    return this.zones.find((z) => z.zone_id === id) || this.zones[0];
  }

  public getVehicles(): RegisteredVehicle[] {
    return [...this.vehicles];
  }

  public lookupVehicle(plate: string): RegisteredVehicle | null {
    if (!plate) return null;
    const norm = CSMSSInferenceEngine.normalizeIndianPlate(plate) || plate.toUpperCase().replace(/\s+/g, '');
    return this.vehicles.find((v) => v.plate_number === norm && v.is_active) || null;
  }

  public verifyVehiclePlate(plateNumber: string) {
    const norm = CSMSSInferenceEngine.normalizeIndianPlate(plateNumber) || plateNumber.toUpperCase().trim();
    const vehicle = this.lookupVehicle(norm);
    return {
      plate_number: norm,
      is_authorized: Boolean(vehicle),
      classification: vehicle ? 'AUTHORIZED_CAMPUS_MEMBER' : 'UNREGISTERED_VISITOR',
      vehicle_details: vehicle,
    };
  }

  public addVehicle(newV: Omit<RegisteredVehicle, 'vehicle_id'>): RegisteredVehicle {
    const normPlate = CSMSSInferenceEngine.normalizeIndianPlate(newV.plate_number) || newV.plate_number.toUpperCase().trim();
    const exists = this.vehicles.some((v) => v.plate_number === normPlate || v.pass_sticker_id === newV.pass_sticker_id);
    if (exists) {
      throw new Error(`Vehicle plate ${normPlate} or pass sticker ${newV.pass_sticker_id} already exists in registry!`);
    }

    const nextId = this.vehicles.length > 0 ? Math.max(...this.vehicles.map((v) => v.vehicle_id)) + 1 : 1;
    const vehicle: RegisteredVehicle = {
      ...newV,
      vehicle_id: nextId,
      plate_number: normPlate,
    };
    this.vehicles.unshift(vehicle);
    this.save();

    if (this.isBackendOnline) {
      fetch(`${API_BASE_URL}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newV),
      }).catch((e) => console.warn('Backend vehicle push failed:', e));
    }

    return vehicle;
  }

  public getIncidents(): IncidentReport[] {
    return [...this.incidents];
  }

  public addIncident(
    incidentType: IncidentType,
    zoneId: number,
    reportedByUserId: number,
    inference: InferenceResult,
    userNotes?: string
  ): IncidentReport {
    const zone = this.getZoneById(zoneId)!;
    const user = this.users.find((u) => u.user_id === reportedByUserId) || this.users[0];
    const vehicleRecord = inference.detected_plate ? this.lookupVehicle(inference.detected_plate) : null;
    const isAuthorized = inference.detected_plate ? Boolean(vehicleRecord) : null;

    let fullDesc = inference.summary;
    if (userNotes) {
      fullDesc = `${inference.summary} | Note: ${userNotes}`;
    }

    const nextId = this.incidents.length > 0 ? Math.max(...this.incidents.map((i) => i.incident_id)) + 1 : 1;
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newIncident: IncidentReport = {
      incident_id: nextId,
      incident_type: incidentType,
      zone_id: zone.zone_id,
      zone_name: zone.zone_name,
      zone_code: zone.zone_code,
      latitude: zone.latitude,
      longitude: zone.longitude,
      reported_by_user_id: user.user_id,
      reporter_name: user.full_name,
      reporter_role: user.role,
      detected_plate: inference.detected_plate,
      is_authorized_vehicle: isAuthorized,
      vehicle_owner_name: vehicleRecord?.owner_name,
      vehicle_owner_dept: vehicleRecord?.department,
      vehicle_owner_phone: vehicleRecord?.contact_phone,
      confidence_score: inference.confidence,
      severity: inference.severity,
      status: 'Open',
      image_path: inference.annotated_image_url,
      description: fullDesc,
      created_at: dateStr,
      defect_category: inference.defect_category,
      bbox_area_ratio: inference.bbox_area_ratio,
      estimated_diameter_cm: inference.estimated_diameter_cm,
      recommended_action: inference.recommended_action,
    };

    this.incidents.unshift(newIncident);
    this.save();

    if (this.isBackendOnline) {
      fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_type: incidentType,
          zone_id: zoneId,
          reported_by_user_id: reportedByUserId,
          detected_plate: inference.detected_plate,
          confidence_score: inference.confidence,
          severity: inference.severity,
          image_path: inference.annotated_image_url,
          description: inference.summary,
          user_notes: userNotes,
          defect_category: inference.defect_category,
          bbox_area_ratio: inference.bbox_area_ratio,
          estimated_diameter_cm: inference.estimated_diameter_cm,
          recommended_action: inference.recommended_action,
        }),
      }).catch((e) => console.warn('Backend sync failed:', e));
    }

    return newIncident;
  }

  public updateIncidentStatus(incidentId: number, status: IncidentStatus, notes: string): IncidentReport {
    const idx = this.incidents.findIndex((i) => i.incident_id === incidentId);
    if (idx === -1) {
      throw new Error(`Incident #${incidentId} not found`);
    }

    const updated = { ...this.incidents[idx] };
    updated.status = status;
    updated.resolution_notes = notes;
    if (status === 'Resolved' && !updated.resolved_at) {
      updated.resolved_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    this.incidents[idx] = updated;
    this.save();

    if (this.isBackendOnline) {
      fetch(`${API_BASE_URL}/api/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution_notes: notes }),
      }).catch((e) => console.warn('Backend status patch failed:', e));
    }

    return updated;
  }

  public getAnalytics(): CampusAnalytics {
    const total = this.incidents.length;
    const activeOpen = this.incidents.filter((i) => i.status === 'Open' || i.status === 'In_Progress').length;
    const resolved = this.incidents.filter((i) => i.status === 'Resolved').length;
    const outsiderFlags = this.incidents.filter((i) => i.is_authorized_vehicle === false).length;

    const breakdown: Record<IncidentType, number> = {
      unlawful_parking: 0,
      road_damage: 0,
      unauthorized_vehicle: 0,
    };

    this.incidents.forEach((i) => {
      if (breakdown[i.incident_type] !== undefined) {
        breakdown[i.incident_type]++;
      }
    });

    const zoneCountMap = new Map<number, number>();
    this.incidents.forEach((i) => {
      zoneCountMap.set(i.zone_id, (zoneCountMap.get(i.zone_id) || 0) + 1);
    });

    const zoneSummary = this.zones.map((z) => ({
      zone_name: z.zone_name,
      latitude: z.latitude,
      longitude: z.longitude,
      incident_count: zoneCountMap.get(z.zone_id) || 0,
    }));

    zoneSummary.sort((a, b) => b.incident_count - a.incident_count);

    return {
      total_incidents: total,
      active_open_incidents: activeOpen,
      resolved_incidents: resolved,
      unauthorized_outsider_flags: outsiderFlags,
      breakdown_by_type: breakdown,
      zone_heatmap_summary: zoneSummary,
    };
  }

  public getUsers(): User[] {
    return [...this.users];
  }
}

export const store = new CivicStore();
