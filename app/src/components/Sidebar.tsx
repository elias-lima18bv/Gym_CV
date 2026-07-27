import {Calendar, CreditCard, Layers, LayoutDashboard, Map, QrCode, Rocket, UserCog, Users,} from "lucide-react";
import type {Page} from "@/App";
import {cn} from "@/lib/utils";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "members", label: "Membros", icon: Users },
  { page: "areas", label: "Areas", icon: Map },
  { page: "checkin", label: "Check-in", icon: QrCode },
  { page: "team", label: "Equipa", icon: UserCog },
  { page: "schedule", label: "Horário", icon: Calendar },
  { page: "plandesigner", label: "Planos", icon: Layers },
  { page: "billing", label: "Faturação", icon: CreditCard },
  { page: "onboarding", label: "Inicio", icon: Rocket },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
      <aside className="w-60 h-full bg-[#2B2B2B] border-r border-[#4A4A4A] flex flex-col z-40">
          {/* Logo */}
          <div className="p-5 flex items-center gap-3">
              <img className="w-9 h-9 rounded-[4px] gradient-orange flex items-center justify-center"
                   src="https://cdn-icons-png.flaticon.com/128/6201/6201278.png" width="45" height="25" alt="gimMaster"/>
              <span className="text-[#F2F2F2] font-bold text-lg tracking-tight">Gym-Elias</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1">
              {navItems.map((item) => {
                  const isActive = currentPage === item.page;
                  return (
                      <button
                          key={item.page}
                          onClick={() => onNavigate(item.page)}
                          className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                              isActive
                                  ? "bg-[rgba(255,107,0,0.1)] text-[#FF6B00] border-l-[3px] border-[#FF6B00]"
                                  : "text-[#B0AEAA] hover:bg-[#404040] hover:text-[#F2F2F2] border-l-[3px] border-transparent"
                          )}
                      >
                          <item.icon size={20} className={isActive ? "text-[#FF6B00]" : ""}/>
                          <span>{item.label}</span>
                      </button>
                  );
              })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#4A4A4A]">
              <div className="flex items-center gap-2 text-xs text-[#B0AEAA]">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E]"/>
                  <span>Sistema Online</span>
                  <span className="footer-copyright">
                      © 2026 Elias Lima
                  </span>
          </div>
          </div>
      </aside>
  );
}
