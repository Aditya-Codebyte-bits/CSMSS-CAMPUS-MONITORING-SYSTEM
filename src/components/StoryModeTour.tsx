import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  MapPin,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import { OperatingPersona } from '../types';

interface StoryModeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToZone: (zoneId: number) => void;
  onSwitchPersona: (persona: OperatingPersona) => void;
  onTriggerBarrier: (open: boolean) => void;
}

interface StoryChapter {
  id: number;
  badge: string;
  title: string;
  zoneId: number;
  persona: OperatingPersona;
  narrative: string;
  actionText: string;
  takeaway: string;
}

export const StoryModeTour: React.FC<StoryModeTourProps> = ({
  isOpen,
  onClose,
  onFlyToZone,
  onSwitchPersona,
  onTriggerBarrier,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const chapters: StoryChapter[] = [
    {
      id: 1,
      badge: 'Chapter 1: Gate 3 & Red Emergency Buffer',
      title: 'Workshop Fire Exit & Emergency Bottleneck',
      zoneId: 1,
      persona: 'digital_twin',
      narrative:
        'Gate 3 serves as the primary entrance to the Engineering College and Workshop facilities. The red emergency buffer marks the critical fire-exit clearance zone where unlawful vehicle parking directly obstructs emergency movement.',
      actionText: 'Inspect Gate 3 Red Buffer',
      takeaway: 'Zero false alarms: spatial IoU bounding checks separate legal bays from fire-exit obstruction.',
    },
    {
      id: 2,
      badge: 'Chapter 2: Gate 2 (CSMSS Rd)',
      title: 'Polytechnic Inbound Checkpoint & Boom Barrier',
      zoneId: 2,
      persona: 'gate_anpr',
      narrative:
        'Located along the CSMSS Road highway, Gate 2 handles high-volume transit for Polytechnic commuters. Optical ANPR scans license plates in under 2 seconds, auto-raising the barrier for verified staff.',
      actionText: 'Simulate Gate 2 Clearance',
      takeaway: 'Cuts manual gate check delay by >90% while locking out unauthorized visitor vehicles.',
    },
    {
      id: 3,
      badge: 'Chapter 3: Central Spine & Dental College',
      title: 'Pedestrian Flow & Faculty Parking Corridor',
      zoneId: 5,
      persona: 'digital_twin',
      narrative:
        'The central avenue connects Dental College to the northeast designated Faculty & Student Parking bays, preventing informal vehicle spillover onto pedestrian walkways.',
      actionText: 'View Central Spine & Parking',
      takeaway: 'Separates pedestrian corridors from multi-institution vehicular transit.',
    },
    {
      id: 4,
      badge: 'Chapter 4: Ayurveda Rugnalaya Lifeline',
      title: 'Hospital Ambulance Link & Pothole Triage',
      zoneId: 6,
      persona: 'estate_dispatch',
      narrative:
        'Monsoon potholes on the northern Ayurveda Hospital link road delay ambulance response. Visual cavity detection calculates surface area ratios and estimated defect spans (~60cm) to prioritize cold-mix asphalt dispatch.',
      actionText: 'Dispatch Civil Maintenance Order',
      takeaway: 'Zone criticality formula (2.0x weight for hospital route) guarantees priority patching.',
    },
  ];

  if (!isOpen) return null;

  const activeChapter = chapters[currentStep];

  const handleExecuteChapterAction = () => {
    onFlyToZone(activeChapter.zoneId);
    onSwitchPersona(activeChapter.persona);
    if (activeChapter.id === 2) {
      onTriggerBarrier(true);
    }
  };

  const handleNext = () => {
    if (currentStep < chapters.length - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      onFlyToZone(chapters[nextIdx].zoneId);
      onSwitchPersona(chapters[nextIdx].persona);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      onFlyToZone(chapters[prevIdx].zoneId);
      onSwitchPersona(chapters[prevIdx].persona);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#d6c4b6] rounded-3xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0e6de] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#fdf2e9] text-[#800000] border border-[#f0cbb1]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-[#800000] uppercase tracking-wider font-serif block">
                CSMSS Campus Tour & Layout Walkthrough
              </span>
              <span className="text-[11px] text-slate-500">
                Step {currentStep + 1} of {chapters.length}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Body */}
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold text-[#800000] uppercase tracking-wider">
              {activeChapter.badge}
            </span>
            <h3 className="text-lg font-bold text-slate-900 font-serif tracking-tight">{activeChapter.title}</h3>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-[#fdfbf9] p-4 rounded-2xl border border-[#e8dcd2]">
            {activeChapter.narrative}
          </p>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handleExecuteChapterAction}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#800000] hover:bg-[#660000] text-amber-50 shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-amber-300" />
              <span>{activeChapter.actionText}</span>
            </button>

            <span className="text-[11px] text-emerald-800 flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Impact: {activeChapter.takeaway}</span>
            </span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-[#f0e6de] pt-4">
          <div className="flex items-center gap-1">
            {chapters.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-[#800000]' : 'w-2 bg-[#d6c4b6]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#800000] hover:bg-[#660000] text-amber-50 shadow transition cursor-pointer flex items-center gap-1"
            >
              <span>{currentStep === chapters.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
