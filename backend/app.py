"""
CSMSS Kanchanwadi Smart Civic & Security Monitoring System
FastAPI REST API & Multi-Device Synchronization Engine
"""
import json
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import get_connection, init_db

init_db()

app = FastAPI(
    title="CSMSS Kanchanwadi Civic Monitor API",
    description="Edge Computer Vision & Real-Time Campus Gate ANPR / Incident Dispatch Engine",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewIncidentRequest(BaseModel):
    incident_type: str
    zone_id: int
    reported_by_user_id: int = 1
    detected_plate: Optional[str] = None
    confidence_score: float = 0.94
    severity: str = "Critical"
    image_path: str = ""
    description: str
    user_notes: Optional[str] = None
    defect_category: Optional[str] = None
    bbox_area_ratio: Optional[float] = 0.0
    estimated_diameter_cm: Optional[float] = 0.0
    recommended_action: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: str
    resolution_notes: str

class NewVehicleRequest(BaseModel):
    plate_number: str
    owner_name: str
    owner_role: str
    department: str = "General"
    vehicle_type: str = "four_wheeler"
    pass_sticker_id: str
    contact_phone: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "CSMSS Kanchanwadi Civic Monitor Edge",
        "campus": "Chh. Shahu College of Engineering, Kanchanwadi",
        "timestamp": datetime.now().isoformat(),
        "database": "sqlite3:csmss_civic.db"
    }

@app.get("/api/zones")
def list_zones():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM campus_zones ORDER BY zone_id ASC;")
    rows = cur.fetchall()
    zones = []
    for r in rows:
        d = dict(r)
        d["roi_polygon"] = json.loads(d["roi_polygon"])
        zones.append(d)
    conn.close()
    return zones

@app.get("/api/vehicles")
def list_vehicles(role: Optional[str] = None, search: Optional[str] = None):
    conn = get_connection()
    cur = conn.cursor()
    query = "SELECT * FROM registered_vehicles WHERE is_active = 1"
    params = []
    if role and role != "all":
        query += " AND owner_role = ?"
        params.append(role)
    if search:
        query += " AND (plate_number LIKE ? OR owner_name LIKE ? OR department LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])
    query += " ORDER BY vehicle_id DESC;"
    cur.execute(query, params)
    vehicles = [dict(r) for r in cur.fetchall()]
    conn.close()
    return vehicles

@app.get("/api/vehicles/verify/{plate_number}")
def verify_plate(plate_number: str):
    clean_plate = plate_number.upper().replace(" ", "").replace("-", "")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM registered_vehicles WHERE plate_number = ? AND is_active = 1;", (clean_plate,))
    row = cur.fetchone()
    conn.close()

    if row:
        v = dict(row)
        return {
            "plate_number": clean_plate,
            "is_authorized": True,
            "classification": "AUTHORIZED_CAMPUS_MEMBER",
            "vehicle_details": v
        }
    return {
        "plate_number": clean_plate,
        "is_authorized": False,
        "classification": "UNREGISTERED_VISITOR",
        "vehicle_details": None
    }

@app.post("/api/vehicles")
def register_vehicle(req: NewVehicleRequest):
    clean_plate = req.plate_number.upper().replace(" ", "").replace("-", "")
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO registered_vehicles (plate_number, owner_name, owner_role, department, vehicle_type, pass_sticker_id, contact_phone, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1);
        """, (clean_plate, req.owner_name, req.owner_role, req.department, req.vehicle_type, req.pass_sticker_id, req.contact_phone))
        conn.commit()
        vid = cur.lastrowid
        cur.execute("SELECT * FROM registered_vehicles WHERE vehicle_id = ?;", (vid,))
        created = dict(cur.fetchone())
        conn.close()
        return created
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/incidents")
def list_incidents(status: Optional[str] = None):
    conn = get_connection()
    cur = conn.cursor()
    if status and status != "All":
        cur.execute("SELECT * FROM incident_reports WHERE status = ? ORDER BY incident_id DESC;", (status,))
    else:
        cur.execute("SELECT * FROM incident_reports ORDER BY incident_id DESC;")
    incidents = [dict(r) for r in cur.fetchall()]
    conn.close()
    return incidents

@app.post("/api/incidents")
def create_incident(req: NewIncidentRequest):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM campus_zones WHERE zone_id = ?;", (req.zone_id,))
    zone = cur.fetchone()
    if not zone:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Zone ID {req.zone_id} not found")

    zone_name = zone["zone_name"]
    zone_code = zone["zone_code"]
    lat = zone["latitude"]
    lng = zone["longitude"]

    clean_plate = req.detected_plate.upper().replace(" ", "") if req.detected_plate else None
    vehicle_info = None
    is_auth = None
    if clean_plate:
        cur.execute("SELECT * FROM registered_vehicles WHERE plate_number = ? AND is_active = 1;", (clean_plate,))
        v_row = cur.fetchone()
        if v_row:
            vehicle_info = dict(v_row)
            is_auth = True
        else:
            is_auth = False

    full_desc = req.description
    if req.user_notes:
        full_desc = f"{req.description} | Note: {req.user_notes}"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO incident_reports (
            incident_type, zone_id, zone_name, zone_code,
            latitude, longitude, reported_by_user_id, reporter_name, reporter_role,
            detected_plate, is_authorized_vehicle, vehicle_owner_name, vehicle_owner_dept, vehicle_owner_phone,
            confidence_score, severity, status, image_path,
            description, resolution_notes, defect_category, bbox_area_ratio, estimated_diameter_cm, recommended_action,
            created_at, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);
    """, (
        req.incident_type, req.zone_id, zone_name, zone_code,
        lat, lng, req.reported_by_user_id, "Edge System / Mobile Reporter", "security",
        clean_plate, is_auth, vehicle_info.get("owner_name") if vehicle_info else None,
        vehicle_info.get("department") if vehicle_info else None, vehicle_info.get("contact_phone") if vehicle_info else None,
        req.confidence_score, req.severity, "Open", req.image_path,
        full_desc, "", req.defect_category, req.bbox_area_ratio, req.estimated_diameter_cm, req.recommended_action,
        now_str
    ))

    conn.commit()
    inc_id = cur.lastrowid
    cur.execute("SELECT * FROM incident_reports WHERE incident_id = ?;", (inc_id,))
    created = dict(cur.fetchone())
    conn.close()
    return created

@app.patch("/api/incidents/{incident_id}/status")
def update_status(incident_id: int, req: StatusUpdateRequest):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM incident_reports WHERE incident_id = ?;", (incident_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    resolved_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if req.status == "Resolved" else None
    cur.execute("""
        UPDATE incident_reports
        SET status = ?, resolution_notes = ?, resolved_at = COALESCE(resolved_at, ?)
        WHERE incident_id = ?;
    """, (req.status, req.resolution_notes, resolved_at, incident_id))
    conn.commit()
    cur.execute("SELECT * FROM incident_reports WHERE incident_id = ?;", (incident_id,))
    updated = dict(cur.fetchone())
    conn.close()
    return updated

@app.get("/api/analytics")
def get_analytics():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM incident_reports;")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM incident_reports WHERE status IN ('Open', 'In_Progress');")
    active_open = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM incident_reports WHERE status = 'Resolved';")
    resolved = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM incident_reports WHERE is_authorized_vehicle = 0;")
    outsider_flags = cur.fetchone()[0]

    cur.execute("""
        SELECT incident_type, COUNT(*) as count
        FROM incident_reports
        GROUP BY incident_type;
    """)
    type_counts = {"unlawful_parking": 0, "road_damage": 0, "unauthorized_vehicle": 0}
    for r in cur.fetchall():
        if r["incident_type"] in type_counts:
            type_counts[r["incident_type"]] = r["count"]

    conn.close()
    return {
        "total_incidents": total,
        "active_open_incidents": active_open,
        "resolved_incidents": resolved,
        "unauthorized_outsider_flags": outsider_flags,
        "breakdown_by_type": type_counts
    }
