import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Camera,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  VehicleDwellRecord,
  DeduplicationRecord,
} from '../types';
import { CAMPUS_CCTV_FEEDS, cctvStreamService } from '../services/cctvStreamService';
import { spatialDwellEngine, CAMPUS_SPATIAL_BOUNDARIES } from '../services/spatialDwellEngine';
import { deduplicationManager } from '../services/deduplicationManager';
import { store } from '../services/store';
import { WatchmanApprovalModal } from './WatchmanApprovalModal';

interface CctvEdgeMatrixViewProps {
  onRefresh: () => void;
  onBarrierChange?: (isOpen: boolean) => void;
  onFocusZone?: (zoneId: number) => void;
}

export const CctvEdgeMatrixView: React.FC<CctvEdgeMatrixViewProps> = ({
  onRefresh,
  onBarrierChange,
  onFocusZone,
}) => {
  const [selectedFeedId, setSelectedFeedId] = useState<string>('cam_gate3_buffer');
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const [dedupRecords, setDedupRecords] = useState<DeduplicationRecord[]>([]);
  const [dedupWindowMinutes, setDedupWindowMinutes] = useState<number>(12);

  // Watchman Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalIncidentId, setModalIncidentId] = useState<number>(1);
  const [modalPlate, setModalPlate] = useState<string>('');
  const [modalZoneName, setModalZoneName] = useState<string>('');
  const [modalZoneId, setModalZoneId] = useState<number>(1);
  const [modalDwellRecord, setModalDwellRecord] = useState<VehicleDwellRecord | null>(null);

  // Simulation State
  const [simScenario, setSimScenario] = useState<'idle' | 'turning' | 'parking' | 'authorized'>('idle');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeFeed =
    CAMPUS_CCTV_FEEDS.find((f) => f.id === selectedFeedId) || CAMPUS_CCTV_FEEDS[0];

  // Clean up hardware webcam stream on component unmount
  useEffect(() => {
    return () => {
      cctvStreamService.stopWebcam();
    };
  }, []);

  // Initialize and sync deduplication window
  useEffect(() => {
    deduplicationManager.setWindowMinutes(dedupWindowMinutes);
    setDedupRecords(deduplicationManager.getCachedSignatures());
  }, [dedupWindowMinutes]);

  // Listen for validated 30s dwell parking violations
  useEffect(() => {
    const unsubscribe = spatialDwellEngine.registerValidationListener((record) => {
      const evalRes = deduplicationManager.evaluateDetection(
        record.plateNumber,
        record.zoneId,
        'unlawful_parking'
      );

      if (evalRes.allowAlert) {
        const createdIncident = store.addIncident(
          'unlawful_parking',
          record.zoneId,
          1,
          {
            task_type: 'unlawful_parking',
            detected: true,
            confidence: 0.95,
            severity: 'Critical',
            summary: `Automated CCTV Edge: Vehicle ${record.plateNumber} validated parked (${record.overlapPercentage}% overlap, dwell ${record.dwellSeconds}s >= threshold).`,
            annotated_image_url: record.snapshotUrl || '',
            detected_plate: record.plateNumber,
            vehicle_type: record.vehicleType,
            bounding_boxes: [
              {
                x1: 180,
                y1: 190,
                x2: 460,
                y2: 370,
                label: `unlawful_parking:${record.plateNumber}`,
                confidence: 0.95,
              },
            ],
            bbox_area_ratio: record.overlapPercentage / 100,
            estimated_diameter_cm: 0,
            engine_mode: 'yolov8_opencv_edge',
          },
          `Dwell verification confirmed stationary parking after ${record.dwellSeconds}s. Overlap: ${record.overlapPercentage}%.`
        );
        onRefresh();

        setModalIncidentId(createdIncident.incident_id);
        setModalPlate(record.plateNumber);
        setModalZoneName(record.zoneName);
        setModalZoneId(record.zoneId);
        setModalDwellRecord(record);
        setModalOpen(true);
      }

      setDedupRecords(deduplicationManager.getCachedSignatures());
    });

    return () => unsubscribe();
  }, [onRefresh]);

  // Webcam stream management
  const handleToggleWebcam = async () => {
    setWebcamError(null);
    if (isWebcamActive) {
      cctvStreamService.stopWebcam();
      setIsWebcamActive(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      try {
        const stream = await cctvStreamService.startWebcam();
        setIsWebcamActive(true);
        setSelectedFeedId('cam_live_webcam');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch {
        setWebcamError('Unable to access webcam. Please check browser camera permissions.');
        setIsWebcamActive(false);
      }
    }
  };

  // Continuous CCTV Canvas Render & Simulation Engine (zero React state thrashing inside 60fps loop)
  useEffect(() => {
    let animId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = Date.now();

    const renderLoop = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      const w = canvas.width;
      const h = canvas.height;

      // Draw background / CCTV Frame
      if (selectedFeedId === 'cam_live_webcam' && isWebcamActive && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
      } else {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.7);
        ctx.lineTo(w, h * 0.7);
        ctx.stroke();

        ctx.strokeStyle = '#e2e8f0';
        ctx.setLineDash([16, 16]);
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.lineTo(w, h * 0.72);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Constant Spatial Boundary (e.g. Gate 3 Red Buffer)
      const currentBoundary = CAMPUS_SPATIAL_BOUNDARIES[activeFeed.zoneId]?.boundary || [0.2, 0.4, 0.6, 0.85];
      const zx1 = currentBoundary[0] * w;
      const zy1 = currentBoundary[1] * h;
      const zw = (currentBoundary[2] - currentBoundary[0]) * w;
      const zh = (currentBoundary[3] - currentBoundary[1]) * h;

      ctx.fillStyle = activeFeed.zoneId === 1 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(zx1, zy1, zw, zh);

      ctx.strokeStyle = activeFeed.zoneId === 1 ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(zx1, zy1, zw, zh);

      const activeDwellThreshold = spatialDwellEngine.getDwellThresholdForZone(activeFeed.zoneId);

      ctx.fillStyle = activeFeed.zoneId === 1 ? '#ef4444' : '#38bdf8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(
        activeFeed.zoneId === 1
          ? `🚨 RESTRICTED: GATE 3 FIRE-EXIT BUFFER (${activeDwellThreshold}s Dwell Max)`
          : 'CHECKPOINT CORRIDOR',
        zx1 + 8,
        zy1 + 18
      );

      // Process Simulation Scenarios
      let activeBox: [number, number, number, number] | null = null;
      let plateToTest = '';

      if (simScenario === 'turning') {
        const t = elapsed % 22;
        plateToTest = 'MH20CZ4001';
        let bx1 = 0;
        let by1 = h * 0.48;

        if (t < 14) {
          bx1 = zx1 + 20 + Math.sin(t * 0.4) * 30;
          by1 = zy1 + 30;
        } else {
          bx1 = zx1 + 20 + (t - 14) * 90;
          by1 = zy1 + 30 - (t - 14) * 20;
        }
        activeBox = [bx1 / w, by1 / h, (bx1 + 140) / w, (by1 + 75) / h];
      } else if (simScenario === 'parking') {
        plateToTest = 'MH20BY1122';
        const bx1 = zx1 + 35;
        const by1 = zy1 + 35;
        activeBox = [bx1 / w, by1 / h, (bx1 + 145) / w, (by1 + 78) / h];
      } else if (simScenario === 'authorized') {
        plateToTest = 'MH20EE4512';
        const t = elapsed % 12;
        const bx1 = (t / 12) * w;
        const by1 = h * 0.6;
        activeBox = [bx1 / w, by1 / h, (bx1 + 130) / w, (by1 + 70) / h];
      }

      if (activeBox && plateToTest) {
        const record = spatialDwellEngine.processFrameDetection(
          plateToTest,
          activeFeed.zoneId,
          activeBox,
          'four_wheeler'
        );

        const vx1 = activeBox[0] * w;
        const vy1 = activeBox[1] * h;
        const vbw = (activeBox[2] - activeBox[0]) * w;
        const vbh = (activeBox[3] - activeBox[1]) * h;

        let boxColor = '#38bdf8';
        let statusText = `${plateToTest} · Approaching`;

        if (record.state === 'turning') {
          boxColor = '#f59e0b';
          statusText = `${plateToTest} [${record.overlapPercentage}% in Zone] ⏳ ${record.countdownRemaining}s / ${activeDwellThreshold}s`;
        } else if (record.state === 'cleared') {
          boxColor = '#10b981';
          statusText = `${plateToTest} · ✓ Turn Completed (Cleared)`;
        } else if (record.state === 'parked') {
          boxColor = '#ef4444';
          statusText = `${plateToTest} [${record.overlapPercentage}% in Zone] 🚨 Validated Parked`;
        }

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        if (record.state === 'turning') ctx.setLineDash([8, 6]);
        ctx.strokeRect(vx1, vy1, vbw, vbh);
        ctx.setLineDash([]);

        ctx.fillStyle = boxColor;
        ctx.fillRect(vx1, vy1 - 24, Math.max(180, ctx.measureText(statusText).width + 16), 24);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(statusText, vx1 + 6, vy1 - 7);

        if (record.state === 'turning') {
          const progress = Math.min(1, record.dwellSeconds / Math.max(1, activeDwellThreshold));
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(vx1, vy1 + vbh + 4, vbw, 6);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(vx1, vy1 + vbh + 4, vbw * progress, 6);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [selectedFeedId, isWebcamActive, simScenario, activeFeed]);

  // Safely handle Watchman Modal Actions without throwing if plate is already registered
  const handleApproveVisitor = (plate: string) => {
    const existing = store.lookupVehicle(plate);
    if (!existing) {
      try {
        store.addVehicle({
          plate_number: plate,
          owner_name: `Visitor (${plate})`,
          owner_role: 'staff',
          department: 'Campus Guest',
          vehicle_type: 'four_wheeler',
          pass_sticker_id: `PASS-${Date.now().toString().slice(-4)}`,
          is_active: true,
        });
      } catch (e) {
        console.warn('Visitor pass registration skipped:', e);
      }
    }
    if (onBarrierChange) onBarrierChange(true);
    setModalOpen(false);
    onRefresh();
  };

  const handleDenyAccess = () => {
    if (onBarrierChange) onBarrierChange(false);
    setModalOpen(false);
  };

  const handleDispatchGuard = (plate: string) => {
    try {
      store.updateIncidentStatus(
        modalIncidentId,
        'In_Progress',
        `Watchman dispatched civil security patrol to inspect vehicle ${plate}.`
      );
    } catch (e) {
      console.warn('Incident status update warning:', e);
    }
    setModalOpen(false);
    onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2d5cb] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#800000] text-amber-300">
              <Video className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-[#800000] font-serif tracking-tight">
              Live College CCTV Edge Suite
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Automated ANPR & Visual CV with spatial boundary overlap verification and a 30s dwell timer to differentiate turning maneuvers from true parking violations.
          </p>
        </div>

        {/* Live Device Webcam Toggle Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleToggleWebcam}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs border ${
              isWebcamActive
                ? 'bg-rose-700 text-white border-rose-800'
                : 'bg-white text-[#800000] border-[#d6c4b6] hover:bg-[#800000] hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isWebcamActive ? 'Disconnect Webcam' : 'Connect Device Webcam'}</span>
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{webcamError}</span>
        </div>
      )}

      {/* Main Grid: CCTV Monitor & Tactical Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (8 cols): Surveillance Monitor */}
        <div className="lg:col-span-8 bg-slate-950 rounded-3xl border border-[#d6c4b6] shadow-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-bold text-white font-mono tracking-wide">{activeFeed.code}</span>
              <span className="text-slate-500 hidden sm:inline">·</span>
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-[240px]">
                {activeFeed.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-emerald-400">YOLOv8 Edge: 22ms</span>
              <span className="text-slate-500">·</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Video Canvas Viewport */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-contain"
            />
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />

            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-200 flex items-center gap-2 shadow-lg">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Dwell Engine: {spatialDwellEngine.getDwellThresholdForZone(activeFeed.zoneId)}s Stationary Threshold Active
              </span>
            </div>
          </div>

          {/* Camera Feed Selection Bar */}
          <div className="p-3 bg-slate-900/95 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto">
            {CAMPUS_CCTV_FEEDS.map((feed) => (
              <button
                key={feed.id}
                onClick={() => {
                  setSelectedFeedId(feed.id);
                  if (onFocusZone) onFocusZone(feed.zoneId);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFeedId === feed.id
                    ? 'bg-[#800000] text-amber-200 shadow-xs border border-amber-400/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{feed.code}</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline font-normal">
                  ({feed.zoneId === 1 ? 'Gate 3' : feed.zoneId === 2 ? 'Gate 2' : 'Campus'})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right (4 cols): Interactive Validation & Deduplication Deck */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#e2d5cb] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="border-b border-[#f0e6de] pb-3">
              <span className="text-[10px] font-bold text-[#800000] uppercase tracking-wider font-serif block">
                Spatial Dwell Validation Deck
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Turn vs. Park Verification
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Test the temporal filter distinguishing a vehicle turning around from one illegally parking.
              </p>
            </div>

            <div className="bg-[#fcfaf7] border border-[#e8dcd2] rounded-xl p-2.5 text-[11px] flex items-center justify-between">
              <span className="text-slate-600 font-medium">Calibrated Limits:</span>
              <span className="font-mono font-bold text-[#800000]">
                {spatialDwellEngine.getDwellThresholdForZone(activeFeed.zoneId)}s Dwell · {spatialDwellEngine.getOverlapThresholdForZone(activeFeed.zoneId)}% Overlap
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSimScenario('turning');
                  spatialDwellEngine.clearTrackers();
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition text-left flex items-center justify-between border cursor-pointer ${
                  simScenario === 'turning'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                    : 'bg-[#fdfbf9] border-[#e2d5cb] text-slate-700 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>1. Vehicle Taking a Turn</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Enters buffer, turns, and clears before dwell threshold (Zero violation)
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                  Test Turn
                </span>
              </button>

              <button
                onClick={() => {
                  setSimScenario('parking');
                  spatialDwellEngine.clearTrackers();
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition text-left flex items-center justify-between border cursor-pointer ${
                  simScenario === 'parking'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-2xs'
                    : 'bg-[#fdfbf9] border-[#e2d5cb] text-slate-700 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>2. Vehicle Truly Parking</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Dwells &gt; {spatialDwellEngine.getDwellThresholdForZone(activeFeed.zoneId)}s continuously (Triggers watchman alert)
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                  Test Park
                </span>
              </button>

              <button
                onClick={() => {
                  setSimScenario('authorized');
                  spatialDwellEngine.clearTrackers();
                  if (onBarrierChange) onBarrierChange(true);
                }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition text-left flex items-center justify-between border cursor-pointer ${
                  simScenario === 'authorized'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                    : 'bg-[#fdfbf9] border-[#e2d5cb] text-slate-700 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>3. Authorized Faculty Inbound</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Whitelisted plate auto-raises barrier arm
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">
                  Auto-Clear
                </span>
              </button>
            </div>
          </div>

          {/* 10–15 Minute Deduplication Audit Panel */}
          <div className="bg-white border border-[#e2d5cb] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0e6de] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#800000] uppercase tracking-wider font-serif block">
                  Alert Spam Suppression
                </span>
                <h4 className="text-xs font-bold text-slate-900 font-serif">
                  10–15m Deduplication Cache
                </h4>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#fdf2e9] text-[#800000] font-bold">
                {dedupWindowMinutes}m Window
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Rolling Suppression Window:</span>
                <span className="font-mono font-bold text-[#800000]">{dedupWindowMinutes} Minutes</span>
              </div>
              <input
                type="range"
                min="10"
                max="15"
                step="1"
                value={dedupWindowMinutes}
                onChange={(e) => setDedupWindowMinutes(parseInt(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>10m</span>
                <span>12.5m</span>
                <span>15m</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Cached Plate Signatures ({dedupRecords.length})
              </span>

              {dedupRecords.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {dedupRecords.slice(0, 3).map((r) => {
                    const remainingSeconds = Math.max(
                      0,
                      Math.round((r.suppressUntil - Date.now()) / 1000)
                    );
                    const mins = Math.floor(remainingSeconds / 60);
                    const secs = remainingSeconds % 60;
                    return (
                      <div
                        key={r.signature}
                        className="p-2.5 rounded-xl bg-[#fbf8f5] border border-[#e8dcd2] flex items-center justify-between font-mono text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{r.plateNumber}</div>
                          <div className="text-[10px] text-slate-500">{r.defectType}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-700 font-semibold">
                            {mins}m {secs < 10 ? '0' : ''}{secs}s
                          </div>
                          <div className="text-[9px] text-slate-400">Cooldown</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 py-2">
                  No plate signatures currently suppressed. Next valid incident will log immediately.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <WatchmanApprovalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        plateNumber={modalPlate}
        zoneName={modalZoneName}
        zoneId={modalZoneId}
        dwellRecord={modalDwellRecord}
        onApprovePass={handleApproveVisitor}
        onDenyAccess={handleDenyAccess}
        onDispatchGuard={handleDispatchGuard}
      />
    </div>
  );
};
