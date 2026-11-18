import React, { useState } from 'react';
import { CampusAnalytics, CampusZone, IncidentReport, IncidentStatus } from '../types';
import { store } from '../services/store';
import {
  Download,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Car,
  Filter,
  Save,
  Search,
  ShieldCheck,
  Wrench,
  FileSpreadsheet,
  Sliders,
} from 'lucide-react';
import { DwellCalibrationSettingsPanel } from './DwellCalibrationSettingsPanel';

interface CommandCenterViewProps {
  zones: CampusZone[];
  incidents: IncidentReport[];
  analytics: CampusAnalytics;
  onRefresh: () => void;
  onFocusZone?: (zoneId: number) => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  zones,
  incidents,
  analytics,
  onRefresh,
  onFocusZone,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | undefined>(
    incidents[0]?.incident_id
  );
  const [resolutionStatus, setResolutionStatus] = useState<IncidentStatus>('Resolved');
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    'Security cleared obstruction / Work order dispatched to Civil Maintenance Cell.'
  );
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus = filterStatus === 'All' || inc.status === filterStatus;
    const matchesSearch =
      searchTerm.trim() === '' ||
      inc.zone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.incident_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.detected_plate && inc.detected_plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeIncident =
    incidents.find((i) => i.incident_id === selectedIncidentId) || filteredIncidents[0] || incidents[0];

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident) return;

    store.updateIncidentStatus(
      activeIncident.incident_id,
      resolutionStatus,
      resolutionNotes.trim() || 'Resolved and logged by Campus Operations.'
    );
    onRefresh();
  };

  const handleExportCSV = () => {
    if (incidents.length === 0) return;

    const headers = [
      'Incident ID',
      'Category',
      'Campus Zone',
      'Zone Code',
      'Latitude',
      'Longitude',
      'Severity',
      'Status',
      'Detected Plate',
      'Authorized Member',
      'Reporter',
      'Confidence',
      'Civil Defect',
      'Span (cm)',
      'Recommended Action',
      'Logged At',
      'Resolution Notes',
    ];

    const rows = incidents.map((i) => [
      i.incident_id,
      i.incident_type,
      `"${i.zone_name.replace(/"/g, '""')}"`,
      i.zone_code,
      i.latitude,
      i.longitude,
      i.severity,
      i.status,
      i.detected_plate || 'N/A',
      i.is_authorized_vehicle !== null ? (i.is_authorized_vehicle ? 'YES' : 'NO') : 'N/A',
      `"${i.reporter_name} (${i.reporter_role})"`,
      `${Math.round(i.confidence_score * 100)}%`,
      i.defect_category || 'N/A',
      i.estimated_diameter_cm || 'N/A',
      `"${(i.recommended_action || '').replace(/"/g, '""')}"`,
      i.created_at,
      `"${(i.resolution_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `csmss_campus_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2d5cb] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#800000] font-serif tracking-tight">
            Estate & Maintenance Dispatch Queue
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time incident dispatching, civil road triage work orders, and administrative audit logging.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#800000] hover:bg-[#660000] text-amber-50 shadow-sm transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-amber-300" />
          <span>Export Campus Audit Log (CSV)</span>
        </button>
      </div>

      {/* Metrics Row styled with warm institutional contrast */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e2d5cb] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Logged
          </span>
          <span className="text-2xl font-black text-[#800000] font-serif mt-1 block">
            {analytics.total_incidents}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Campus Master Database</span>
        </div>

        <div className="bg-white border border-[#e2d5cb] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Pending Action
          </span>
          <span className="text-2xl font-black text-amber-700 font-serif mt-1 block">
            {analytics.active_open_incidents}
          </span>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Open & Dispatched</span>
        </div>

        <div className="bg-white border border-[#e2d5cb] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Resolved & Verified
          </span>
          <span className="text-2xl font-black text-emerald-800 font-serif mt-1 block">
            {analytics.resolved_incidents}
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Cleared by Security/Civil</span>
        </div>

        <div className="bg-white border border-[#e2d5cb] rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Outsider Flags
          </span>
          <span className="text-2xl font-black text-rose-700 font-serif mt-1 block">
            {analytics.unauthorized_outsider_flags}
          </span>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Unregistered Vehicles</span>
        </div>
      </div>
 
      {/* Administrative Settings Panel for Watchman Dwell & Overlap Calibration */}
      <DwellCalibrationSettingsPanel zones={zones} onCalibrationSaved={onRefresh} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Incident Resolution Deck */}
        <div className="lg:col-span-5 bg-white border border-[#e2d5cb] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#f0e6de] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#800000] font-serif flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#800000]" />
              <span>Inspection & Dispatch Console</span>
            </h3>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#800000]"
              >
                <option value="All">All Statuses ({incidents.length})</option>
                <option value="Open">Open</option>
                <option value="In_Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Incident Selector Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Incident to Inspect:
            </label>
            <select
              value={activeIncident?.incident_id || ''}
              onChange={(e) => setSelectedIncidentId(Number(e.target.value))}
              className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#800000] font-mono"
            >
              {filteredIncidents.map((inc) => (
                <option key={inc.incident_id} value={inc.incident_id}>
                  #{inc.incident_id} [{inc.severity}] {inc.incident_type} @ {inc.zone_name} ({inc.status})
                </option>
              ))}
            </select>
          </div>

          {activeIncident ? (
            <div className="space-y-4 text-xs">
              {/* Incident Details Card */}
              <div className="bg-[#fcfaf7] p-4 rounded-2xl border border-[#e8dcd2] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#800000] text-sm font-serif">
                    #{activeIncident.incident_id}: {activeIncident.incident_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeIncident.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : activeIncident.severity === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {activeIncident.severity}
                  </span>
                </div>

                <p className="text-slate-800 leading-relaxed text-xs">{activeIncident.description}</p>

                <div className="pt-2 border-t border-[#ebdcd0] text-[11px] text-slate-600 space-y-0.5">
                  <p>
                    <strong className="text-slate-800">Zone:</strong> {activeIncident.zone_name}
                  </p>
                  <p>
                    <strong className="text-slate-800">Reporter:</strong> {activeIncident.reporter_name} (
                    {activeIncident.reporter_role}) · {activeIncident.created_at}
                  </p>
                  {activeIncident.detected_plate && (
                    <p>
                      <strong className="text-slate-800">Plate:</strong>{' '}
                      <span className="font-mono text-[#800000] font-bold">{activeIncident.detected_plate}</span>
                    </p>
                  )}
                </div>

                {activeIncident.estimated_diameter_cm ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1 mt-2">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5 font-serif">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>
                        Civil Triage: {activeIncident.defect_category} (~{activeIncident.estimated_diameter_cm} cm span)
                      </span>
                    </div>
                    <p className="text-[11px]">{activeIncident.recommended_action}</p>
                  </div>
                ) : null}
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleSaveResolution} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Update Workflow Status:
                  </label>
                  <select
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value as IncidentStatus)}
                    className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
                  >
                    <option value="Open">Open (Pending Inspection)</option>
                    <option value="In_Progress">In Progress (Unit Dispatched)</option>
                    <option value="Resolved">Resolved (Cleared & Verified)</option>
                    <option value="Dismissed">Dismissed (False Alarm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official Action & Resolution Notes:
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="e.g. Cleared obstruction / Work order issued to Civil Maintenance Cell."
                    className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#800000] to-[#a31515] hover:from-[#660000] hover:to-[#851010] text-amber-50 shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Resolution Update</span>
                </button>
              </form>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No incident found matching filter criteria.</p>
          )}
        </div>

        {/* Right: Master Incident Table */}
        <div className="lg:col-span-7 bg-white border border-[#e2d5cb] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0e6de] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#800000] font-serif">Master Campus Incident Log</h3>
              <p className="text-[11px] text-slate-500">Complete spatial audit history</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search incident, zone, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-2.5 py-1.5 bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#800000] w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e2d5cb] text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-bold">ID</th>
                  <th className="py-2.5 font-bold">Category</th>
                  <th className="py-2.5 font-bold">Zone</th>
                  <th className="py-2.5 font-bold">Severity</th>
                  <th className="py-2.5 font-bold">Status</th>
                  <th className="py-2.5 font-bold">Plate</th>
                  <th className="py-2.5 font-bold">Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6de] font-mono">
                {filteredIncidents.map((inc) => (
                  <tr
                    key={inc.incident_id}
                    onClick={() => {
                      setSelectedIncidentId(inc.incident_id);
                      if (onFocusZone) onFocusZone(inc.zone_id);
                    }}
                    className={`hover:bg-[#fcfaf7] cursor-pointer transition ${
                      selectedIncidentId === inc.incident_id ? 'bg-[#fdf3ec]' : ''
                    }`}
                  >
                    <td className="py-3 text-slate-400 font-bold">#{inc.incident_id}</td>
                    <td className="py-3 font-sans font-semibold text-slate-800">
                      {inc.incident_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 font-sans text-slate-600 max-w-[140px] truncate">{inc.zone_name}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : inc.severity === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : inc.status === 'In_Progress'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-[#800000]">{inc.detected_plate || '—'}</td>
                    <td className="py-3 text-slate-500 text-[11px] font-sans">{inc.created_at.slice(5, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
