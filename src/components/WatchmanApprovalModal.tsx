import React from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Send,
  X,
  MapPin,
} from 'lucide-react';
import { VehicleDwellRecord } from '../types';
import { store } from '../services/store';

interface WatchmanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  plateNumber: string;
  zoneName: string;
  zoneId: number;
  dwellRecord?: VehicleDwellRecord | null;
  onApprovePass: (plate: string) => void;
  onDenyAccess: (plate: string) => void;
  onDispatchGuard: (plate: string) => void;
}

export const WatchmanApprovalModal: React.FC<WatchmanApprovalModalProps> = ({
  isOpen,
  onClose,
  plateNumber,
  zoneName,
  dwellRecord,
  onApprovePass,
  onDenyAccess,
  onDispatchGuard,
}) => {
  if (!isOpen) return null;

  const isDwellViolation = dwellRecord?.state === 'parked';
  const registeredVehicle = store.lookupVehicle(plateNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-2 border-[#800000] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0e6de] pb-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-xl text-white ${
                isDwellViolation ? 'bg-rose-700' : 'bg-[#800000]'
              }`}
            >
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#800000] uppercase font-serif tracking-wider">
                {isDwellViolation
                  ? '30s Dwell Validated: Unlawful Parking'
                  : 'Watchman Gatehouse Action Required'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Edge Camera Alert · {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle & Plate Snapshot Card */}
        <div className="bg-gradient-to-br from-[#fdfbf9] to-[#f4ece5] border border-[#e2d5cb] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#800000] uppercase tracking-wider font-serif">
              Detected Vehicle Target
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-[#800000] text-amber-200">
              {plateNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-[#e8dcd2]">
              <span className="text-[10px] text-slate-500 block">Sector Location</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#800000]" />
                {zoneName}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-[#e8dcd2]">
              <span className="text-[10px] text-slate-500 block">Registry Status</span>
              {registeredVehicle ? (
                <span className="font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {registeredVehicle.owner_name} ({registeredVehicle.owner_role})
                  </span>
                </span>
              ) : (
                <span className="font-semibold text-amber-700 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Unregistered Visitor</span>
                </span>
              )}
            </div>
          </div>

          {/* Dwell Metrics if available */}
          {dwellRecord && (
            <div className="p-2.5 rounded-xl bg-white border border-[#e8dcd2] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Boundary Overlap</span>
                <span className="font-bold text-[#800000]">{dwellRecord.overlapPercentage}% in Restricted Space</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Dwell Duration</span>
                <span className="font-bold text-rose-700">{dwellRecord.dwellSeconds}s (Exceeds Threshold)</span>
              </div>
            </div>
          )}
        </div>

        {/* Watchman Tactical Options */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block font-serif">
            Guard Intervention Decision
          </span>

          <div className="space-y-2">
            <button
              onClick={() => onApprovePass(plateNumber)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#800000] to-[#a01616] hover:from-[#660000] hover:to-[#851010] text-amber-50 shadow-sm transition cursor-pointer flex items-center justify-between border border-[#6b0202]"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-300" />
                <span>
                  {registeredVehicle
                    ? 'Grant Temporary Exemption & Open Barrier'
                    : 'Issue Visitor Pass & Auto-Raise Barrier'}
                </span>
              </div>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded">
                Approve
              </span>
            </button>

            <button
              onClick={() => onDenyAccess(plateNumber)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 border border-rose-300 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Deny Gate Access & Lock Boom Barrier</span>
              </div>
              <span className="text-[10px] text-rose-700 font-semibold">Lockdown</span>
            </button>

            <button
              onClick={() => onDispatchGuard(plateNumber)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#fbf5f2] text-slate-700 hover:bg-[#f2e6de] border border-[#e2d5cb] transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#800000]" />
                <span>Dispatch Campus Security Patrol to Vehicle</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Civil Cell</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-slate-500 border-t border-[#f0e6de] pt-2 flex items-center justify-between font-mono">
          <span>Continuous Edge CCTV ANPR Watchdog</span>
          <span>10–15m Deduplication Active</span>
        </div>
      </div>
    </div>
  );
};
