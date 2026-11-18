import React from 'react';
import { Shield, Sparkles, Navigation, RotateCcw } from 'lucide-react';
import { OperatingPersona, CampusAnalytics } from '../types';

interface HeaderProps {
  currentPersona: OperatingPersona;
  onSelectPersona: (persona: OperatingPersona) => void;
  analytics: CampusAnalytics;
  onStartStoryTour: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPersona,
  onSelectPersona,
  analytics,
  onStartStoryTour,
  onResetData,
}) => {
  return (
    <header className="bg-white border-b border-amber-950/15 sticky top-0 z-40 shadow-sm">
      {/* Top Brand Banner with Dual Crest Display (CSMSS Crest + DBATU Affiliation Seal) */}
      <div className="bg-gradient-to-b from-[#fdfbf9] via-[#f7f2ed] to-[#f2eae3] border-b border-[#e2d5cb] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Dual Crest Institutional Brand Identity */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Crest 1: Official CSMSS Chh. Shahu College of Engineering Crest */}
            <div className="relative group shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 border-2 border-amber-400/80 shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/assets/campus/csmss_crest_clean.png"
                  alt="CSMSS Crest"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <span className="hidden sm:block absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#800000] text-amber-200 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-amber-300/40 uppercase tracking-widest shadow-xs">
                CSMSS
              </span>
            </div>

            {/* Center Institutional Typography */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#800000] tracking-wider uppercase font-serif bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-300/50">
                  CSMSS Sanstha
                </span>
                <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                  DTE Code: 2533 · AICTE Permanent ID: 1-1454556441
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-[#800000] tracking-tight leading-none font-serif uppercase mt-1">
                CHH. SHAHU COLLEGE OF ENGINEERING
              </h1>
              <div className="text-[10px] sm:text-[11px] text-[#5c1c1c] font-medium leading-tight mt-1 flex flex-wrap items-center gap-x-2">
                <span>Approved by AICTE New Delhi & DTE Govt. of Maharashtra</span>
                <span className="hidden sm:inline text-amber-600">·</span>
                <span className="font-semibold text-[#800000]">Affiliated to DBATU, Lonere</span>
                <span className="hidden md:inline text-amber-600">·</span>
                <span className="hidden md:inline text-slate-600">NAAC Accredited</span>
              </div>
            </div>

            {/* Crest 2: Official DBATU Affiliation Seal Badge */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#d8c5b6]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-[#1e1b4b] p-1 border border-amber-400/60 shadow-sm flex flex-col items-center justify-center text-center text-white shrink-0">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-[8px] font-bold text-amber-200 tracking-wider">DBATU</span>
                <span className="text-[6px] text-slate-300 leading-none">LONERE</span>
              </div>
              <div className="text-[9px] text-[#590000] leading-tight font-serif max-w-[130px]">
                <div className="font-bold text-[#800000]">University Affiliation</div>
                <div className="text-slate-600 text-[8.5px]">Dr. Babasaheb Ambedkar Tech. Univ.</div>
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onStartStoryTour}
              className="px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#800000] to-[#990000] hover:from-[#660000] hover:to-[#800000] text-amber-50 shadow-md transition cursor-pointer flex items-center gap-1.5 border border-[#520000]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Interactive</span>
              <span>Tour</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 sm:p-2 rounded-xl bg-white border border-[#d6c4b6] text-[#800000] hover:bg-[#800000] hover:text-white transition cursor-pointer shadow-2xs"
              title="Reset System to Default State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar styled in the rich royal maroon gradient with rounded pill ends */}
      <div className="px-4 py-1.5 bg-[#fdfbf9]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Maroon navigation pill bar matching the screenshot navbar exactly */}
          <nav className="flex items-center gap-0.5 bg-gradient-to-b from-[#8f0404] via-[#750000] to-[#590000] p-1 rounded-xl shadow-md border border-[#520000] overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => onSelectPersona('digital_twin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                currentPersona === 'digital_twin'
                  ? 'bg-amber-400 text-[#590000] shadow-sm font-bold'
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              3D Digital Twin & Satellite Map
            </button>

            <button
              onClick={() => onSelectPersona('gate_anpr')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                currentPersona === 'gate_anpr'
                  ? 'bg-amber-400 text-[#590000] shadow-sm font-bold'
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Gate 2 & 3 ANPR Desk
            </button>

            <button
              onClick={() => onSelectPersona('cctv_edge')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                currentPersona === 'cctv_edge'
                  ? 'bg-amber-400 text-[#590000] shadow-sm font-bold'
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shadow-xs"></span>
              <span>Live CCTV Edge Suite</span>
            </button>

            <button
              onClick={() => onSelectPersona('incident_reporter')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                currentPersona === 'incident_reporter'
                  ? 'bg-amber-400 text-[#590000] shadow-sm font-bold'
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Visual CV Scanner
            </button>

            <button
              onClick={() => onSelectPersona('estate_dispatch')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer whitespace-nowrap ${
                currentPersona === 'estate_dispatch'
                  ? 'bg-amber-400 text-[#590000] shadow-sm font-bold'
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Estate & Civil Cell Queue
            </button>
          </nav>

          {/* Quick telemetry badge */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <span className="text-[#800000] font-semibold flex items-center gap-1.5 font-serif">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Kanchanwadi Hub Active
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#800000] border border-amber-300 font-mono text-[10px] font-bold">
              {analytics.active_open_incidents} Open Alerts
            </span>
            <span className="text-[#64748b] font-mono text-[11px]">19.8162° N, 75.2914° E</span>
          </div>
        </div>
      </div>
    </header>
  );
};
