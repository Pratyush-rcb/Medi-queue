import { useState, useEffect } from 'react';
import { api, socket } from '../api';
import { useAuth } from '../context/AuthContext';
import { speakTokenAnnouncement } from '../utils/voiceAnnouncer';
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  Siren,
  Lock,
  Sparkles,
  FileText,
  Plus,
  Trash2,
  Send,
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [queue, setQueue] = useState([]);

  // AI Prescription Builder state
  const [showRxBuilder, setShowRxBuilder] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [advice, setAdvice] = useState('');
  const [draftingRx, setDraftingRx] = useState(false);
  const [sendingRx, setSendingRx] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.get('/doctors').then((res) => {
      setDoctors(res.data);
      if (user?.doctorProfile) {
        setSelectedDoc(String(user.doctorProfile));
      } else if (user?.role === 'DOCTOR') {
        const matched = res.data.find((d) => d.name.toLowerCase() === user.name.toLowerCase());
        if (matched) setSelectedDoc(matched._id);
      } else if (res.data.length > 0) {
        setSelectedDoc(res.data[0]._id);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!selectedDoc) return;
    api.get(`/queue/${selectedDoc}/${today}`).then((res) => setQueue(res.data));

    const eventName = `queue_update_${selectedDoc}`;
    socket.on(eventName, (updated) => setQueue(updated));
    return () => socket.off(eventName);
  }, [selectedDoc, today]);

  const activePatient = queue.find((q) => q.status === 'IN_CONSULTATION');

  // Reset prescription form whenever the active patient changes
  useEffect(() => {
    setShowRxBuilder(false);
    setSymptoms('');
    setDiagnosis('');
    setMedicines([]);
    setAdvice('');
  }, [activePatient?._id]);

  const updateStatus = async (id, status) => {
    if (status === 'IN_CONSULTATION') {
      const targetToken = queue.find((q) => q._id === id);
      const activeDoctor = doctors.find((d) => d._id === selectedDoc);
      if (targetToken) {
        speakTokenAnnouncement({
          tokenNumber: targetToken.tokenNumber,
          doctorName: activeDoctor?.name || user?.name,
          room: activeDoctor?.roomNumber,
          enabled: true,
        });
      }
    }
    await api.patch(`/appointments/${id}/status`, { status });
  };

  const handleGenerateAiRx = async () => {
    if (!activePatient || !symptoms.trim()) return;
    try {
      setDraftingRx(true);
      const res = await api.post(`/appointments/${activePatient._id}/ai-prescription`, {
        symptoms,
      });
      setDiagnosis(res.data.diagnosis || '');
      setMedicines(res.data.medicines || []);
      setAdvice(res.data.advice || '');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not generate AI prescription');
    } finally {
      setDraftingRx(false);
    }
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { name: '', dosage: '1 Tab', frequency: 'Twice daily', duration: '5 days' },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendPrescription = async () => {
    if (!activePatient) return;
    try {
      setSendingRx(true);
      await api.post(`/appointments/${activePatient._id}/prescription`, {
        symptoms,
        diagnosis,
        medicines: medicines.filter((m) => m.name.trim()),
        advice,
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send prescription');
    } finally {
      setSendingRx(false);
    }
  };

  const waitingCount = queue.filter((q) => q.status === 'WAITING').length;
  const completedCount = queue.filter((q) => q.status === 'COMPLETED').length;
  const emergencyCount = queue.filter((q) => q.isEmergency && q.status === 'WAITING').length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Doctor Consultation Console</h1>
          <p className="text-sm text-slate-500">Manage live patient flow and update lobby screens in real time.</p>
        </div>
        {user?.role === 'DOCTOR' ? (
          <div className="px-4 py-2.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl font-bold text-sm">
            {doctors.find((d) => d._id === selectedDoc)?.name || user.name} — {doctors.find((d) => d._id === selectedDoc)?.department} (Rm {doctors.find((d) => d._id === selectedDoc)?.roomNumber})
          </div>
        ) : (
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 bg-white font-semibold text-sm shadow-2xs outline-none"
          >
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>{d.name} — {d.department} (Rm {d.roomNumber})</option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Clock size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Waiting</p>
            <p className="text-2xl font-black text-slate-900">{waitingCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Users size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500">In Cabin</p>
            <p className="text-2xl font-black text-slate-900">{activePatient ? `#${activePatient.tokenNumber}` : 'None'}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Completed</p>
            <p className="text-2xl font-black text-slate-900">{completedCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600"><Siren size={22} /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Emergencies</p>
            <p className="text-2xl font-black text-red-600">{emergencyCount}</p>
          </div>
        </div>
      </div>

      {/* Active Patient Spotlight + AI Prescription Builder */}
      {activePatient && (
        <div className="bg-gradient-to-r from-teal-700 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                Currently In Consultation
              </span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-4xl font-black">#{activePatient.tokenNumber}</span>
                <span className="text-xl font-bold">{activePatient.patientName}</span>
                <span className="text-sm text-slate-300">({activePatient.patientPhone})</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowRxBuilder((prev) => !prev)}
                className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl flex items-center gap-2 border border-white/20 transition cursor-pointer text-sm"
              >
                <Sparkles size={17} className="text-amber-300" />
                {showRxBuilder ? 'Hide AI Rx' : 'AI Prescription'}
              </button>

              <button
                type="button"
                onClick={() => updateStatus(activePatient._id, 'COMPLETED')}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer text-sm"
              >
                <CheckCircle size={18} /> Complete Without Rx
              </button>
            </div>
          </div>

          {showRxBuilder && (
            <div className="bg-slate-950/75 border border-teal-400/30 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Enter symptoms / clinical notes (e.g., High fever 101F, sore throat, body ache since 2 days)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-teal-400"
                />
                <button
                  type="button"
                  disabled={draftingRx || !symptoms.trim()}
                  onClick={handleGenerateAiRx}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                >
                  <Sparkles size={16} />
                  {draftingRx ? 'Drafting...' : 'Generate AI Draft'}
                </button>
              </div>

              {(diagnosis || medicines.length > 0 || advice) && (
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-teal-300 mb-1">
                      Provisional Diagnosis
                    </label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-teal-300">
                        Prescribed Medicines
                      </label>
                      <button
                        type="button"
                        onClick={handleAddMedicine}
                        className="text-xs font-bold text-teal-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> Add Medicine
                      </button>
                    </div>

                    {medicines.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                          placeholder="Medicine name"
                          className="sm:col-span-4 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          placeholder="Dosage"
                          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                          placeholder="Frequency"
                          className="sm:col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                          placeholder="Duration"
                          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="sm:col-span-1 text-slate-400 hover:text-red-400 flex justify-center cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-teal-300 mb-1">
                      Care Advice & Follow-Up
                    </label>
                    <textarea
                      rows={2}
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={sendingRx || !diagnosis.trim()}
                      onClick={handleSendPrescription}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-sm flex items-center gap-2 transition cursor-pointer"
                    >
                      <Send size={16} />
                      {sendingRx ? 'Sending Report...' : 'Send to Patient Report & Complete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Patient Queue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4">Token</th>
              <th className="p-4">Patient Details</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {queue.map((item) => {
              const isClosed = item.status === 'COMPLETED' || item.status === 'NO_SHOW';

              return (
                <tr
                  key={item._id}
                  className={`transition ${
                    item.status === 'IN_CONSULTATION'
                      ? 'bg-teal-50/60'
                      : isClosed
                      ? 'bg-slate-50/60 opacity-70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="p-4">
                    <span className="font-black text-lg text-slate-900">#{item.tokenNumber}</span>
                    {item.isEmergency && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 rounded-full">
                        <AlertTriangle size={12} /> PRIORITY
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{item.patientName}</div>
                    <div className="text-xs text-slate-500">{item.patientPhone}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'IN_CONSULTATION' ? 'bg-teal-600 text-white' :
                        item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'NO_SHOW' ? 'bg-slate-200 text-slate-600' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      {item.prescription?.diagnosis && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <FileText size={11} /> Rx Sent
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    {item.status === 'WAITING' && (
                      <>
                        <button
                          disabled={Boolean(activePatient)}
                          onClick={() => updateStatus(item._id, 'IN_CONSULTATION')}
                          title={activePatient ? 'Complete active consultation first' : 'Call patient in'}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          <Play size={14} /> Call In
                        </button>
                        <button
                          onClick={() => updateStatus(item._id, 'NO_SHOW')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300 transition cursor-pointer"
                        >
                          <XCircle size={14} /> Skip
                        </button>
                      </>
                    )}

                    {item.status === 'IN_CONSULTATION' && (
                      <button
                        onClick={() => updateStatus(item._id, 'COMPLETED')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <CheckCircle size={14} /> Done
                      </button>
                    )}

                    {isClosed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400">
                        <Lock size={13} /> Closed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {queue.length === 0 && (
              <tr>
                <td colSpan="4" className="p-12 text-center text-slate-400 font-medium">
                  No appointments scheduled for today yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}