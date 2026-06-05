import {Bell, Menu, Settings} from "lucide-react";
import type {Page} from "@/App";

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  members: "Membros",
  areas: "Areas do Ginasio",
  checkin: "Check-in",
  team: "Equipa",
  schedule: "Horario",
  plandesigner: "Planos de Membro",
  billing: "Faturacao",
  onboarding: "Inicio Rapido",
};

interface ToolbarProps {
  currentPage: Page;
  onMenuClick: () => void;
}

export default function Toolbar({ currentPage, onMenuClick }: ToolbarProps) {
  return (
    <header className="h-14 bg-[#2B2B2B] border-b border-[#4A4A4A] flex items-center justify-between px-4 lg:px-6 z-50 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#B0AEAA] hover:text-[#F2F2F2] transition-colors cursor-pointer"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-[#F2F2F2] font-semibold text-base lg:text-lg">
          {pageTitles[currentPage]}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 text-[#B0AEAA] hover:text-[#F2F2F2] transition-colors cursor-pointer">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B00] rounded-full animate-pulse-badge" />
        </button>
        <button className="p-2 text-[#B0AEAA] hover:text-[#F2F2F2] transition-colors cursor-pointer">
          <Settings size={20} />
        </button>
        <div className="w-8 h-8 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-xs ml-1">
          RS
        </div>
      </div>
    </header>
  );
}
