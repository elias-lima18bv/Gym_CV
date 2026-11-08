import { toast } from "sonner";
import { api } from "@/services/api";
import type { Sessao } from "@/services/api";

export type NovoEstado = "concluida" | "faltou" | "cancelada";

const MENSAGENS: Record<NovoEstado, string> = {
    concluida: "Sessão concluída",
    faltou: "Falta registada",
    cancelada: "Sessão cancelada",
};

// Concluir, marcar falta ou cancelar uma sessão (só o cancelamento pede confirmação).
// Devolve true se a sessão foi mesmo alterada, para quem chama recarregar os dados.
export async function alterarEstadoSessao(sessao: Sessao, estado: NovoEstado): Promise<boolean> {
    if (estado === "cancelada" && !window.confirm(`Cancelar a sessão de ${sessao.atleta}?`)) return false;
    try {
        await api.atualizarEstadoSessao(sessao.id, estado);
        toast.success(MENSAGENS[estado]);
        return true;
    } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar a sessão");
        return false;
    }
}