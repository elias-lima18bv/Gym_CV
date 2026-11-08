import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import { api } from "@/services/api";
import type { RelatorioFinanceiro } from "@/services/api";
import { formatCVE } from "@/lib/utils";
import { descarregarCsv, gerarCsvFinanceiro } from "@/lib/csv";

type Periodo = "mes" | "mes_anterior" | "30d" | "90d" | "ano" | "custom";

const PERIODOS: { value: Periodo; label: string }[] = [
    { value: "mes", label: "Este mês" },
    { value: "mes_anterior", label: "Mês anterior" },
    { value: "30d", label: "Últimos 30 dias" },
    { value: "90d", label: "Últimos 90 dias" },
    { value: "ano", label: "Este ano" },
    { value: "custom", label: "Datas à escolha" },
];

const inputClass =
    "w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]";
const labelClass = "block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5";

// AAAA-MM-DD na hora local (toISOString usaria UTC e podia mudar o dia)
function paraIso(d: Date): string {
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
}

// Calcula o intervalo no momento do clique (e não durante a renderização)
function intervalo(periodo: Periodo, deCustom: string, ateCustom: string): { de: string; ate: string } {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    switch (periodo) {
        case "mes":
            return { de: paraIso(new Date(ano, mes, 1)), ate: paraIso(hoje) };
        case "mes_anterior":
            return { de: paraIso(new Date(ano, mes - 1, 1)), ate: paraIso(new Date(ano, mes, 0)) };
        case "30d":
            return { de: paraIso(new Date(ano, mes, hoje.getDate() - 29)), ate: paraIso(hoje) };
        case "90d":
            return { de: paraIso(new Date(ano, mes, hoje.getDate() - 89)), ate: paraIso(hoje) };
        case "ano":
            return { de: paraIso(new Date(ano, 0, 1)), ate: paraIso(hoje) };
        default:
            return { de: deCustom, ate: ateCustom };
    }
}

export default function RelatorioFinanceiroModal({ onClose }: { onClose: () => void }) {
    const [periodo, setPeriodo] = useState<Periodo>("mes");
    const [deCustom, setDeCustom] = useState("");
    const [ateCustom, setAteCustom] = useState("");
    const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    // Mudar o período invalida o resumo mostrado (já não corresponde ao que está escolhido)
    const alterar = (acao: () => void) => {
        acao();
        setRelatorio(null);
        setErro("");
    };

    const gerar = async () => {
        const { de, ate } = intervalo(periodo, deCustom, ateCustom);
        if (!de || !ate) {
            setErro("Escolha a data inicial e a final");
            return;
        }
        if (de > ate) {
            setErro("A data inicial não pode ser depois da final");
            return;
        }
        setErro("");
        setLoading(true);
        try {
            setRelatorio(await api.getRelatorioFinanceiro(de, ate));
        } catch (err) {
            setRelatorio(null);
            const mensagem = err instanceof Error ? err.message : "Erro ao gerar o relatório";
            setErro(mensagem);
            toast.error(mensagem);
        } finally {
            setLoading(false);
        }
    };

    const descarregar = () => {
        if (!relatorio) return;
        descarregarCsv(`relatorio-financeiro_${relatorio.de}_a_${relatorio.ate}.csv`, gerarCsvFinanceiro(relatorio.linhas));
        toast.success("Relatório descarregado");
    };

    return (
        <Modal
            titulo="Relatório Financeiro"
            onClose={onClose}
            rodape={
                <>
                    <button onClick={onClose} className="px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] hover:text-[#F2F2F2] hover:bg-[#404040] transition-all cursor-pointer">
                        Fechar
                    </button>
                    <button
                        onClick={gerar}
                        disabled={loading}
                        className="px-5 py-2.5 border border-[#FF6B00] text-[#FF6B00] rounded-md text-sm font-semibold hover:bg-[rgba(255,107,0,0.1)] disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {loading ? "A gerar..." : "Gerar relatório"}
                    </button>
                    <button
                        onClick={descarregar}
                        disabled={!relatorio || relatorio.resumo.quantidade === 0}
                        className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        Descarregar CSV
                    </button>
                </>
            }
        >
            <div>
                <label className={labelClass}>Período</label>
                <select
                    value={periodo}
                    onChange={(e) => alterar(() => setPeriodo(e.target.value as Periodo))}
                    className={`${inputClass} cursor-pointer`}
                >
                    {PERIODOS.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </div>

            {periodo === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>De</label>
                        <input type="date" value={deCustom} onChange={(e) => alterar(() => setDeCustom(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Até</label>
                        <input type="date" value={ateCustom} onChange={(e) => alterar(() => setAteCustom(e.target.value))} className={inputClass} />
                    </div>
                </div>
            )}

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            {relatorio && (
                <div className="space-y-3">
                    <p className="text-[#B0AEAA] text-sm">
                        {relatorio.resumo.quantidade === 0
                            ? "Sem pagamentos neste período."
                            : `${relatorio.resumo.quantidade} pagamento${relatorio.resumo.quantidade !== 1 ? "s" : ""} entre ${relatorio.de} e ${relatorio.ate}.`}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#2B2B2B] rounded-lg p-3">
                            <p className="text-[#B0AEAA] text-xs uppercase mb-1">Total pago</p>
                            <p className="text-[#22C55E] font-semibold font-mono-cve">{formatCVE(relatorio.resumo.total_pago)}</p>
                        </div>
                        <div className="bg-[#2B2B2B] rounded-lg p-3">
                            <p className="text-[#B0AEAA] text-xs uppercase mb-1">Por receber</p>
                            <p className="text-[#F59E0B] font-semibold font-mono-cve">{formatCVE(relatorio.resumo.total_pendente)}</p>
                        </div>
                        <div className="bg-[#2B2B2B] rounded-lg p-3">
                            <p className="text-[#B0AEAA] text-xs uppercase mb-1">Planos</p>
                            <p className="text-[#FF6B00] font-semibold font-mono-cve">{formatCVE(relatorio.resumo.pago_planos)}</p>
                        </div>
                        <div className="bg-[#2B2B2B] rounded-lg p-3">
                            <p className="text-[#B0AEAA] text-xs uppercase mb-1">Extras</p>
                            <p className="text-[#22C55E] font-semibold font-mono-cve">{formatCVE(relatorio.resumo.pago_extras)}</p>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}