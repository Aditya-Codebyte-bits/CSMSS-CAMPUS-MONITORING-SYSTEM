import React, { useState } from 'react';
import { RegisteredVehicle, VehicleOwnerRole, VehicleType } from '../types';
import { store } from '../services/store';
import {
  Car,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  Search,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Printer,
  Sliders,
  UserCheck,
} from 'lucide-react';

interface GateAnprViewProps {
  vehicles: RegisteredVehicle[];
  onRefresh: () => void;
  onBarrierChange?: (isOpen: boolean) => void;
}

export const GateAnprView: React.FC<GateAnprViewProps> = ({
  vehicles,
  onRefresh,
  onBarrierChange,
}) => {
  const [queryPlate, setQueryPlate] = useState<string>('MH20EE4512');
  const [verificationResult, setVerificationResult] = useState<{
    plate_number: string;
    is_authorized: boolean;
    classification: string;
    vehicle_details: RegisteredVehicle | null;
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newPlate, setNewPlate] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<VehicleOwnerRole>('student');
  const [newDept, setNewDept] = useState<string>('Computer Science');
  const [newType, setNewType] = useState<VehicleType>('two_wheeler');
  const [newSticker, setNewSticker] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const [searchTable, setSearchTable] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const handleVerify = (plateToTest?: string) => {
    const target = (plateToTest || queryPlate).trim();
    if (!target) return;
    setQueryPlate(target.toUpperCase());
    const res = store.verifyVehiclePlate(target);
    setVerificationResult(res);

    if (onBarrierChange) {
      onBarrierChange(res.is_authorized);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPlate.trim() || !newName.trim() || !newSticker.trim()) {
      setFormError('License Plate, Owner Name, and Pass Sticker ID are required.');
      return;
    }

    try {
      const added = store.addVehicle({
        plate_number: newPlate.trim(),
        owner_name: newName.trim(),
        owner_role: newRole,
        department: newDept.trim() || 'General Staff',
        vehicle_type: newType,
        pass_sticker_id: newSticker.trim(),
        contact_phone: newPhone.trim() || undefined,
        is_active: true,
      });

      setShowAddModal(false);
      setNewPlate('');
      setNewName('');
      setNewSticker('');
      setNewPhone('');
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Registration failed.');
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesRole = roleFilter === 'all' || v.owner_role === roleFilter;
    const matchesSearch =
      searchTable === '' ||
      v.plate_number.toLowerCase().includes(searchTable.toLowerCase()) ||
      v.owner_name.toLowerCase().includes(searchTable.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTable.toLowerCase()) ||
      v.pass_sticker_id.toLowerCase().includes(searchTable.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header with quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e2d5cb] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#800000] font-serif tracking-tight flex items-center gap-2">
            <span>Gate 2 & 3 ANPR Checkpoint</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-time optical number plate verification against authorized student, faculty & emergency fleet registry.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#800000] hover:bg-[#660000] text-amber-50 shadow-sm transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
          <span>Issue New Campus Pass</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Watchman Scanner Deck styled in CSMSS Burgundy & Warm Cream */}
        <div className="lg:col-span-5 bg-white border border-[#e2d5cb] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#f0e6de] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#800000] font-serif">
              Instant Gate Verification Desk
            </span>
            <span className="text-[11px] font-mono text-[#800000] bg-[#fbf5f2] px-2.5 py-0.5 rounded border border-[#e8d2c4] font-semibold">
              Gate 3 & Gate 2 Checkpoint
            </span>
          </div>

          {/* Large tactile license plate input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              License Plate (Type or Scan)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={queryPlate}
                onChange={(e) => setQueryPlate(e.target.value.toUpperCase())}
                placeholder="MH20EE4512"
                className="flex-1 bg-[#fdfbf9] border border-[#d6c4b6] rounded-2xl px-4 py-3 text-lg font-mono font-bold text-[#800000] uppercase focus:outline-none focus:border-[#800000] shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleVerify()}
                className="px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-[#800000] to-[#a31515] hover:from-[#660000] hover:to-[#851010] text-amber-50 shadow-md transition cursor-pointer"
              >
                Scan Plate
              </button>
            </div>

            {/* Quick Demonstration Pre-sets for Security Staff */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 text-[11px]">Quick Tests:</span>
              <button
                onClick={() => {
                  setQueryPlate('MH20EE4512');
                  handleVerify('MH20EE4512');
                }}
                className="px-2.5 py-1 rounded-xl bg-[#f7f2ee] hover:bg-[#eee4dc] text-[#800000] border border-[#e2d5cb] font-mono text-[11px] font-semibold transition cursor-pointer"
              >
                MH20EE4512 (Faculty)
              </button>
              <button
                onClick={() => {
                  setQueryPlate('MH20AM1080');
                  handleVerify('MH20AM1080');
                }}
                className="px-2.5 py-1 rounded-xl bg-[#f7f2ee] hover:bg-[#eee4dc] text-[#800000] border border-[#e2d5cb] font-mono text-[11px] font-semibold transition cursor-pointer"
              >
                MH20AM1080 (Ambulance)
              </button>
              <button
                onClick={() => {
                  setQueryPlate('MH12XY9999');
                  handleVerify('MH12XY9999');
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-mono text-[11px] font-semibold transition cursor-pointer"
              >
                MH12XY9999 (Outsider)
              </button>
            </div>
          </div>

          {/* Verification Outcome Card */}
          {verificationResult && (
            <div className="animate-fade-in pt-1">
              {verificationResult.is_authorized && verificationResult.vehicle_details ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      <span>ACCESS GRANTED • AUTHORIZED</span>
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                      Barrier Raised
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-emerald-200 text-xs">
                    <div className="text-emerald-950 font-bold text-sm font-serif">
                      {verificationResult.vehicle_details.owner_name}
                    </div>
                    <div className="text-emerald-800 flex items-center gap-2 font-medium">
                      <span className="capitalize">{verificationResult.vehicle_details.owner_role}</span>
                      <span>·</span>
                      <span>{verificationResult.vehicle_details.department}</span>
                      <span>·</span>
                      <span className="capitalize">{verificationResult.vehicle_details.vehicle_type.replace('_', ' ')}</span>
                    </div>
                    <div className="font-mono text-[11px] text-emerald-700 pt-1">
                      Pass Sticker: {verificationResult.vehicle_details.pass_sticker_id} · Tel:{' '}
                      {verificationResult.vehicle_details.contact_phone || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-sm text-rose-700">
                      <ShieldAlert className="w-5 h-5" />
                      <span>UNREGISTERED VISITOR ALERT</span>
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold">
                      Barrier Locked
                    </span>
                  </div>

                  <p className="text-xs text-rose-900 leading-relaxed pt-1 border-t border-rose-200">
                    Plate <strong className="font-mono text-rose-950">{verificationResult.plate_number}</strong> is not
                    registered in the authorized CSMSS campus whitelist.
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => alert(`Temporary Visitor Gate Slip Generated for plate ${verificationResult.plate_number}. Directed to Visitor Parking Bay.`)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#800000] hover:bg-[#660000] text-amber-50 transition cursor-pointer text-center"
                    >
                      Print Temporary Visitor Pass
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Protocols */}
          <div className="bg-[#fbf9f6] p-4 rounded-2xl border border-[#e8dcd2] text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-[#800000] font-serif block">CSMSS Gate Protocols:</span>
            <p>1. Valid stickers auto-raise the mechanical barrier.</p>
            <p>2. Unregistered guests must be issued a physical entry slip at Gate 2 or 3.</p>
            <p>3. Ambulances heading to Ayurveda Rugnalaya receive instant high-priority clearance.</p>
          </div>
        </div>

        {/* Right: Whitelisted Fleet Table */}
        <div className="lg:col-span-7 bg-white border border-[#e2d5cb] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0e6de] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#800000] font-serif">Authorized Campus Registry</h3>
              <p className="text-[11px] text-slate-500">{vehicles.length} Active Whitelisted Vehicles</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#800000]"
              >
                <option value="all">All Roles</option>
                <option value="faculty">Faculty</option>
                <option value="student">Students</option>
                <option value="ambulance">Emergency</option>
                <option value="college_bus">Transit Buses</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search plate..."
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  className="pl-7 pr-2.5 py-1.5 bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#800000] w-32 sm:w-40"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e2d5cb] text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-bold">Plate Number</th>
                  <th className="py-2.5 font-bold">Owner</th>
                  <th className="py-2.5 font-bold">Role</th>
                  <th className="py-2.5 font-bold">Department</th>
                  <th className="py-2.5 font-bold">Pass ID</th>
                  <th className="py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6de] font-sans">
                {filteredVehicles.map((v) => (
                  <tr key={v.vehicle_id} className="hover:bg-[#fcfaf7] transition">
                    <td className="py-3 font-mono font-bold text-[#800000] text-xs">{v.plate_number}</td>
                    <td className="py-3 font-semibold text-slate-900">{v.owner_name}</td>
                    <td className="py-3">
                      <span className="capitalize text-slate-600 text-[11px] font-medium">{v.owner_role}</span>
                    </td>
                    <td className="py-3 text-slate-600">{v.department}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">{v.pass_sticker_id}</td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#d6c4b6] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-[#800000] font-serif mb-4">Register New Campus Vehicle Pass</h3>

            {formError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Plate Number *</label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    placeholder="MH20GH7788"
                    className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-slate-900 font-mono uppercase focus:outline-none focus:border-[#800000]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pass ID *</label>
                  <input
                    type="text"
                    value={newSticker}
                    onChange={(e) => setNewSticker(e.target.value)}
                    placeholder="CSMSS-PASS-501"
                    className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#800000]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as VehicleOwnerRole)}
                    className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="staff">Staff</option>
                    <option value="college_bus">Transit Bus</option>
                    <option value="ambulance">Emergency Unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as VehicleType)}
                    className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                  >
                    <option value="two_wheeler">Two-Wheeler</option>
                    <option value="four_wheeler">Four-Wheeler</option>
                    <option value="bus">Bus</option>
                    <option value="emergency">Ambulance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="Computer Science, Mechanical..."
                  className="w-full bg-[#fdfbf9] border border-[#d6c4b6] rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#800000] hover:bg-[#660000] text-amber-50 font-bold"
                >
                  Save Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
