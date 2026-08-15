import { Bell, Menu, Settings, LogOut } from "lucide-react";
import type { Page } from "@/App";

const pageTitles: Record<Page, string> = {
    dashboard: "Dashboard",
    members: "Membros",
    areas: "Áreas do Ginásio",
    checkin: "Check-in",
    team: "Equipa",
    schedule: "Horário",
    plandesigner: "Planos de Membro",
    billing: "Faturação",
    onboarding: "Início Rápido",
};

interface ToolbarProps {
    currentPage: Page;
    onMenuClick: () => void;
    onLogout: () => void;
    userName?: string;
    userPhoto?: string;
}

export default function Toolbar({
                                    currentPage,
                                    onMenuClick,
                                    onLogout,
                                    userName,
                                    userPhoto,
                                }: ToolbarProps) {
    const iniciais = userName
        ? userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "RS";

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

                {/* Avatar */}
                {userPhoto ? (
                    <img
                        src={`http://localhost:5000${userPhoto}`}
                        alt={userName}
                        className="w-8 h-8 rounded-[4px] object-cover ml-1"
                    />
                ) : (
                    <div
                        className="w-8 h-8 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-xs ml-1 cursor-default"
                        title={userName || "Usuário"}
                    >
                        {iniciais}
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="p-2 text-[#B0AEAA] hover:text-red-400 transition-colors cursor-pointer"
                    title="Sair"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}