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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-biceps-flexed-icon lucide-biceps-flexed"><path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"/><path d="M15 14a5 5 0 0 0-7.584 2"/><path d="M9.964 6.825C8.019 7.977 9.5 13 8 15"/>
              </svg>
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
