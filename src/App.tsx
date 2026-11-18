import React, { useState, useCallback, useEffect } from 'react';
import { OperatingPersona } from './types';
import { store } from './services/store';
import { Header } from './components/Header';
import { Campus3DViewer } from './components/Campus3DViewer';
import { SatelliteMapViewer } from './components/SatelliteMapViewer';
import { GateAnprView } from './components/GateAnprView';
import { StudentReporterView } from './components/StudentReporterView';
import { CommandCenterView } from './components/CommandCenterView';
import { CctvEdgeMatrixView } from './components/CctvEdgeMatrixView';
import { StoryModeTour } from './components/StoryModeTour';
import {
  Car,
  Shield,
  FileText,
  Activity,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentPersona, setCurrentPersona] = useState<OperatingPersona>('digital_twin');
  const [zones, setZones] = useState(store.getZones());
  const [vehicles, setVehicles] = useState(store.getVehicles());
  const [incidents, setIncidents] = useState(store.getIncidents());
  const [analytics, setAnalytics] = useState(store.getAnalytics());

  const [activeZoneId, setActiveZoneId] = useState<number>(1);
  const [isBoomBarrierOpen, setIsBoomBarrierOpen] = useState<boolean>(false);
  const [isStoryTourOpen, setIsStoryTourOpen] = useState<boolean>(false);
  const [splitLayoutMode, setSplitLayoutMode] = useState<'dual' | '3d_only' | 'map_only'>('dual');

  const refreshState = useCallback(() => {
    setZones(store.getZones());
    setVehicles(store.getVehicles());
    setIncidents(store.getIncidents());
    setAnalytics(store.getAnalytics());
  }, []);

  // Poll backend sync on initial mount and every 5 seconds for live multi-device updates
  useEffect(() => {
    let mounted = true;
    const syncWithBackend = async () => {
      const updated = await store.checkBackendSync();
      if (mounted && updated) {
        refreshState();
      }
    };
    syncWithBackend();
    const intervalId = window.setInterval(syncWithBackend, 5000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [refreshState]);

  const handleResetData = () => {
    if (window.confirm('Reset all campus incidents and whitelist to original default state?')) {
      store.resetAll();
      refreshState();
    }
  };

  const activeZone = zones.find((z) => z.zone_id === activeZoneId) || zones[0];
  const activeZoneIncidents = incidents.filter((i) => i.zone_id === activeZoneId);

  return (
    <div className="min-h-screen bg-[#f8f5f1] text-slate-800 flex flex-col font-sans selection:bg-[#800000] selection:text-white">
      {/* Top Institutional Navigation Bar */}
      <Header
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        analytics={analytics}
        onStartStoryTour={() => setIsStoryTourOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12 overflow-x-hidden">
        {/* VIEW 1: DUAL-VIEW SPLIT (3D DIGITAL TWIN + SATELLITE MAP) */}
        {currentPersona === 'digital_twin' && (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header info strip & view mode toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2d5cb] shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-[#800000] font-serif tracking-tight flex items-center gap-2">
                  <span>CSMSS Kanchanwadi Campus Twin</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Synchronized Dual-View: 3D WebGL Digital Twin paired directly with your annotated Satellite Layout.
                </p>
              </div>

              {/* View Layout Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#fdfbf9] p-1 rounded-xl border border-[#d6c4b6] shadow-2xs">
                  <button
                    onClick={() => setSplitLayoutMode('dual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      splitLayoutMode === 'dual'
                        ? 'bg-[#800000] text-amber-50 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-[#800000]'
                    }`}
                  >
                    Dual Split
                  </button>
                  <button
                    onClick={() => setSplitLayoutMode('3d_only')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      splitLayoutMode === '3d_only'
                        ? 'bg-[#800000] text-amber-50 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-[#800000]'
                    }`}
                  >
                    3D / 2D Twin Only
                  </button>
                  <button
                    onClick={() => setSplitLayoutMode('map_only')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      splitLayoutMode === 'map_only'
                        ? 'bg-[#800000] text-amber-50 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-[#800000]'
                    }`}
                  >
                    Satellite Map Only
                  </button>
                </div>
              </div>
            </div>

            {/* DUAL-VIEW SPLIT CONTAINER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: 3D Digital Twin Viewport */}
              {(splitLayoutMode === 'dual' || splitLayoutMode === '3d_only') && (
                <div className={splitLayoutMode === 'dual' ? 'lg:col-span-6' : 'lg:col-span-12'}>
                  <Campus3DViewer
                    zones={zones}
                    incidents={incidents}
                    activeZoneId={activeZoneId}
                    onSelectZone={(zId) => setActiveZoneId(zId)}
                    boomBarrierOpen={isBoomBarrierOpen}
                  />
                </div>
              )}

              {/* Right Pane: Annotated Satellite Map Viewport */}
              {(splitLayoutMode === 'dual' || splitLayoutMode === 'map_only') && (
                <div className={splitLayoutMode === 'dual' ? 'lg:col-span-6' : 'lg:col-span-12'}>
                  <SatelliteMapViewer
                    zones={zones}
                    incidents={incidents}
                    activeZoneId={activeZoneId}
                    onSelectZone={(zId) => setActiveZoneId(zId)}
                  />
                </div>
              )}
            </div>

            {/* Active Zone Detail & Live Actions Deck */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Active Zone Info */}
              <div className="bg-white border border-[#e2d5cb] rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#800000] uppercase tracking-wider font-serif">
                    Selected Sector
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#800000] bg-[#fbf4f0] px-2 py-0.5 rounded border border-[#e8d2c4]">
                    {activeZone.zone_code}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">{activeZone.zone_name}</h3>
                <p className="text-xs text-slate-600">
                  Criticality Weight: <strong className="text-slate-800">{activeZone.criticality_weight}x</strong> ·{' '}
                  {activeZone.is_no_parking_zone ? 'Strict No-Parking Enforcement' : 'General Campus Access'}
                </p>
                <div className="pt-2 border-t border-[#f0e6de] text-[11px] text-slate-500 font-mono">
                  GPS: {activeZone.latitude.toFixed(4)}° N, {activeZone.longitude.toFixed(4)}° E
                </div>
              </div>

              {/* Incidents in this sector */}
              <div className="bg-white border border-[#e2d5cb] rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#800000] uppercase tracking-wider font-serif">
                    Sector Activity
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#fdf2e9] text-[#800000] border border-[#f0cbb1] font-semibold">
                    {activeZoneIncidents.length} Logged
                  </span>
                </div>

                {activeZoneIncidents.length > 0 ? (
                  <div className="space-y-1.5 text-xs pt-1">
                    {activeZoneIncidents.slice(0, 2).map((inc) => (
                      <div key={inc.incident_id} className="p-2.5 rounded-xl bg-[#fbf8f5] border border-[#e8dcd2]">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>#{inc.incident_id} {inc.incident_type.replace('_', ' ')}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              inc.severity === 'Critical'
                                ? 'text-rose-700 bg-rose-50 border border-rose-200'
                                : 'text-amber-800 bg-amber-50 border border-amber-200'
                            }`}
                          >
                            {inc.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{inc.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No active hazards logged in this sector.</p>
                )}
              </div>

              {/* Quick Tactical Actions */}
              <div className="bg-white border border-[#e2d5cb] rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-[#800000] uppercase tracking-wider font-serif block">
                  Sector Controls
                </span>

                <div className="space-y-2">
                  <button
                    onClick={() => setCurrentPersona('gate_anpr')}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#fbf4f0] text-[#800000] border border-[#e2d5cb] hover:bg-[#800000] hover:text-white transition text-left flex items-center justify-between cursor-pointer shadow-2xs"
                  >
                    <span>Inspect Gate 2 & 3 ANPR Desk</span>
                    <Car className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentPersona('cctv_edge')}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#f4f7fa] text-[#0f4c81] border border-[#d0dbe5] hover:bg-[#0f4c81] hover:text-white transition text-left flex items-center justify-between cursor-pointer shadow-2xs"
                  >
                    <span>Launch CCTV Edge & Overlap Suite</span>
                    <Shield className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentPersona('incident_reporter')}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#fdf8f4] text-[#a31515] border border-[#e2d5cb] hover:bg-[#a31515] hover:text-white transition text-left flex items-center justify-between cursor-pointer shadow-2xs"
                  >
                    <span>Launch AI Camera Scanner</span>
                    <Activity className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentPersona('estate_dispatch')}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#f5fbf7] text-[#065f46] border border-[#c6e7d6] hover:bg-[#065f46] hover:text-white transition text-left flex items-center justify-between cursor-pointer shadow-2xs"
                  >
                    <span>Open Estate Dispatch Queue</span>
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: GATE ANPR CHECKPOINT */}
        {currentPersona === 'gate_anpr' && (
          <div>
            <GateAnprView
              vehicles={vehicles}
              onRefresh={refreshState}
              onBarrierChange={(isOpen) => setIsBoomBarrierOpen(isOpen)}
            />
          </div>
        )}

        {/* VIEW: LIVE CCTV EDGE & AUTOMATED SPATIAL DWELL MATRIX */}
        {currentPersona === 'cctv_edge' && (
          <div>
            <CctvEdgeMatrixView
              onRefresh={refreshState}
              onBarrierChange={(isOpen) => setIsBoomBarrierOpen(isOpen)}
              onFocusZone={(zId) => setActiveZoneId(zId)}
            />
          </div>
        )}

        {/* VIEW 3: VISUAL COMPUTER VISION INCIDENT REPORTER */}
        {currentPersona === 'incident_reporter' && (
          <div>
            <StudentReporterView
              zones={zones}
              onIncidentLogged={refreshState}
              onFocusZone={(zId) => setActiveZoneId(zId)}
            />
          </div>
        )}

        {/* VIEW 4: ESTATE DISPATCH & MASTER AUDIT QUEUE */}
        {currentPersona === 'estate_dispatch' && (
          <div>
            <CommandCenterView
              zones={zones}
              incidents={incidents}
              analytics={analytics}
              onRefresh={refreshState}
              onFocusZone={(zId) => setActiveZoneId(zId)}
            />
          </div>
        )}
      </main>

      {/* Interactive Story Tour Modal */}
      <StoryModeTour
        isOpen={isStoryTourOpen}
        onClose={() => setIsStoryTourOpen(false)}
        onFlyToZone={(zId) => setActiveZoneId(zId)}
        onSwitchPersona={(persona) => setCurrentPersona(persona)}
        onTriggerBarrier={(open) => setIsBoomBarrierOpen(open)}
      />

      {/* Institutional Footer */}
      <footer className="border-t border-[#e2d5cb] bg-[#f4eee8] py-5 px-4 text-xs text-[#5c1c1c]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-bold text-[#800000] font-serif">
              CSMSS Chh. Shahu College of Engineering, Kanchanwadi
            </p>
            <p className="text-[11px] text-[#7d3c3c] mt-0.5">
              Automated Campus Security, Road Hazard Triage & Gate Whitelist Platform
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-[#800000] font-medium">19.8162° N, 75.2914° E</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
              WebGL Digital Twin Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
