import {useMemo, useState} from "react";
import {useApp} from "@/context/AppContext";
import {MapPin, Plus, Users, X} from "lucide-react";
import {gymAreas, scheduleSessions as allSessions} from "@/data/mockData";
import {getDayName, getShortDayName} from "@/lib/utils";
import {toast} from "sonner";

const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
];

const daysOfWeek = [1, 2, 3, 4, 5, 6]; // Mon-Sat

export default function Schedule() {
  const { team } = useApp();
  const [sessions, setSessions] = useState(allSessions);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [newSession, setNewSession] = useState({
    title: "",
    trainerId: "",
    areaId: "",
    startTime: "",
    endTime: "",
    maxCapacity: 10,
  });

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => s.dayOfWeek === selectedDay);
  }, [sessions, selectedDay]);

  const handleAddSession = () => {
    if (!newSession.title || !newSession.trainerId || !newSession.areaId || !newSession.startTime || !newSession.endTime) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSessions([
      ...sessions,
      {
        id: `s${Date.now()}`,
        ...newSession,
        dayOfWeek: selectedDay,
        enrolled: 0,
      },
    ]);
    toast.success("Sessao adicionada!");
    setShowAdd(false);
    setNewSession({ title: "", trainerId: "", areaId: "", startTime: "", endTime: "", maxCapacity: 10 });
  };

  const areaColor = (areaId: string) => {
    switch (areaId) {
      case "a1": return "border-l-[#FF6B00] bg-[rgba(255,107,0,0.1)]";
      case "a2": return "border-l-[#22C55E] bg-[rgba(34,197,94,0.1)]";
      case "a3": return "border-l-[#EF4444] bg-[rgba(239,68,68,0.1)]";
      case "a4": return "border-l-[#8B5CF6] bg-[rgba(139,92,246,0.1)]";
      case "a5": return "border-l-[#3B82F6] bg-[rgba(59,130,246,0.1)]";
      case "a6": return "border-l-[#F59E0B] bg-[rgba(245,158,11,0.1)]";
      default: return "border-l-[#B0AEAA] bg-[rgba(176,174,170,0.1)]";
    }
  };

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {/* Day Tabs */}
      <div className="flex gap-1 mb-5 bg-[#353535] border border-[#4A4A4A] rounded-xl p-1 overflow-x-auto">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 min-w-[80px] py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedDay === day
                ? "bg-[#FF6B00] text-white"
                : "text-[#B0AEAA] hover:text-[#F2F2F2]"
            }`}
          >
            {getShortDayName(day)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#F2F2F2] font-semibold text-lg">{getDayName(selectedDay)}</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 gradient-orange rounded-md text-white text-xs font-semibold uppercase tracking-wide hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus size={14} />
          Nova Sessao
        </button>
      </div>

      {/* Time Grid */}
      <div className="space-y-2">
        {timeSlots.map((time) => {
          const slotSessions = filteredSessions.filter((s) => s.startTime === time);
          return (
            <div key={time} className="flex gap-3">
              <div className="w-14 shrink-0 text-right pt-2">
                <span className="text-[#B0AEAA] text-xs font-medium">{time}</span>
              </div>
              <div className="flex-1 min-h-[48px] bg-[#353535] border border-[#4A4A4A] rounded-lg p-2">
                {slotSessions.length === 0 ? (
                  <div className="h-full flex items-center">
                    <span className="text-[#4A4A4A] text-xs">-</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slotSessions.map((session) => {
                      const trainer = team.find((t) => t.id === session.trainerId);
                      const area = gymAreas.find((a) => a.id === session.areaId);
                      const occupancy = Math.round((session.enrolled / session.maxCapacity) * 100);
                      return (
                        <div
                          key={session.id}
                          className={`flex-1 min-w-[200px] border-l-[3px] rounded-md p-3 ${areaColor(session.areaId)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-[#F2F2F2] text-sm font-semibold">{session.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-[#B0AEAA] text-xs">
                                <span className="flex items-center gap-1">
                                  <MapPin size={10} />
                                  {area?.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users size={10} />
                                  {session.enrolled}/{session.maxCapacity}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              occupancy >= 90 ? "bg-[rgba(239,68,68,0.2)] text-[#EF4444]" :
                              occupancy >= 70 ? "bg-[rgba(245,158,11,0.2)] text-[#F59E0B]" :
                              "bg-[rgba(34,197,94,0.2)] text-[#22C55E]"
                            }`}>
                              {occupancy}%
                            </span>
                          </div>
                          {trainer && (
                            <p className="text-[#B0AEAA] text-xs mt-1.5">{trainer.name}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Session Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-[#353535] border border-[#4A4A4A] rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-[#4A4A4A]">
              <h3 className="text-[#F2F2F2] font-semibold text-lg">Nova Sessao</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Titulo *</label>
                <input type="text" value={newSession.title} onChange={(e) => setNewSession({ ...newSession, title: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="Nome da sessao" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Inicio</label>
                  <select value={newSession.startTime} onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer">
                    <option value="">--</option>
                    {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Fim</label>
                  <select value={newSession.endTime} onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer">
                    <option value="">--</option>
                    {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Treinador</label>
                <select value={newSession.trainerId} onChange={(e) => setNewSession({ ...newSession, trainerId: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer">
                  <option value="">Selecionar treinador</option>
                  {team.filter((t) => t.status === "active").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Area</label>
                <select value={newSession.areaId} onChange={(e) => setNewSession({ ...newSession, areaId: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer">
                  <option value="">Selecionar area</option>
                  {gymAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#4A4A4A]">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] cursor-pointer hover:bg-[#404040]">Cancelar</button>
              <button onClick={handleAddSession} className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold cursor-pointer hover:brightness-110">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
