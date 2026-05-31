import { Dumbbell, Heart, Flame, Sparkles, Activity, Swords } from "lucide-react";
import { gymAreas } from "@/data/mockData";

const iconMap: Record<string, React.ElementType> = {
  Dumbbell,
  Heart,
  Flame,
  Sparkles,
  Activity,
  Swords,
};

export default function GymAreas() {
  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {gymAreas.map((area, i) => {
          const Icon = iconMap[area.icon] || Dumbbell;
          const occupancyPercent = Math.round((area.currentOccupancy / area.capacity) * 100);
          const isNearFull = occupancyPercent >= 80;
          const isModerate = occupancyPercent >= 50 && occupancyPercent < 80;

          return (
            <div
              key={area.id}
              className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,107,0,0.2)] hover:shadow-lg group"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#2B2B2B] border border-[#4A4A4A] flex items-center justify-center group-hover:bg-[rgba(255,107,0,0.1)] group-hover:border-[rgba(255,107,0,0.3)] transition-all">
                  <Icon size={24} className="text-[#FF6B00]" />
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                    isNearFull
                      ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                      : isModerate
                      ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]"
                      : "bg-[rgba(34,197,94,0.15)] text-[#22C55E]"
                  }`}
                >
                  {occupancyPercent}%
                </span>
              </div>

              <h3 className="text-[#F2F2F2] font-semibold text-lg mb-1">{area.name}</h3>
              <p className="text-[#B0AEAA] text-sm mb-4">{area.description}</p>

              {/* Occupancy Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#B0AEAA]">Ocupacao</span>
                  <span className="text-[#F2F2F2] font-medium">{area.currentOccupancy} / {area.capacity}</span>
                </div>
                <div className="h-2 bg-[#2B2B2B] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNearFull ? "bg-[#EF4444]" : isModerate ? "bg-[#F59E0B]" : "bg-[#22C55E]"
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-3 pt-3 border-t border-[#4A4A4A]">
                <div className="text-center flex-1">
                  <p className="text-[#F2F2F2] font-semibold text-sm">{area.capacity}</p>
                  <p className="text-[#B0AEAA] text-[10px] uppercase">Capacidade</p>
                </div>
                <div className="text-center flex-1 border-x border-[#4A4A4A]">
                  <p className="text-[#22C55E] font-semibold text-sm">{area.currentOccupancy}</p>
                  <p className="text-[#B0AEAA] text-[10px] uppercase">Presentes</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[#F2F2F2] font-semibold text-sm">{area.capacity - area.currentOccupancy}</p>
                  <p className="text-[#B0AEAA] text-[10px] uppercase">Disponivel</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
