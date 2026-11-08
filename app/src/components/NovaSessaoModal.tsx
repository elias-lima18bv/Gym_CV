import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import { api } from "@/services/api";
import type { ResumoSessoes, Sessao, Treinador } from "@/services/api";
import SessaoItem from "@/components/SessaoItem";
import { DURACOES, TIPOS_TREINO } from "@/lib/sessoes";
import { alterarEstadoSessao } from "@/lib/sessoesAcoes";
import type { NovoEstado } from "@/lib/sessoesAcoes";

interface MembroOpcao {
    id: number;
    nome: string;
    status: string;
}

type Aba = "agendar" | "lista";
type Erros = Partial<Record<"atleta" | "tipo" | "data" | "hora" | "observacoes", string>>;

const inputClass =
    "w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]";
const labelClass = "block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5";
const MAX_OBSERVACOES = 500;

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

// AAAA-MM-DD na hora local (toISOString usaria UTC e podia mudar o dia)
function paraIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NovaSessaoModal({ onClose }: { onClose: () => void }) {
    const [aba, setAba] = useState<Aba>("agendar");
    const [hoje] = useState(() => paraIso(new Date())); // limite mínimo do campo "Data"

    const [membros, setMembros] = useState<MembroOpcao[] | null>(null);
    const [treinadores, setTreinadores] = useState<Treinador[] | null>(null);
    const [sessoes, setSessoes] = useState<Sessao[] | null>(null);
    const [resumo, setResumo] = useState<ResumoSessoes | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [erroCarga, setErroCarga] = useState(false); // falhou o carregamento de atletas/treinadores

    const [membroId, setMembroId] = useState("");
    const [tipo, setTipo] = useState("");
    const [treinadorId, setTreinadorId] = useState("");
    const [data, setData] = useState("");
    const [hora, setHora] = useState("");
    const [duracao, setDuracao] = useState("60");
    const [observacoes, setObservacoes] = useState("");
    const [erros, setErros] = useState<Erros>({});
    const [erroGeral, setErroGeral] = useState("");
    const [saving, setSaving] = useState(false);
    const [acaoEmCurso, setAcaoEmCurso] = useState<number | null>(null);

    // Atletas e treinadores: carrega uma vez
    useEffect(() => {
        let cancelado = false;
        Promise.all([api.getMembros(), api.getTreinadores()])
            .then(([listaMembros, listaTreinadores]) => {
                if (cancelado) return;
                setMembros(listaMembros);
                setTreinadores(listaTreinadores);
            })
            .catch((err: unknown) => {
                if (cancelado) return;
                setMembros([]);
                setTreinadores([]);
                setErroCarga(true);
                toast.error(err instanceof Error ? err.message : "Erro ao carregar atletas e treinadores");
            });
        return () => {
            cancelado = true;
        };
    }, []);

    // Sessões agendadas e resumo: recarrega sempre que algo muda (refreshKey sobe)
    useEffect(() => {
        let cancelado = false;
        Promise.all([api.getSessoes("agendada"), api.getResumoSessoes()])
            .then(([listaSessoes, dadosResumo]) => {
                if (cancelado) return;
                setSessoes(listaSessoes);
                setResumo(dadosResumo);
            })
            .catch((err: unknown) => {
                if (cancelado) return;
                setSessoes((atual) => atual ?? []);
                toast.error(err instanceof Error ? err.message : "Erro ao carregar as sessões");
            });
        return () => {
            cancelado = true;
        };
    }, [refreshKey]);

    const atletas = (membros ?? []).filter((m) => m.status === "ativo");
    const carregando = membros === null || treinadores === null;

    const agendar = async () => {
        const novos: Erros = {};
        if (!membroId) novos.atleta = "Escolha o atleta";
        if (!tipo) novos.tipo = "Escolha o tipo de treino";
        if (!data) novos.data = "Escolha a data";
        else if (data < hoje) novos.data = "A data não pode ser no passado";
        if (!hora) novos.hora = "Escolha a hora";
        else if (data === hoje) {
            const agora = new Date();
            const atual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
            if (hora < atual) novos.hora = "Essa hora já passou";
        }
        if (observacoes.length > MAX_OBSERVACOES) novos.observacoes = `Máximo ${MAX_OBSERVACOES} caracteres`;
        setErros(novos);
        setErroGeral("");
        if (Object.keys(novos).length > 0) return;

        setSaving(true);
        try {
            await api.createSessao({
                membro_id: Number(membroId),
                treinador_id: treinadorId ? Number(treinadorId) : null,
                tipo_treino: tipo,
                data,
                hora,
                duracao_min: Number(duracao),
                observacoes: observacoes.trim(),
            });
            toast.success("Sessão agendada");
            // Limpa o formulário, atualiza a lista e mostra-a
            setMembroId("");
            setTipo("");
            setTreinadorId("");
            setData("");
            setHora("");
            setDuracao("60");
            setObservacoes("");
            setRefreshKey((k) => k + 1);
            setAba("lista");
        } catch (err) {
            // Ex.: "O treinador já tem uma sessão agendada nesse horário"
            const mensagem = err instanceof Error ? err.message : "Erro ao agendar a sessão";
            setErroGeral(mensagem);
            toast.error(mensagem);
        } finally {
            setSaving(false);
        }
    };

    const mudarEstado = async (sessao: Sessao, estado: NovoEstado) => {
        setAcaoEmCurso(sessao.id);
        const alterou = await alterarEstadoSessao(sessao, estado);
        setAcaoEmCurso(null);
        if (alterou) setRefreshKey((k) => k + 1);
    };

    const botaoAba = (chave: Aba, texto: string) => (
        <button
            type="button"
            onClick={() => setAba(chave)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                aba === chave ? "bg-[#FF6B00] text-white" : "text-[#B0AEAA] hover:text-[#F2F2F2]"
            }`}
        >
            {texto}
        </button>
    );

    const botaoSecundario =
        "px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] hover:text-[#F2F2F2] hover:bg-[#404040] transition-all cursor-pointer";
    const botaoPrimario =
        "px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer";

    return (
        <Modal
            titulo="Sessões de Treino"
            onClose={onClose}
            larga
            rodape={
                aba === "agendar" ? (
                    <>
                        <button onClick={onClose} className={botaoSecundario}>
                            Fechar
                        </button>
                        <button onClick={agendar} disabled={saving || carregando || erroCarga} className={botaoPrimario}>
                            {saving ? "A agendar..." : "Agendar sessão"}
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={onClose} className={botaoSecundario}>
                            Fechar
                        </button>
                        <button onClick={() => setAba("agendar")} className={botaoPrimario}>
                            Nova sessão
                        </button>
                    </>
                )
            }
        >
            <div className="flex bg-[#2B2B2B] rounded-md p-0.5">
                {botaoAba("agendar", "Agendar")}
                {botaoAba("lista", `Agendadas${resumo ? ` (${resumo.agendadas})` : ""}`)}
            </div>

            {aba === "agendar" ? (
                carregando ? (
                    <p className="text-[#B0AEAA] text-sm text-center py-6">Carregando...</p>
                ) : (
                    <>
                        <div>
                            <label className={labelClass}>Atleta *</label>
                            <select value={membroId} onChange={(e) => setMembroId(e.target.value)} className={`${inputClass} cursor-pointer`}>
                                <option value="">Selecionar atleta</option>
                                {atletas.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.nome}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={erros.atleta} />
                            {erroCarga ? (
                                <p className="text-red-500 text-xs mt-1">Não foi possível carregar os atletas. Feche a janela e tente outra vez.</p>
                            ) : (
                                atletas.length === 0 && (
                                    <p className="text-[#B0AEAA] text-xs mt-1">Não há membros ativos. Registe primeiro o atleta em Membros.</p>
                                )
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Tipo de treino *</label>
                                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${inputClass} cursor-pointer`}>
                                    <option value="">Selecionar tipo</option>
                                    {TIPOS_TREINO.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={erros.tipo} />
                            </div>
                            <div>
                                <label className={labelClass}>Treinador</label>
                                <select value={treinadorId} onChange={(e) => setTreinadorId(e.target.value)} className={`${inputClass} cursor-pointer`}>
                                    <option value="">Sem treinador atribuído</option>
                                    {(treinadores ?? []).map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className={labelClass}>Data *</label>
                                <input type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} className={inputClass} />
                                <FieldError message={erros.data} />
                            </div>
                            <div>
                                <label className={labelClass}>Hora *</label>
                                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputClass} />
                                <FieldError message={erros.hora} />
                            </div>
                            <div>
                                <label className={labelClass}>Duração</label>
                                <select value={duracao} onChange={(e) => setDuracao(e.target.value)} className={`${inputClass} cursor-pointer`}>
                                    {DURACOES.map((d) => (
                                        <option key={d} value={d}>
                                            {d} min
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Observações</label>
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                rows={2}
                                placeholder="Ex: foco em pernas, lesão no ombro..."
                                className={inputClass}
                            />
                            <FieldError message={erros.observacoes} />
                        </div>

                        {erroGeral && <p className="text-red-500 text-sm">{erroGeral}</p>}
                    </>
                )
            ) : (
                <>
                    {resumo && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#2B2B2B] rounded-lg p-3 text-center">
                                <p className="text-[#B0AEAA] text-xs uppercase mb-1">Próximas</p>
                                <p className="text-[#FF6B00] text-xl font-bold">{resumo.proximas}</p>
                            </div>
                            <div className="bg-[#2B2B2B] rounded-lg p-3 text-center">
                                <p className="text-[#B0AEAA] text-xs uppercase mb-1">Hoje</p>
                                <p className="text-[#F2F2F2] text-xl font-bold">{resumo.hoje}</p>
                            </div>
                            <div className="bg-[#2B2B2B] rounded-lg p-3 text-center">
                                <p className="text-[#B0AEAA] text-xs uppercase mb-1">Total</p>
                                <p className="text-[#F2F2F2] text-xl font-bold">{resumo.total}</p>
                            </div>
                        </div>
                    )}

                    {sessoes === null ? (
                        <p className="text-[#B0AEAA] text-sm text-center py-6">Carregando...</p>
                    ) : sessoes.length === 0 ? (
                        <p className="text-[#B0AEAA] text-sm text-center py-6">Não há sessões agendadas.</p>
                    ) : (
                        <div className="space-y-0">
                            {sessoes.map((s, i) => (
                                <SessaoItem
                                    key={s.id}
                                    sessao={s}
                                    ocupada={acaoEmCurso === s.id}
                                    ultima={i === sessoes.length - 1}
                                    onEstado={mudarEstado}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
}