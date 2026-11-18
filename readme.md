# CSMSS Kanchanwadi Smart Civic & Security Monitoring System
**Community Involved Project (CIP — 150 Marks) | Submission & Viva Defense Kit**  
**Institution:** CSMSS Chh. Shahu College of Engineering, Kanchanwadi, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra

---

## 1. Executive Summary & Zero-Cost Architecture

The **CSMSS Smart Civic & Security Monitoring System** is a zero-cost, offline-capable application engineered specifically for the shared Kanchanwadi campus ecosystem (housing the Engineering College, Polytechnic, Ayurveda Mahavidyalaya & Rugnalaya Hospital, Dental College, and Hostels). It solves three daily civic and operational challenges:

1. **Unlawful Parking Detection (Module 1)**: Identifies two-wheelers and cars parked inside restricted campus zones (Workshop Fire Exits, Pedestrian Walkways, Hospital Ambulance Link Road, and Reserved Faculty Bays) using computer vision contour and bounding-box detection intersected against normalized Restricted Zone Regions of Interest (ROI).
2. **Road Damage Detection (Module 2)**: Detects monsoon potholes, longitudinal cracks, and surface degradation on internal link roads, automatically computing bounding-box surface area ratio and estimated defect diameter (cm) to generate prioritized maintenance work orders for the CSMSS Estate & Civil Cell.
3. **Outsider & Unauthorized Vehicle Monitoring / ANPR (Module 3)**: Extracts Indian vehicle registration numbers (`MH20`, `MH12`, etc.) using CLAHE contrast enhancement and Indian RTO regex normalization, cross-referencing them in real time against the authorized student/faculty/bus/ambulance registry.

---

## 2. Tech Stack & Architecture

- **Frontend & App Shell**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Computer Vision Engine**: Client-side HTML5 Canvas pixel analysis & morphology pipeline with spatial ROI intersection, contour edge detection, and position-aware Indian RTO plate normalization (`src/services/inferenceEngine.ts`).
- **Data Persistence**: Relational-like local store preserving the 5 core schemas:
  - `users`: Students, faculty, security guards, civil maintenance staff
  - `campus_zones`: Kanchanwadi campus GPS coordinates (`19.8162° N, 75.2914° E`), criticality weights & ROI boxes
  - `registered_vehicles`: Whitelisted student/faculty/bus/ambulance vehicles
  - `incident_reports`: Master geo-tagged civic & security incident log
  - `road_damage_logs`: Pothole & surface fracture maintenance extension records
- **Interactive Geospatial Map**: Canvas/SVG campus heatmap centered on CSMSS Kanchanwadi with zone boundaries and active incident markers.
- **Viva Defense Kit**:
  - In-app 8-step automated self-test runner
  - Top evaluator Q&A cheat sheet & 10-slide presentation outline modal

---

## 3. Operational Persona Modes

1. **🎓 Student / Staff Civic Reporter**:
   - Report unlawful parking, road potholes, or suspicious vehicles.
   - Choose from pre-loaded CSMSS Kanchanwadi test scenarios or upload mobile captures.
   - Real-time visual feedback with annotated bounding boxes, restricted ROI polygons, and vehicle owner lookup.

2. **🚨 Security & Estate Command Center**:
   - Interactive CSMSS Kanchanwadi Geospatial Heatmap (`19.8162° N, 75.2914° E`).
   - Incident queue triage with status workflow (`Open`, `In_Progress`, `Resolved`, `Dismissed`).
   - Official resolution notes and CSV audit log download.

3. **🚗 Gate ANPR & Vehicle Registry**:
   - Instant plate verification desk with green authorized / red outsider warning banners.
   - New campus vehicle pass registration.
   - Searchable authorized vehicle whitelist.

---

## 4. Running the Application

```bash
npm install
npm run dev
```

The application runs on `http://0.0.0.0:3000`.
