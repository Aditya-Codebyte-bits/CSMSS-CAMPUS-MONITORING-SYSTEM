import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Clock,
  Crosshair,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Car,
  ChevronDown,
  ChevronUp,
  Zap,
  Save,
} from 'lucide-react';
import {
  spatialDwellEngine,
  DwellCalibrationSettings,
  DEFAULT_CALIBRATION_SETTINGS,
  CAMPUS_SPATIAL_BOUNDARIES,
} from '../services/spatialDwellEngine';
import { CampusZone } from '../types';

interface DwellCalibrationSettingsPanelProps {
  zones: CampusZone[];
  onCalibrationSaved?: () => void;
}

export const DwellCalibrationSettingsPanel: React.FC<DwellCalibrationSettingsPanelProps> = ({
  zones,
  onCalibrationSaved,
}) => {
  const [settings, setSettings] = useState<DwellCalibrationSettings>(
    spatialDwellEngine.getCalibration()
  );
  const [selectedZoneId, setSelectedZoneId] = useState<number>(1); // Gate 3 default
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Live Test Simulation Sandbox inside calibration
  const [simOverlap, setSimOverlap] = useState<number>(55);
  const [simDwellSec, setSimDwellSec] = useState<number>(20);

  useEffect(() => {
    const unsubscribe = spatialDwellEngine.registerCalibrationListener((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  const activeZoneOverride = settings.zoneOverrides[selectedZoneId] || {
    dwellThresholdSeconds: settings.globalDwellSeconds,
    overlapThresholdPct: settings.globalOverlapThresholdPct,
  };

  const handleGlobalDwellChange = (val: number) => {
    setSettings((prev) => ({ ...prev, globalDwellSeconds: val }));
    setHasUnsavedChanges(true);
  };

  const handleGlobalOverlapChange = (val: number) => {
    setSettings((prev) => ({ ...prev, globalOverlapThresholdPct: val }));
    setHasUnsavedChanges(true);
  };

  const handleClearOverlapChange = (val: number) => {
    setSettings((prev) => ({ ...prev, clearOverlapThresholdPct: val }));
    setHasUnsavedChanges(true);
  };

  const handleZoneDwellChange = (zoneId: number, val: number) => {
    setSettings((prev) => ({
      ...prev,
      zoneOverrides: {
        ...prev.zoneOverrides,
        [zoneId]: {
          ...(prev.zoneOverrides[zoneId] || {
            dwellThresholdSeconds: prev.globalDwellSeconds,
            overlapThresholdPct: prev.globalOverlapThresholdPct,
          }),
          dwellThresholdSeconds: val,
        },
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleZoneOverlapChange = (zoneId: number, val: number) => {
    setSettings((prev) => ({
      ...prev,
      zoneOverrides: {
        ...prev.zoneOverrides,
        [zoneId]: {
          ...(prev.zoneOverrides[zoneId] || {
            dwellThresholdSeconds: prev.globalDwellSeconds,
            overlapThresholdPct: prev.globalOverlapThresholdPct,
          }),
          overlapThresholdPct: val,
        },
      },
    }));
    setHasUnsavedChanges(true);
  };

  const applyPreset = (preset: 'strict' | 'standard' | 'grace' | 'transit') => {
    let dwell = 30;
    let overlap = 40;
    let clear = 20;

    switch (preset) {
      case 'strict':
        dwell = 15;
        overlap = 30;
        clear = 15;
        break;
      case 'standard':
        dwell = 30;
        overlap = 40;
        clear = 20;
        break;
      case 'grace':
        dwell = 60;
        overlap = 55;
        clear = 25;
        break;
      case 'transit':
        dwell = 90;
        overlap = 70;
        clear = 30;
        break;
    }

    setSettings((prev) => ({
      ...prev,
      globalDwellSeconds: dwell,
      globalOverlapThresholdPct: overlap,
      clearOverlapThresholdPct: clear,
      zoneOverrides: {
        ...prev.zoneOverrides,
        [selectedZoneId]: {
          dwellThresholdSeconds: dwell,
          overlapThresholdPct: overlap,
        },
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    spatialDwellEngine.setCalibration(settings);
    setHasUnsavedChanges(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
    if (onCalibrationSaved) onCalibrationSaved();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all dwell sensitivities and spatial boundary thresholds to factory defaults (30s / 40%)?')) {
      const reset = spatialDwellEngine.resetCalibrationToDefault();
      setSettings(reset);
      setHasUnsavedChanges(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2500);
      if (onCalibrationSaved) onCalibrationSaved();
    }
  };

  // Compute live test simulation outcome based on current active zone settings
  const currentZoneDwellThreshold = activeZoneOverride.dwellThresholdSeconds;
  const currentZoneOverlapThreshold = activeZoneOverride.overlapThresholdPct;
  const currentClearThreshold = settings.clearOverlapThresholdPct;

  let simOutcome: 'cleared' | 'turning' | 'parked' = 'turning';
  if (simOverlap < currentClearThreshold) {
    simOutcome = 'cleared';
  } else if (simOverlap >= currentZoneOverlapThreshold) {
    if (simDwellSec >= currentZoneDwellThreshold) {
      simOutcome = 'parked';
    } else {
      simOutcome = 'turning';
    }
  } else {
    simOutcome = 'cleared';
  }

  return (
    <div className="bg-white border-2 border-[#d9c4b3] rounded-3xl p-5 sm:p-6 shadow-md space-y-6 relative overflow-hidden">
      {/* Decorative Brand Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#800000] via-[#a31515] to-amber-500" />

      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0e6de] pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#800000] to-[#590000] flex items-center justify-center text-amber-300 shadow-sm shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#800000] font-serif tracking-tight">
                ANPR & Edge Spatial Dwell Calibration
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-[#800000] px-2 py-0.5 rounded-full border border-amber-300">
                Security Admin
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Calibrate stationary dwell time sensitivity (seconds) and restricted space boundary intersection (% overlap) before confirming an unlawful parking violation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasUnsavedChanges && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
              ● Unsaved Changes
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-[#d6c4b6] hover:bg-[#fbf4f0] text-slate-600 transition cursor-pointer"
            title={isExpanded ? 'Collapse Panel' : 'Expand Panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Quick Sensitivity Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Operational Sensitivity Presets</span>
              </span>
              <span className="text-[10px] text-slate-500 font-sans">Click to instant-configure standard operating rules</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                onClick={() => applyPreset('strict')}
                className="p-2.5 rounded-xl text-left border border-rose-200 hover:border-rose-400 bg-rose-50/50 hover:bg-rose-50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 group-hover:text-rose-700">Strict Fire Exit</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-200 text-rose-800 rounded">15s / 30%</span>
                </div>
                <p className="text-[10.5px] text-rose-800/80 mt-1 leading-tight">
                  Zero tolerance for Gate 3 emergency buffer & hospital lane.
                </p>
              </button>

              <button
                onClick={() => applyPreset('standard')}
                className="p-2.5 rounded-xl text-left border border-amber-300 hover:border-amber-500 bg-amber-50/70 hover:bg-amber-100/60 transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#800000]">Standard Campus</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded">30s / 40%</span>
                </div>
                <p className="text-[10.5px] text-[#5c1c1c] mt-1 leading-tight">
                  Allows normal 3-point turning maneuvers & passenger drop-offs.
                </p>
              </button>

              <button
                onClick={() => applyPreset('grace')}
                className="p-2.5 rounded-xl text-left border border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 group-hover:text-blue-700">Courier / Delivery</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded">60s / 55%</span>
                </div>
                <p className="text-[10.5px] text-blue-800/80 mt-1 leading-tight">
                  Permits brief parcel unloading before flagging security.
                </p>
              </button>

              <button
                onClick={() => applyPreset('transit')}
                className="p-2.5 rounded-xl text-left border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Transit Peak Hour</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded">90s / 70%</span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-1 leading-tight">
                  Suppresses false alarms during heavy morning queue congestion.
                </p>
              </button>
            </div>
          </div>

          {/* Sector Scope Selection */}
          <div className="bg-[#fcfaf7] border border-[#e8dcd2] p-4 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-bold text-[#800000] uppercase tracking-wide font-serif block">
                  Target Campus Sector to Calibrate:
                </span>
                <span className="text-[11px] text-slate-500">
                  Select a specific surveillance camera sector to fine-tune individual zone limits
                </span>
              </div>

              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(Number(e.target.value))}
                className="bg-white border border-[#d6c4b6] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#800000]"
              >
                {Object.values(CAMPUS_SPATIAL_BOUNDARIES).map((zb) => (
                  <option key={zb.zoneId} value={zb.zoneId}>
                    {zb.zoneCode} — {zb.name} {zb.isRestrictedNoParking ? '(Strict Red Zone)' : '(General Access)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Slider 1: Dwell Time Sensitivity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-[#f0e6de]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#800000]" />
                    <span>Stationary Dwell Threshold</span>
                  </label>
                  <span className="text-sm font-mono font-bold text-[#800000] bg-white px-2.5 py-0.5 rounded-lg border border-[#e8d2c4] shadow-2xs">
                    {activeZoneOverride.dwellThresholdSeconds} seconds
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="120"
                  step="1"
                  value={activeZoneOverride.dwellThresholdSeconds}
                  onChange={(e) => handleZoneDwellChange(selectedZoneId, Number(e.target.value))}
                  className="w-full accent-[#800000] h-2 bg-[#e8ded6] rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10s (High Alert)</span>
                  <span className="font-semibold text-slate-700">30s (Default)</span>
                  <span>60s (Medium)</span>
                  <span>120s (Relaxed)</span>
                </div>

                <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-[#ede3da] leading-relaxed">
                  Vehicles remaining within the restricted zone longer than{' '}
                  <strong className="text-[#800000]">{activeZoneOverride.dwellThresholdSeconds}s</strong>{' '}
                  will transition from <em>Turning</em> to <strong>Confirmed Parking Violation</strong>.
                </p>
              </div>

              {/* Slider 2: Boundary Intersection Overlap Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-[#800000]" />
                    <span>Boundary Intersection / Overlap %</span>
                  </label>
                  <span className="text-sm font-mono font-bold text-[#800000] bg-white px-2.5 py-0.5 rounded-lg border border-[#e8d2c4] shadow-2xs">
                    {activeZoneOverride.overlapThresholdPct}% overlap
                  </span>
                </div>

                <input
                  type="range"
                  min="15"
                  max="85"
                  step="1"
                  value={activeZoneOverride.overlapThresholdPct}
                  onChange={(e) => handleZoneOverlapChange(selectedZoneId, Number(e.target.value))}
                  className="w-full accent-[#800000] h-2 bg-[#e8ded6] rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>15% (Strict Edge)</span>
                  <span className="font-semibold text-slate-700">40% (Default)</span>
                  <span>60% (Deep Intrusion)</span>
                  <span>85% (Full Incursion)</span>
                </div>

                <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-[#ede3da] leading-relaxed">
                  Vehicle bounding box must intersect at least{' '}
                  <strong className="text-[#800000]">{activeZoneOverride.overlapThresholdPct}%</strong> of the restricted boundary polygon to initiate the dwell countdown timer.
                </p>
              </div>
            </div>

            {/* Global Maneuver Exit Threshold */}
            <div className="mt-4 pt-3 border-t border-[#f0e6de] grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Turn Completion / Maneuver Exit Threshold:
                </span>
                <span className="text-[11px] text-slate-500">
                  When a turning vehicle drops below this overlap %, the maneuver is validated as <strong>Cleared</strong> (zero false alerts).
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={settings.clearOverlapThresholdPct}
                  onChange={(e) => handleClearOverlapChange(Number(e.target.value))}
                  className="flex-1 accent-emerald-700 h-2 bg-[#e8ded6] rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {settings.clearOverlapThresholdPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Live Calibration Sandbox / Visual Verification */}
          <div className="bg-gradient-to-r from-[#fbf8f5] to-[#f7f2ed] border border-[#e2d5cb] rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-[#800000] font-serif uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#800000]" />
                <span>Live State Machine Verification Sandbox</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Test how current sliders classify vehicles in real-time
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Sandbox controls */}
              <div className="lg:col-span-7 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold">Simulated Overlap In Restricted Bay:</span>
                    <span className="font-mono font-bold text-slate-900">{simOverlap}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={simOverlap}
                    onChange={(e) => setSimOverlap(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1.5 bg-[#e2d5cb] rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold">Simulated Stationary Dwell Duration:</span>
                    <span className="font-mono font-bold text-slate-900">{simDwellSec} seconds</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={simDwellSec}
                    onChange={(e) => setSimDwellSec(Number(e.target.value))}
                    className="w-full accent-amber-600 h-1.5 bg-[#e2d5cb] rounded cursor-pointer"
                  />
                </div>

                {/* Quick test buttons */}
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="text-slate-500">Quick Scenarios:</span>
                  <button
                    onClick={() => {
                      setSimOverlap(15);
                      setSimDwellSec(6);
                    }}
                    className="px-2 py-0.5 rounded bg-white border border-[#d6c4b6] hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    Brief U-Turn (15% / 6s)
                  </button>
                  <button
                    onClick={() => {
                      setSimOverlap(65);
                      setSimDwellSec(14);
                    }}
                    className="px-2 py-0.5 rounded bg-white border border-[#d6c4b6] hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    3-Point Maneuver (65% / 14s)
                  </button>
                  <button
                    onClick={() => {
                      setSimOverlap(80);
                      setSimDwellSec(35);
                    }}
                    className="px-2 py-0.5 rounded bg-white border border-[#d6c4b6] hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    True Park (80% / 35s)
                  </button>
                </div>
              </div>

              {/* Sandbox classification output card */}
              <div className="lg:col-span-5 bg-white border border-[#ded0c4] rounded-2xl p-4 shadow-sm text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Evaluated State Result
                </span>

                {simOutcome === 'cleared' && (
                  <div className="py-2 space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✓ Maneuver Cleared / Turn Completed</span>
                    </span>
                    <p className="text-[10.5px] text-slate-600 mt-1">
                      Overlap ({simOverlap}%) is below the {currentZoneOverlapThreshold}% threshold. Zero false alarms generated.
                    </p>
                  </div>
                )}

                {simOutcome === 'turning' && (
                  <div className="py-2 space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span>⏳ Active Turn Maneuver ({simDwellSec}s / {currentZoneDwellThreshold}s)</span>
                    </span>
                    <p className="text-[10.5px] text-slate-600 mt-1">
                      Overlap ({simOverlap}%) confirmed. Countdown active:{' '}
                      <strong className="text-amber-800">{Math.max(0, currentZoneDwellThreshold - simDwellSec)}s</strong> remaining before violation.
                    </p>
                  </div>
                )}

                {simOutcome === 'parked' && (
                  <div className="py-2 space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 animate-bounce">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>🚨 Validated Unlawful Parking Violation</span>
                    </span>
                    <p className="text-[10.5px] text-rose-800 mt-1">
                      Vehicle stationary for {simDwellSec}s (&ge; {currentZoneDwellThreshold}s threshold). Watchman approval modal triggered!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-[#f5ece4] transition cursor-pointer flex items-center gap-1.5 border border-[#d6c4b6]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restore Factory Defaults (30s / 40%)</span>
            </button>

            <div className="flex items-center gap-3">
              {showSaveToast && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Calibration Saved & Applied Live to CCTV Feeds!</span>
                </span>
              )}

              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#800000] to-[#a31515] hover:from-[#660000] hover:to-[#800000] text-amber-100 shadow-md transition cursor-pointer flex items-center gap-2 border border-[#520000]"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>Apply & Save Calibration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
