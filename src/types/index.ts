export type UserRole = 'student' | 'faculty' | 'security' | 'admin' | 'civil_cell';

export interface User {
  user_id: number;
  full_name: string;
  role: UserRole;
  department_or_id: string;
  contact_phone?: string;
  created_at: string;
}

export interface CampusZone {
  zone_id: number;
  zone_code: string;
  zone_name: string;
  latitude: number;
  longitude: number;
  is_no_parking_zone: boolean;
  criticality_weight: number;
  roi_polygon: [number, number, number, number]; // [x1_ratio, y1_ratio, x2_ratio, y2_ratio]
  camera_position: [number, number, number]; // 3D Camera Vector [x, y, z]
  camera_target: [number, number, number]; // 3D Target Vector [x, y, z]
}

export type VehicleOwnerRole = 'student' | 'faculty' | 'staff' | 'college_bus' | 'ambulance';
export type VehicleType = 'two_wheeler' | 'four_wheeler' | 'bus' | 'emergency';

export interface RegisteredVehicle {
  vehicle_id: number;
  plate_number: string;
  owner_name: string;
  owner_role: VehicleOwnerRole;
  department: string;
  vehicle_type: VehicleType;
  pass_sticker_id: string;
  contact_phone?: string;
  is_active: boolean;
}

export type IncidentType = 'unlawful_parking' | 'road_damage' | 'unauthorized_vehicle';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Open' | 'In_Progress' | 'Resolved' | 'Dismissed';
export type RoadDefectCategory = 'Pothole' | 'Alligator_Crack' | 'Longitudinal_Crack' | 'Waterlogging_Edge_Drop';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  confidence: number;
}

export interface InferenceResult {
  task_type: IncidentType;
  detected: boolean;
  confidence: number;
  severity: SeverityLevel;
  summary: string;
  annotated_image_url: string;
  bounding_boxes: BoundingBox[];
  detected_plate?: string | null;
  vehicle_type?: string | null;
  defect_category?: RoadDefectCategory | null;
  bbox_area_ratio: number;
  estimated_diameter_cm: number;
  recommended_action?: string | null;
  engine_mode: string;
}

export interface IncidentReport {
  incident_id: number;
  incident_type: IncidentType;
  zone_id: number;
  zone_name: string;
  zone_code: string;
  latitude: number;
  longitude: number;
  reported_by_user_id: number;
  reporter_name: string;
  reporter_role: string;
  detected_plate?: string | null;
  is_authorized_vehicle?: boolean | null;
  vehicle_owner_name?: string | null;
  vehicle_owner_dept?: string | null;
  vehicle_owner_phone?: string | null;
  confidence_score: number;
  severity: SeverityLevel;
  status: IncidentStatus;
  image_path: string;
  description: string;
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
  defect_category?: RoadDefectCategory | null;
  bbox_area_ratio?: number;
  estimated_diameter_cm?: number;
  recommended_action?: string | null;
}

export interface ZoneAnalyticsItem {
  zone_name: string;
  latitude: number;
  longitude: number;
  incident_count: number;
}

export interface CampusAnalytics {
  total_incidents: number;
  active_open_incidents: number;
  resolved_incidents: number;
  unauthorized_outsider_flags: number;
  breakdown_by_type: Record<IncidentType, number>;
  zone_heatmap_summary: ZoneAnalyticsItem[];
}

export type OperatingPersona =
  | 'digital_twin'
  | 'gate_anpr'
  | 'cctv_edge'
  | 'incident_reporter'
  | 'estate_dispatch';

export type TimeOfDay = 'day' | 'dusk' | 'night';

export type DwellState = 'approaching' | 'turning' | 'parked' | 'cleared';

export interface VehicleDwellRecord {
  id: string;
  plateNumber: string;
  zoneId: number;
  zoneName: string;
  overlapPercentage: number;
  firstDetectedAt: number;
  lastSeenAt: number;
  dwellSeconds: number;
  state: DwellState;
  countdownRemaining: number;
  vehicleType: string;
  snapshotUrl?: string;
}

export interface DeduplicationRecord {
  signature: string;
  plateNumber: string;
  zoneId: number;
  defectType: string;
  firstSeenAt: number;
  lastSeenAt: number;
  suppressUntil: number;
  alertCount: number;
}

export interface CctvCameraFeed {
  id: string;
  code: string;
  name: string;
  location: string;
  zoneId: number;
  type: 'webcam' | 'simulated_rtsp';
  resolution: string;
  framerate: number;
  isActive: boolean;
}
