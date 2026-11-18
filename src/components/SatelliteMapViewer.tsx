import React, { useState } from 'react';
import { CampusZone, IncidentReport } from '../types';
import { MapPin, Navigation, Info, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface SatelliteMapViewerProps {
  zones: CampusZone[];
  incidents: IncidentReport[];
  activeZoneId: number;
  onSelectZone: (zoneId: number) => void;
}

export const SatelliteMapViewer: React.FC<SatelliteMapViewerProps> = ({
  zones,
  incidents,
  activeZoneId,
  onSelectZone,
}) => {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  const sectorPins = [
    {
      id: 1, // Gate 3
      name: 'Gate 3 & Red Emergency Buffer',
      code: 'ZONE-GATE-03',
      x: 21,
      y: 65,
      type: 'gate_critical',
      tag: 'Gate 3 (Emergency Buffer)',
    },
    {
      id: 2, // Gate 2
      name: 'Gate 2 (CSMSS Rd)',
      code: 'ZONE-GATE-02',
      x: 64,
      y: 73,
      type: 'gate',
      tag: 'Gate 2 (CSMSS Rd Checkpoint)',
    },
    {
      id: 3, // Engineering College
      name: 'CSMSS Chh. Shahu College of Engineering',
      code: 'ZONE-ENG-COLLEGE',
      x: 17,
      y: 78,
      type: 'college',
      tag: 'Engineering Main Complex',
    },
    {
      id: 4, // Polytechnic
      name: 'CSMSS College of Polytechnic',
      code: 'ZONE-POLYTECHNIC',
      x: 53,
      y: 72,
      type: 'polytechnic',
      tag: 'Polytechnic Campus',
    },
    {
      id: 5, // Dental College
      name: 'CSMSS Dental College',
      code: 'ZONE-DENTAL',
      x: 37,
      y: 40,
      type: 'dental',
      tag: 'Dental College & Central Spine',
    },
    {
      id: 6, // Ayurveda College
      name: 'CSMSS Ayurveda College & Hospital',
      code: 'ZONE-AYURVEDA',
      x: 48,
      y: 16,
      type: 'ayurveda',
      tag: 'Ayurveda College & Hospital',
    },
    {
      id: 7, // Faculty / Student Parking
      name: 'Faculty & Student Parking Bay',
      code: 'ZONE-PARKING',
      x: 62,
      y: 33,
      type: 'parking',
      tag: 'Faculty / Student Parking',
    },
  ];

  return (
    <div className="relative w-full h-[540px] bg-white rounded-2xl overflow-hidden border border-[#d6c4b6] shadow-md flex flex-col group select-none">
      {/* Top Header Bar styled in warm cream and maroon */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-[#fbf8f5] to-[#f4ece5] border-b border-[#e2d5cb] flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-[#800000]" />
          <span className="text-xs font-bold text-[#800000] font-serif tracking-wide">
            Annotated Campus Satellite Map
          </span>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Kanchanwadi Layout
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-0.5 rounded-full bg-[#fdf2e9] text-[#800000] border border-[#f0cbb1] font-bold">
            Gate 2 & Gate 3 Synced
          </span>
        </div>
      </div>

      {/* Map Graphic Area with Vector Overlay */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <img
          src="/assets/campus/Screenshot_2026-11-09_121047_45ecb732.png"
          alt="CSMSS Kanchanwadi Satellite Layout"
          className="w-full h-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Interactive Vector Pins matching user layout */}
        {sectorPins.map((pin) => {
          const isSelected = activeZoneId === pin.id;
          const zoneIncidents = incidents.filter((i) => i.zone_id === pin.id);
          const hasCritical = zoneIncidents.some((i) => i.severity === 'Critical');

          return (
            <div
              key={pin.id}
              onClick={() => onSelectZone(pin.id)}
              onMouseEnter={() => setHoveredPin(pin.name)}
              onMouseLeave={() => setHoveredPin(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin transition-all duration-300 ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-115'
              }`}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <div className="relative flex flex-col items-center">
                {/* Visual Pin Marker */}
                <div
                  className={`p-1.5 rounded-full border shadow-xl flex items-center justify-center transition ${
                    pin.id === 1
                      ? 'bg-rose-700 text-white border-rose-300 ring-2 ring-rose-500' // Red Box Gate 3
                      : isSelected
                      ? 'bg-[#800000] text-amber-300 border-amber-300 ring-2 ring-[#800000]'
                      : 'bg-white text-[#800000] border-[#d6c4b6] hover:border-[#800000]'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>

                {/* Badge Label */}
                <div
                  className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap shadow-md border transition ${
                    isSelected
                      ? 'bg-[#800000] text-amber-50 border-[#660000]'
                      : 'bg-white/95 text-slate-800 border-[#e2d5cb] group-hover/pin:border-[#800000]'
                  }`}
                >
                  {pin.tag}
                </div>

                {zoneIncidents.length > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white shadow ${
                      hasCritical ? 'bg-rose-600' : 'bg-amber-600'
                    }`}
                  >
                    {zoneIncidents.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Floating Sector Details Card in Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-[#d6c4b6] p-3 rounded-2xl shadow-xl text-xs z-20 max-w-[260px]">
          <div className="text-[10px] font-bold text-[#800000] uppercase tracking-wider mb-0.5 font-serif">
            Selected Campus Sector
          </div>
          <div className="font-bold text-slate-900 text-xs">
            {sectorPins.find((p) => p.id === activeZoneId)?.name}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Click any gate or building pin to sync 3D camera.
          </div>
        </div>

        {/* Red Emergency Box Callout on Gate 3 */}
        <div className="absolute top-[68%] left-[9%] bg-rose-700/95 text-white border border-rose-300 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xl pointer-events-none hidden sm:block">
          🚨 Red Emergency Buffer (Gate 3)
        </div>
      </div>
    </div>
  );
};
