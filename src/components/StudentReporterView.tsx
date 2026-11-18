import React, { useState, useEffect, useRef } from 'react';
import { CampusZone, IncidentType, InferenceResult, RegisteredVehicle } from '../types';
import { CSMSSInferenceEngine } from '../services/inferenceEngine';
import { store } from '../services/store';
import {
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  Car,
  ShieldAlert,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface StudentReporterViewProps {
  zones: CampusZone[];
  onIncidentLogged: () => void;
  onFocusZone?: (zoneId: number) => void;
}

export const StudentReporterView: React.FC<StudentReporterViewProps> = ({
  zones,
  onIncidentLogged,
  onFocusZone,
}) => {
  const [taskType, setTaskType] = useState<IncidentType>('unlawful_parking');
  const [selectedZoneId, setSelectedZoneId] = useState<number>(zones[0]?.zone_id || 1); // Gate 3 default
  const [inputSource, setInputSource] = useState<'sample' | 'upload'>('sample');
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>('unlawful_parking');
  const [plateHint, setPlateHint] = useState<string>('MH20BY1122');
  const [userNotes, setUserNotes] = useState<string>('Vehicle parked inside Gate 3 Red Buffer.');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [lastLoggedIncidentId, setLastLoggedIncidentId] = useState<number | null>(null);
  const [matchedVehicle, setMatchedVehicle] = useState<RegisteredVehicle | null>(null);

  const [syntheticSamples, setSyntheticSamples] = useState<
    Record<string, { name: string; label: string; dataUrl: string; hintPlate?: string }>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<CSMSSInferenceEngine>(new CSMSSInferenceEngine());

  useEffect(() => {
    const samples = CSMSSInferenceEngine.generateSyntheticSamples();
    setSyntheticSamples(samples);
  }, []);

  const handleTaskChange = (newTask: IncidentType) => {
    setTaskType(newTask);
    if (newTask === 'unlawful_parking') {
      setSelectedZoneId(1); // Gate 3 & Red Emergency Buffer
      setSelectedSampleKey('unlawful_parking');
      setPlateHint('MH20BY1122');
      setUserNotes('Vehicle parked directly inside Gate 3 Red Emergency Buffer.');
      if (onFocusZone) onFocusZone(1);
    } else if (newTask === 'road_damage') {
      setSelectedZoneId(6); // Ayurveda Hospital link
      setSelectedSampleKey('road_damage');
      setPlateHint('');
      setUserNotes('Monsoon road pothole cavity along Ayurveda hospital ambulance link.');
      if (onFocusZone) onFocusZone(6);
    } else {
      setSelectedZoneId(2); // Gate 2 (CSMSS Rd)
      setSelectedSampleKey('authorized_gate');
      setPlateHint('MH20EE4512');
      setUserNotes('Inbound vehicle check at Gate 2 CSMSS Road.');
      if (onFocusZone) onFocusZone(2);
    }
    setInferenceResult(null);
    setLastLoggedIncidentId(null);
    setMatchedVehicle(null);
  };

  const handleSampleChange = (sampleKey: string) => {
    setSelectedSampleKey(sampleKey);
    const sample = syntheticSamples[sampleKey];
    if (sample?.hintPlate) {
      setPlateHint(sample.hintPlate);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImageUrl(event.target?.result as string);
        setInputSource('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setInferenceResult(null);
    setMatchedVehicle(null);

    try {
      const activeImgUrl =
        inputSource === 'upload' && uploadedImageUrl
          ? uploadedImageUrl
          : syntheticSamples[selectedSampleKey]?.dataUrl;

      if (!activeImgUrl) {
        throw new Error('Please select or upload an image first.');
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = activeImgUrl;
      });

      const zone = zones.find((z) => z.zone_id === selectedZoneId) || zones[0];
      let result: InferenceResult;

      if (taskType === 'unlawful_parking') {
        result = await engineRef.current.detectUnlawfulParking(
          img,
          zone.roi_polygon,
          zone.criticality_weight,
          plateHint.trim() || undefined
        );
      } else if (taskType === 'road_damage') {
        result = await engineRef.current.detectRoadDamage(img, zone.criticality_weight);
      } else {
        result = await engineRef.current.extractLicensePlate(img, plateHint.trim() || undefined);
      }

      const vehicleRecord = result.detected_plate ? store.lookupVehicle(result.detected_plate) : null;
      setMatchedVehicle(vehicleRecord);

      if (taskType === 'unauthorized_vehicle' && result.detected_plate) {
        if (!vehicleRecord) {
          result.severity = zone.criticality_weight >= 1.5 ? 'Critical' : 'High';
          result.summary = `Unregistered visitor vehicle (${result.detected_plate}) detected at ${zone.zone_name}.`;
        } else {
          result.severity = 'Low';
          result.summary = `Authorized ${vehicleRecord.owner_role} vehicle (${result.detected_plate}) · ${vehicleRecord.owner_name} (${vehicleRecord.department}).`;
        }
      }

      const newIncident = store.addIncident(
        taskType,
        selectedZoneId,
        1,
        result,
        userNotes.trim() || undefined
      );

      setInferenceResult(result);
      setLastLoggedIncidentId(newIncident.incident_id);
      onIncidentLogged();
      if (onFocusZone) onFocusZone(selectedZoneId);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to process image. Please select or upload a valid image.');
      console.error('Analysis error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedZone = zones.find((z) => z.zone_id === selectedZoneId) || zones[0];
  const activePreviewUrl =
    inputSource === 'upload' && uploadedImageUrl
      ? uploadedImageUrl
      : syntheticSamples[selectedSampleKey]?.dataUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#e2d5cb] shadow-sm">
        <h2 className="text-xl font-bold text-[#800000] font-serif tracking-tight">
          Visual Computer Vision Inspection Portal
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Report unlawful parking obstructions or road surface degradation. Automated spatial ROI intersection and cavity depth estimation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form */}
        <div className="lg:col-span-6 bg-white border border-[#e2d5cb] rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="text-xs font-bold text-[#800000] font-serif uppercase tracking-wider border-b border-[#f0e6de] pb-3">
            Submit Campus Incident
          </h3>

          {/* Category Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Inspection Domain
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTaskChange('unlawful_parking')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                  taskType === 'unlawful_parking'
                    ? 'bg-[#fbf4f0] border-[#800000] text-[#800000] shadow-sm font-bold'
                    : 'bg-[#fdfbf9] border-[#e2d5cb] text-slate-600 hover:border-slate-400'
                }`}
              >
                <Car className="w-5 h-5 text-[#800000]" />
                <div>
                  <div className="text-xs font-bold font-serif">Unlawful Parking</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Fire exit buffer check</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTaskChange('road_damage')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                  taskType === 'road_damage'
                    ? 'bg-[#fbf4f0] border-[#800000] text-[#800000] shadow-sm font-bold'
                    : 'bg-[#fdfbf9] border-[#e2d5cb] text-slate-600 hover:border-slate-400'
                }`}
              >
                <Wrench className="w-5 h-5 text-amber-700" />
                <div>
                  <div className="text-xs font-bold font-serif">Road Damage</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Pothole cavity span</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTaskChange('unauthorized_vehicle')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                  taskType === 'unauthorized_vehicle'
                    ? 'bg-[#fbf4f0] border-[#800000] text-[#800000] shadow-sm font-bold'
                    : 'bg-[#fdfbf9] border-[#e2d5cb] text-slate-600 hover:border-slate-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5 text-rose-700" />
                <div>
                  <div className="text-xs font-bold font-serif">Gate ANPR Audit</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Outsider scan</div>
                </div>
              </button>
            </div>
          </div>

          {/* Campus Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Campus Location
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => {
                const zId = Number(e.target.value);
                setSelectedZoneId(zId);
                if (onFocusZone) onFocusZone(zId);
              }}
              className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
            >
              {zones.map((zone) => (
                <option key={zone.zone_id} value={zone.zone_id}>
                  {zone.zone_name} (Criticality: {zone.criticality_weight}x)
                </option>
              ))}
            </select>
          </div>

          {/* Input Source */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Image Input Source
            </label>
            <div className="flex gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => setInputSource('sample')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  inputSource === 'sample'
                    ? 'bg-[#800000] text-amber-50 border-[#660000]'
                    : 'bg-[#fdfbf9] text-slate-700 border-[#d6c4b6] hover:bg-[#f7f2ee]'
                }`}
              >
                Pre-Loaded Scenario
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputSource('upload');
                  fileInputRef.current?.click();
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  inputSource === 'upload'
                    ? 'bg-[#800000] text-amber-50 border-[#660000]'
                    : 'bg-[#fdfbf9] text-slate-700 border-[#d6c4b6] hover:bg-[#f7f2ee]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Mobile Photo</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>

            {inputSource === 'sample' && Object.keys(syntheticSamples).length > 0 && (
              <select
                value={selectedSampleKey}
                onChange={(e) => handleSampleChange(e.target.value)}
                className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
              >
                {Object.entries(syntheticSamples).map(([key, sample]) => (
                  <option key={key} value={key}>
                    {sample.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Plate hint */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Plate Hint (if visible in blur)
            </label>
            <input
              type="text"
              value={plateHint}
              onChange={(e) => setPlateHint(e.target.value.toUpperCase())}
              placeholder="e.g. MH20EE4512"
              className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-2xl px-3.5 py-2 text-xs text-[#800000] font-mono font-bold uppercase focus:outline-none focus:border-[#800000]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Landmark Details
            </label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g. Blocking Gate 3 emergency buffer near Workshop..."
              className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isProcessing}
            onClick={runAnalysis}
            className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-gradient-to-r from-[#800000] to-[#a31515] hover:from-[#660000] hover:to-[#851010] text-amber-50 shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <span>Running Computer Vision Pipeline...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Run AI Detection & Log Incident</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-6 bg-white border border-[#e2d5cb] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0e6de] pb-3">
            <h3 className="text-xs font-bold text-[#800000] font-serif uppercase tracking-wider">
              Automated AI Inspection Output
            </h3>
            {lastLoggedIncidentId && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                Incident #{lastLoggedIncidentId} Logged
              </span>
            )}
          </div>

          {/* Visual Canvas Display */}
          <div className="relative rounded-2xl overflow-hidden border border-[#d6c4b6] bg-slate-900 min-h-[280px] flex items-center justify-center">
            {inferenceResult ? (
              <img
                src={inferenceResult.annotated_image_url}
                alt="AI Annotated Output"
                className="w-full h-auto object-contain rounded-2xl"
              />
            ) : activePreviewUrl ? (
              <img
                src={activePreviewUrl}
                alt="Selected frame"
                className="w-full h-auto object-contain opacity-90"
              />
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Select or upload a campus frame to inspect</p>
              </div>
            )}
          </div>

          {/* Detailed Metric Badges */}
          {inferenceResult ? (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#fcfaf7] p-2.5 rounded-2xl border border-[#e8dcd2]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Severity</span>
                  <span
                    className={`text-xs font-bold mt-0.5 block ${
                      inferenceResult.severity === 'Critical'
                        ? 'text-rose-700'
                        : inferenceResult.severity === 'High'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {inferenceResult.severity}
                  </span>
                </div>

                <div className="bg-[#fcfaf7] p-2.5 rounded-2xl border border-[#e8dcd2]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Confidence</span>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                    {Math.round(inferenceResult.confidence * 100)}%
                  </span>
                </div>

                <div className="bg-[#fcfaf7] p-2.5 rounded-2xl border border-[#e8dcd2]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Plate</span>
                  <span className="text-xs font-mono font-bold text-[#800000] mt-0.5 block">
                    {inferenceResult.detected_plate || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-[#fcfaf7] p-3 rounded-2xl border border-[#e8dcd2] text-xs text-slate-800">
                <p className="font-bold text-[#800000] mb-0.5 font-serif">Summary:</p>
                <p>{inferenceResult.summary}</p>
              </div>

              {matchedVehicle ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 font-serif">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Registered Campus Member:</span>
                  </div>
                  <p>
                    <strong className="text-emerald-950">{matchedVehicle.owner_name}</strong> (
                    {matchedVehicle.owner_role.toUpperCase()} · {matchedVehicle.department})
                  </p>
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Pass: {matchedVehicle.pass_sticker_id} · Phone: {matchedVehicle.contact_phone || 'N/A'}
                  </p>
                </div>
              ) : inferenceResult.detected_plate ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-rose-800 font-serif">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>Unregistered Visitor Vehicle:</span>
                  </div>
                  <p>
                    Plate <span className="font-mono font-bold text-rose-950">{inferenceResult.detected_plate}</span> is not
                    in the authorized whitelist.
                  </p>
                </div>
              ) : null}

              {inferenceResult.recommended_action && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                  <span className="font-bold block text-amber-900 mb-0.5 font-serif">Recommended Action:</span>
                  <p>{inferenceResult.recommended_action}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">
              Select or upload a campus frame and click "Run AI Detection" to inspect.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
