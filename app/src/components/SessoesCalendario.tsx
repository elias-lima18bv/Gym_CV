import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import NovaSessaoModal from "@/components/NovaSessaoModal";
import SessaoItem from "@/components/SessaoItem";
import { api } from "@/services/api";
import type { ResumoSessoes, Sessao, Treinador } from "@/services/api";
import { formatDate } from "@/lib/utils";
import { DIAS_SEMANA_CURTOS, NOMES_MESES, celulasDoMes, intervaloDoMes, mesVizinho, paraIso } from "@/lib/calendario";
import { alterarEstadoSessao } from "@/lib/sessoesAcoes";
import type { NovoEstado } from "@/lib/sessoesAcoes";

// Os dados do mês guardam a que mês pertencem, para saber quando já não correspondem ao mês mostrado
interface DadosMes {
    chave: string;
    sessoes: Sessao[];
}

export default function SessoesCalendario() {
    const [hoje] = useState(() => paraIso(new Date()));
    const [ano, setAno] = useState(() => Number(hoje.slice(0, 4)));
    const [mes, setMes] = useState(() => Number(hoje.slice(5, 7)) - 1);
    const [selecionado, setSelecionado] = useState(hoje);
    const [filtroTreinador, setFiltroTreinador] = useState<number | null>(null);

    const [dados, setDados] = useState<DadosMes | null>(null);
    const [resumo, setResumo] = useState<ResumoSessoes | null>(null);
    const [treinadores, setTreinadores] = useState<Treinador[] | null>(null);
    const [erroChave, setErroChave] = useState<string | null>(null); // mês cujo carregamento falhou
    const [refreshKey, setRefreshKey] = useState(0);
    const [modalAberto, setModalAberto] = useState(false);
    const [acaoEmCurso, setAcaoEmCurso] = useState<number | null>(null);

    const chave = `${ano}-${mes}`;

    // Sessões do mês, resumo e treinadores: recarrega ao mudar de mês ou quando algo muda
    useEffect(() => {
        let cancelado = false;
        const { de, ate } = intervaloDoMes(ano, mes);
        const chaveDestes = `${ano}-${mes}`;
        Promise.all([api.getSessoes(undefined, de, ate), api.getResumoSessoes(), api.getTreinadores()])
            .then(([listaSessoes, dadosResumo, listaTreinadores]) => {
                if (cancelado) return;
                setDados({ chave: chaveDestes, sessoes: listaSessoes });
                setResumo(dadosResumo);
                setTreinadores(listaTreinadores);
                setErroChave(null);
            })
            .catch((err: unknown) => {
                if (cancelado) return;
                setErroChave(chaveDestes);
                toast.error(err instanceof Error ? err.message : "Erro ao carregar o calendário");
            });
        return () => {
            cancelado = true;
        };
    }, [ano, mes, refreshKey]);

    const aCarregar = dados === null || dados.chave !== chave;
    const falhou = erroChave === chave; // falhou o carregamento do mês que está a ser mostrado

    // Sessões do mês (do treinador escolhido, se houver filtro), agrupadas por dia
    const sessoesVisiveis = useMemo(() => {
        const todas = dados && dados.chave === chave ? dados.sessoes : [];
        return filtroTreinador === null ? todas : todas.filter((s) => s.treinador_id === filtroTreinador);
    }, [dados, chave, filtroTreinador]);

    const porDia = useMemo(() => {
        const mapa = new Map<string, Sessao[]>();
        for (const s of sessoesVisiveis) mapa.set(s.data, [...(mapa.get(s.data) ?? []), s]);
        return mapa;
    }, [sessoesVisiveis]);

    const celulas = useMemo(() => celulasDoMes(ano, mes), [ano, mes]);
    const concluidas = sessoesVisiveis.filter((s) => s.estado === "concluida").length;
    const faltas = sessoesVisiveis.filter((s) => s.estado === "faltou").length;
    const sessoesDoDia = porDia.get(selecionado) ?? [];

    const irParaMes = (sentido: 1 | -1) => {
        const novo = mesVizinho(ano, mes, sentido);
        setAno(novo.ano);
        setMes(novo.mes);
    };

    const irParaHoje = () => {
        setAno(Number(hoje.slice(0, 4)));
        setMes(Number(hoje.slice(5, 7)) - 1);
        setSelecionado(hoje);
    };

    const mudarEstado = async (sessao: Sessao, estado: NovoEstado) => {
        setAcaoEmCurso(sessao.id);
        const alterou = await alterarEstadoSessao(sessao, estado);
        setAcaoEmCurso(null);
        if (alterou) setRefreshKey((k) => k + 1);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setRefreshKey((k) => k + 1); // a janela pode ter agendado ou alterado sessões
    };

    const cartao = "bg-[#353535] border border-[#4A4A4A] rounded-xl p-4";

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[#F2F2F2] font-semibold text-lg">Sessões de treino</h2>
                <button
                    onClick={() => setModalAberto(true)}
                    className="flex items-center gap-2 px-3 py-2 gradient-orange rounded-md text-white text-xs font-semibold uppercase tracking-wide hover:brightness-110 transition-all cursor-pointer"
                >
                    <Plus size={14} />
                    Nova sessão
                </button>
            </div>

            {/* Números */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <div className={cartao}>
                    <p className="text-[#B0AEAA] text-xs uppercase font-medium tracking-wide mb-1">Próximas sessões</p>
                    <p className="text-[#FF6B00] text-2xl font-bold">{resumo ? resumo.proximas : "—"}</p>
                </div>
                <div className={cartao}>
                    <p className="text-[#B0AEAA] text-xs uppercase font-medium tracking-wide mb-1">Hoje</p>
                    <p className="text-[#F2F2F2] text-2xl font-bold">{resumo ? resumo.hoje : "—"}</p>
                </div>
                <div className={cartao}>
                    <p className="text-[#B0AEAA] text-xs uppercase font-medium tracking-wide mb-1">Treinadores</p>
                    <p className="text-[#F2F2F2] text-2xl font-bold">{treinadores ? treinadores.length : "—"}</p>
                </div>
                <div className={cartao}>
                    <p className="text-[#B0AEAA] text-xs uppercase font-medium tracking-wide mb-1">Presenças do mês</p>
                    <p className="text-[#F2F2F2] text-sm mt-2">
                        <span className="text-[#22C55E] font-semibold">{concluidas} concluídas</span>
                        <span className="text-[#B0AEAA]"> · </span>
                        <span className="text-[#F59E0B] font-semibold">{faltas} faltas</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Calendário */}
                <div className={`${cartao} xl:col-span-2`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[#F2F2F2] font-semibold">
                            {NOMES_MESES[mes]} {ano}
                        </h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => irParaMes(-1)} aria-label="Mês anterior" className="p-1.5 text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={irParaHoje} className="px-2.5 py-1 text-xs font-medium rounded-md border border-[#4A4A4A] text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer">
                                Hoje
                            </button>
                            <button onClick={() => irParaMes(1)} aria-label="Mês seguinte" className="p-1.5 text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {falhou && aCarregar ? (
                        <p className="text-red-500 text-sm text-center py-10">Não foi possível carregar o calendário. Recarregue a página e tente outra vez.</p>
                    ) : (
                        <div className={`transition-opacity ${aCarregar ? "opacity-50" : ""}`}>
                            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                                {DIAS_SEMANA_CURTOS.map((d) => (
                                    <div key={d} className="text-center text-[#B0AEAA] text-xs uppercase font-medium">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                                {celulas.map((c, i) => {
                                    if (!c) return <div key={`vazio-${i}`} />;
                                    const doDia = (porDia.get(c.iso) ?? []).filter((s) => s.estado !== "cancelada");
                                    const porFazer = doDia.some((s) => s.estado === "agendada");
                                    const eHoje = c.iso === hoje;
                                    const eSelecionado = c.iso === selecionado;
                                    return (
                                        <button
                                            key={c.iso}
                                            onClick={() => setSelecionado(c.iso)}
                                            aria-pressed={eSelecionado}
                                            aria-current={eHoje ? "date" : undefined}
                                            aria-label={`${c.dia} de ${NOMES_MESES[mes]}: ${doDia.length} sessões`}
                                            className={`min-h-[64px] rounded-lg border p-1.5 text-left flex flex-col justify-between transition-all cursor-pointer ${
                                                eSelecionado
                                                    ? "bg-[rgba(255,107,0,0.15)] border-[#FF6B00]"
                                                    : eHoje
                                                        ? "bg-[#2B2B2B] border-[#FF6B00]"
                                                        : "bg-[#2B2B2B] border-[#4A4A4A] hover:border-[rgba(255,107,0,0.4)]"
                                            }`}
                                        >
                                            <span className={`text-xs font-medium ${eHoje ? "text-[#FF6B00]" : "text-[#F2F2F2]"}`}>{c.dia}</span>
                                            {doDia.length > 0 && (
                                                <span
                                                    className={`self-end text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                        porFazer ? "bg-[rgba(255,107,0,0.2)] text-[#FF6B00]" : "bg-[rgba(34,197,94,0.2)] text-[#22C55E]"
                                                    }`}
                                                >
                          {doDia.length}
                        </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Treinadores */}
                <div className={cartao}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[#F2F2F2] font-semibold">Treinadores</h3>
                        {filtroTreinador !== null && (
                            <button onClick={() => setFiltroTreinador(null)} className="text-xs text-[#FF6B00] hover:underline cursor-pointer">
                                Ver todos
                            </button>
                        )}
                    </div>
                    {treinadores === null ? (
                        <p className="text-[#B0AEAA] text-sm py-4">{falhou ? "Não foi possível carregar os treinadores." : "Carregando..."}</p>
                    ) : treinadores.length === 0 ? (
                        <p className="text-[#B0AEAA] text-sm py-4">Sem treinadores ativos.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {treinadores.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setFiltroTreinador(filtroTreinador === t.id ? null : t.id)}
                                    aria-pressed={filtroTreinador === t.id}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left text-sm transition-all cursor-pointer ${
                                        filtroTreinador === t.id
                                            ? "bg-[rgba(255,107,0,0.15)] border-[#FF6B00] text-[#F2F2F2]"
                                            : "bg-[#2B2B2B] border-[#4A4A4A] text-[#F2F2F2] hover:border-[rgba(255,107,0,0.4)]"
                                    }`}
                                >
                                    <span className="truncate">{t.nome}</span>
                                    <span className="text-[#B0AEAA] text-xs shrink-0 ml-2">
                    {t.proximas} {t.proximas === 1 ? "sessão" : "sessões"}
                  </span>
                                </button>
                            ))}
                            <p className="text-[#B0AEAA] text-xs pt-1">Clique num treinador para ver só as sessões dele.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sessões do dia escolhido */}
            <div className={cartao}>
                <h3 className="text-[#F2F2F2] font-semibold mb-2">Sessões de {formatDate(selecionado)}</h3>
                {aCarregar ? (
                    <p className="text-[#B0AEAA] text-sm py-4">{falhou ? "Não foi possível carregar as sessões." : "Carregando..."}</p>
                ) : sessoesDoDia.length === 0 ? (
                    <p className="text-[#B0AEAA] text-sm py-4">Não há sessões neste dia.</p>
                ) : (
                    sessoesDoDia.map((s, i) => (
                        <SessaoItem
                            key={s.id}
                            sessao={s}
                            soHora
                            ocupada={acaoEmCurso === s.id}
                            ultima={i === sessoesDoDia.length - 1}
                            onEstado={mudarEstado}
                        />
                    ))
                )}
            </div>

            {modalAberto && <NovaSessaoModal onClose={fecharModal} />}
        </div>
    );
}