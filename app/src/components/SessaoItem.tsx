import type { Sessao } from "@/services/api";
import type { NovoEstado } from "@/lib/sessoesAcoes";
import { formatDate, getInitials } from "@/lib/utils";
import { rotuloTipo } from "@/lib/sessoes";

const ESTADOS_FINAIS: Record<string, { texto: string; classes: string }> = {
    concluida: { texto: "Concluída", classes: "bg-[rgba(34,197,94,0.15)] text-[#22C55E]" },
    faltou: { texto: "Faltou", classes: "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]" },
    cancelada: { texto: "Cancelada", classes: "bg-[rgba(239,68,68,0.15)] text-[#EF4444]" },
};

// Uma linha de sessão. Se ainda está agendada mostra as ações (Concluir/Faltou só depois de
// começar; Cancelar sempre); se já terminou mostra o estado.
export default function SessaoItem({
                                       sessao,
                                       ocupada,
                                       ultima,
                                       soHora = false,
                                       onEstado,
                                   }: {
    sessao: Sessao;
    ocupada: boolean;
    ultima: boolean;
    soHora?: boolean; // dentro de um dia já escolhido a data é repetida: mostra só a hora
    onEstado: (sessao: Sessao, estado: NovoEstado) => void;
}) {
    const s = sessao;
    const final = ESTADOS_FINAIS[s.estado];
    return (
        <div className={`flex flex-wrap items-center gap-3 py-3 ${ultima ? "" : "border-b border-[#4A4A4A]"}`}>
            {s.foto_url ? (
                <img src={s.foto_url} alt={s.atleta} className="w-9 h-9 rounded-[4px] object-cover shrink-0" />
            ) : (
                <div className="w-9 h-9 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                    {getInitials(s.atleta)}
                </div>
            )}
            <div className="flex-1 min-w-[160px]">
                <p className="text-[#F2F2F2] text-sm font-medium truncate">{s.atleta}</p>
                <p className="text-[#B0AEAA] text-xs">
                    {rotuloTipo(s.tipo_treino)} · {s.duracao_min} min · {s.treinador ?? "Sem treinador"}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-[#F2F2F2] text-sm font-mono-cve">{soHora ? s.hora : `${formatDate(s.data)} ${s.hora}`}</p>
                {s.atrasada && <p className="text-[#F59E0B] text-xs">Por concluir</p>}
            </div>
            <div className="flex gap-1.5 shrink-0">
                {final ? (
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${final.classes}`}>{final.texto}</span>
                ) : (
                    <>
                        {s.iniciada && (
                            <>
                                <button
                                    onClick={() => onEstado(s, "concluida")}
                                    disabled={ocupada}
                                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-[rgba(34,197,94,0.15)] text-[#22C55E] hover:bg-[rgba(34,197,94,0.25)] disabled:opacity-50 cursor-pointer"
                                >
                                    Concluir
                                </button>
                                <button
                                    onClick={() => onEstado(s, "faltou")}
                                    disabled={ocupada}
                                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-[rgba(245,158,11,0.15)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.25)] disabled:opacity-50 cursor-pointer"
                                >
                                    Faltou
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => onEstado(s, "cancelada")}
                            disabled={ocupada}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-[rgba(239,68,68,0.15)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.25)] disabled:opacity-50 cursor-pointer"
                        >
                            Cancelar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}