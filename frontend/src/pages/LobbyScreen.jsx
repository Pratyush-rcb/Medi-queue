import { useState, useEffect, useRef } from 'react';
import { api, socket } from '../api';
import { Link } from 'react-router-dom';
import { Activity, Clock, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { speakTokenAnnouncement } from '../utils/voiceAnnouncer';

export default function LobbyScreen() {
  const [doctors, setDoctors] = useState([]);
  const [queues, setQueues] = useState({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const today = new Date().toISOString().split('T')[0];

  const voiceEnabledRef = useRef(true);
  const lastAnnouncedByDocRef = useRef({});
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Unlock browser speech synthesis automatically on any first interaction if needed
  useEffect(() => {
    const unlockAudio = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const fetchAllQueues = async (docList) => {
    const map = {};
    for (const doc of docList) {
      const res = await api.get(`/queue/${doc._id}/${today}`);
      map[doc._id] = res.data;

      const current = res.data.find((item) => item.status === 'IN_CONSULTATION');
      const currentTokenId = current ? String(current._id) : null;
      const prevTokenId = lastAnnouncedByDocRef.current[doc._id];

      if (hasInitializedRef.current && current && currentTokenId !== prevTokenId) {
        speakTokenAnnouncement({
          tokenNumber: current.tokenNumber,
          doctorName: doc.name,
          room: doc.roomNumber,
          enabled: voiceEnabledRef.current,
        });
      }

      lastAnnouncedByDocRef.current[doc._id] = currentTokenId;
    }

    hasInitializedRef.current = true;
    setQueues(map);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);

    api.get('/doctors').then((res) => {
      setDoctors(res.data);
      fetchAllQueues(res.data);
      socket.on('lobby_update', () => fetchAllQueues(res.data));
    });

    return () => {
      clearInterval(timer);
      socket.off('lobby_update');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [today]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 text-slate-950 p-2.5 rounded-xl">
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">MEDIQUEUE OPD DISPLAY</h1>
              <p className="text-sm text-teal-400 font-medium">Live Outpatient Consultation Board</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-black font-mono text-white flex items-center gap-2 justify-end">
              <Clock size={24} className="text-teal-400" /> {time}
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setVoiceEnabled((prev) => !prev)}
                className={`text-xs font-bold px-3 py-1 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer ${
                  voiceEnabled
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                {voiceEnabled ? 'Auto Voice Active' : 'Muted'}
              </button>
              <span className="text-xs text-slate-400 font-mono">{today}</span>
              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-white border border-slate-700 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition"
              >
                <ArrowLeft size={12} /> Exit TV
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => {
            const q = queues[doc._id] || [];
            const current = q.find((item) => item.status === 'IN_CONSULTATION');
            const nextUp = q.filter((item) => item.status === 'WAITING').slice(0, 4);

            return (
              <div key={doc._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-white">{doc.name}</h2>
                      <p className="text-teal-400 text-sm font-semibold">{doc.department}</p>
                    </div>
                    <span className="px-3.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-xl font-black text-sm">
                      ROOM {doc.roomNumber}
                    </span>
                  </div>

                  <div className={`rounded-2xl p-5 mb-5 border ${current ? 'bg-teal-500/15 border-teal-500/50' : 'bg-slate-800/50 border-slate-800'}`}>
                    <p className="text-xs uppercase tracking-widest text-teal-300 font-bold">Now Serving</p>
                    {current ? (
                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-5xl font-black text-white">#{current.tokenNumber}</span>
                        <span className="text-lg font-bold text-teal-200 truncate max-w-[160px]">{current.patientName}</span>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-slate-500 mt-2">Ready for Next</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2.5">Up Next in Queue</p>
                  <div className="flex gap-2 flex-wrap">
                    {nextUp.length > 0 ? nextUp.map((n) => (
                      <span key={n._id} className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${n.isEmergency ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                        #{n.tokenNumber} {n.patientName.split(' ')[0]}
                      </span>
                    )) : <span className="text-xs text-slate-500">No waiting patients</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}