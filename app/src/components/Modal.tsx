import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

// Janela modal genérica: fecha com o X, clicando fora ou com a tecla Esc
export default function Modal({
                                  titulo,
                                  onClose,
                                  children,
                                  rodape,
                                  larga = false,
                              }: {
    titulo: string;
    onClose: () => void;
    children: ReactNode;
    rodape?: ReactNode;
    larga?: boolean;
}) {
    useEffect(() => {
        const aoPremirTecla = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", aoPremirTecla);
        return () => window.removeEventListener("keydown", aoPremirTecla);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={titulo}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className={`relative bg-[#353535] border border-[#4A4A4A] rounded-2xl w-full ${larga ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto animate-scale-in scrollbar-thin`}>
                <div className="flex items-center justify-between p-5 border-b border-[#4A4A4A]">
                    <h3 className="text-[#F2F2F2] font-semibold text-lg">{titulo}</h3>
                    <button onClick={onClose} aria-label="Fechar" className="p-1 text-[#B0AEAA] hover:text-[#F2F2F2] transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-4">{children}</div>
                {rodape && <div className="flex justify-end gap-3 p-5 border-t border-[#4A4A4A]">{rodape}</div>}
            </div>
        </div>
    );
}