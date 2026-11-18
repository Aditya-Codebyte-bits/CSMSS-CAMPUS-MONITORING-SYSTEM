"""
CSMSS Kanchanwadi Civic & Security Monitoring System
SQLite Relational Database & Seed Data Manager
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "csmss_civic.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS campus_zones (
        zone_id INTEGER PRIMARY KEY,
        zone_code TEXT NOT NULL,
        zone_name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        is_no_parking_zone BOOLEAN NOT NULL DEFAULT 0,
        criticality_weight REAL NOT NULL DEFAULT 1.0,
        roi_polygon TEXT NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS registered_vehicles (
        vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT UNIQUE NOT NULL,
        owner_name TEXT NOT NULL,
        owner_role TEXT NOT NULL,
        department TEXT NOT NULL,
        vehicle_type TEXT NOT NULL,
        pass_sticker_id TEXT UNIQUE NOT NULL,
        contact_phone TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS incident_reports (
        incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_type TEXT NOT NULL,
        zone_id INTEGER NOT NULL,
        zone_name TEXT NOT NULL,
        zone_code TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        reported_by_user_id INTEGER NOT NULL,
        reporter_name TEXT NOT NULL,
        reporter_role TEXT NOT NULL,
        detected_plate TEXT,
        is_authorized_vehicle BOOLEAN,
        vehicle_owner_name TEXT,
        vehicle_owner_dept TEXT,
        vehicle_owner_phone TEXT,
        confidence_score REAL NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        image_path TEXT,
        description TEXT NOT NULL,
        resolution_notes TEXT,
        defect_category TEXT,
        bbox_area_ratio REAL,
        estimated_diameter_cm REAL,
        recommended_action TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (zone_id) REFERENCES campus_zones (zone_id)
    );
    """)

    cur.execute("SELECT COUNT(*) FROM campus_zones;")
    if cur.fetchone()[0] == 0:
        initial_zones = [
            (1, 'ZONE-GATE-03', 'Gate 3 (Engineering & Workshop Checkpoint)', 19.8160, 75.2908, 1, 1.8, '[0.12, 0.18, 0.88, 0.86]'),
            (2, 'ZONE-GATE-02', 'Gate 2 (Polytechnic & CSMSS Rd Checkpoint)', 19.8155, 75.2928, 1, 1.6, '[0.15, 0.20, 0.85, 0.88]'),
            (3, 'ZONE-ENG-COLLEGE', 'CSMSS Chh. Shahu College of Engineering', 19.8154, 75.2906, 1, 1.7, '[0.10, 0.15, 0.90, 0.90]'),
            (4, 'ZONE-POLYTECHNIC', 'CSMSS College of Polytechnic', 19.8150, 75.2922, 0, 1.3, '[0.15, 0.20, 0.85, 0.85]'),
            (5, 'ZONE-DENTAL', 'CSMSS Dental College & Central Spine', 19.8166, 75.2914, 0, 1.4, '[0.15, 0.20, 0.85, 0.85]'),
            (6, 'ZONE-AYURVEDA', 'CSMSS Ayurveda College & Rugnalaya Hospital', 19.8174, 75.2912, 1, 2.0, '[0.10, 0.15, 0.90, 0.90]'),
            (7, 'ZONE-PARKING', 'Designated Faculty & Student Parking Bay', 19.8168, 75.2924, 0, 1.1, '[0.15, 0.20, 0.85, 0.85]'),
        ]
        cur.executemany("""
            INSERT INTO campus_zones (zone_id, zone_code, zone_name, latitude, longitude, is_no_parking_zone, criticality_weight, roi_polygon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, initial_zones)

    cur.execute("SELECT COUNT(*) FROM registered_vehicles;")
    if cur.fetchone()[0] == 0:
        initial_vehicles = [
            ('MH20EE4512', 'Prof. S. B. Deshmukh', 'faculty', 'Computer Science', 'four_wheeler', 'CSMSS-PASS-001', '9422200112', 1),
            ('MH20BY1122', 'Aarav Kulkarni', 'student', 'Computer Science', 'two_wheeler', 'CSMSS-PASS-104', '9823011223', 1),
            ('MH20DV8801', 'Snehal Chavan', 'student', 'Artificial Intelligence', 'two_wheeler', 'CSMSS-PASS-118', '9763312345', 1),
            ('MH20AZ9090', 'CSMSS Campus Transit Bus #4', 'college_bus', 'Logistics Cell', 'bus', 'CSMSS-BUS-004', '9422090900', 1),
            ('MH20AM1080', 'CSMSS Rugnalaya Emergency Van', 'ambulance', 'Ayurveda Hospital', 'emergency', 'CSMSS-EMG-108', '9422010800', 1),
            ('MH20CT3344', 'Prof. M. R. Shinde', 'faculty', 'Mechanical', 'four_wheeler', 'CSMSS-PASS-019', '9890122334', 1),
        ]
        cur.executemany("""
            INSERT INTO registered_vehicles (plate_number, owner_name, owner_role, department, vehicle_type, pass_sticker_id, contact_phone, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, initial_vehicles)

    cur.execute("SELECT COUNT(*) FROM incident_reports;")
    if cur.fetchone()[0] == 0:
        initial_incidents = [
            (
                'unlawful_parking', 1, 'Gate 3 (Engineering & Workshop Checkpoint)', 'ZONE-GATE-03',
                19.8160, 75.2908, 1, 'Rameshwar Jadhav (Gate 3 Security)', 'security',
                'MH20BY1122', 1, 'Aarav Kulkarni', 'Computer Science', '9823011223',
                0.94, 'Critical', 'In_Progress', '',
                'Vehicle parked inside the Red Emergency Bottleneck at Gate 3 directly obstructing workshop fire exits (Plate: MH20BY1122).',
                'Patrol guard instructed driver to shift to designated student parking bay.',
                None, 0.18, 0, 'Dispatch security guard & alert registered driver immediately.',
                '2026-11-08 09:45:00', None
            ),
            (
                'road_damage', 6, 'CSMSS Ayurveda College & Rugnalaya Hospital', 'ZONE-AYURVEDA',
                19.8174, 75.2912, 2, 'Prof. S. B. Deshmukh', 'faculty',
                None, None, None, None, None,
                0.92, 'Critical', 'Open', '',
                'Surface pothole cavity (~60 cm span) along the Ayurveda Hospital ambulance link causing severe transit deceleration.',
                None, 'Pothole', 0.142, 60, 'Deploy safety cones and dispatch cold-mix asphalt patch unit within 24h.',
                '2026-11-08 10:15:00', None
            ),
            (
                'unauthorized_vehicle', 2, 'Gate 2 (Polytechnic & CSMSS Rd Checkpoint)', 'ZONE-GATE-02',
                19.8155, 75.2928, 3, 'Main Gate Shift Officer', 'security',
                'MH12XY9999', 0, None, None, None,
                0.93, 'High', 'Open', '',
                'Unregistered visitor vehicle (MH12XY9999) intercepted at Gate 2 entrance on CSMSS Rd.',
                None, None, None, None, 'Verify visitor government ID, issue temporary visitor slip, and direct to visitor parking.',
                '2026-11-08 11:20:00', None
            )
        ]
        cur.executemany("""
            INSERT INTO incident_reports (
                incident_type, zone_id, zone_name, zone_code,
                latitude, longitude, reported_by_user_id, reporter_name, reporter_role,
                detected_plate, is_authorized_vehicle, vehicle_owner_name, vehicle_owner_dept, vehicle_owner_phone,
                confidence_score, severity, status, image_path,
                description, resolution_notes, defect_category, bbox_area_ratio, estimated_diameter_cm, recommended_action,
                created_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, initial_incidents)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("CSMSS Civic SQLite database initialized at:", DB_PATH)
