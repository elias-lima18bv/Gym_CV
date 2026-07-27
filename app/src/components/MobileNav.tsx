import {Calendar, CreditCard, LayoutDashboard, QrCode, Users} from "lucide-react";
import type {Page} from "@/App";
import {cn} from "@/lib/utils";

interface MobileNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const tabs: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { page: "members", label: "Membros", icon: Users },
  { page: "checkin", label: "Check-in", icon: QrCode },
  { page: "billing", label: "Fatura", icon: CreditCard },
  { page: "schedule", label: "Horário", icon: Calendar },
];

export default function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#2B2B2B] border-t border-[#4A4A4A] z-40 flex items-center justify-around lg:hidden">
      {tabs.map((tab) => {
        const isActive = currentPage === tab.page;
        return (
          <button
            key={tab.page}
            onClick={() => onNavigate(tab.page)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3 transition-colors duration-200 cursor-pointer",
              isActive ? "text-[#FF6B00]" : "text-[#B0AEAA]"
            )}
          >
            <tab.icon size={22} className={isActive ? "scale-110 transition-transform" : ""} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
