import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import { api } from "@/services/api";
import type { FaturaPendente } from "@/services/api";
import { formatCVE, formatDate } from "@/lib/utils";
import { METODOS_PAGAMENTO } from "@/lib/pagamentos";

interface MembroOpcao {
    id: number;
    nome: string;
    status: string;
}

type Aba = "fatura" | "avulso";
type Erros = Partial<Record<"fatura" | "membro" | "descricao" | "valor" | "metodo", string>>;

const inputClass =
    "w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer";
const labelClass = "block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5";

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

export default function ProcessarPagamentoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [aba, setAba] = useState<Aba>("fatura");
    const [faturas, setFaturas] = useState<FaturaPendente[] | null>(null);
    const [membros, setMembros] = useState<MembroOpcao[] | null>(null);
    const [faturaId, setFaturaId] = useState("");
    const [membroId, setMembroId] = useState("");
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [metodo, setMetodo] = useState("");
    const [erros, setErros] = useState<Erros>({});
    const [saving, setSaving] = useState(false);
    const [erroCarga, setErroCarga] = useState(false); // falhou o carregamento de faturas/membros

    useEffect(() => {
        let cancelado = false;
        Promise.all([api.getFaturasPendentes(), api.getMembros()])
            .then(([listaFaturas, listaMembros]) => {
                if (cancelado) return;
                setFaturas(listaFaturas);
                setMembros(listaMembros);
            })
            .catch((err: unknown) => {
                if (cancelado) return;
                setFaturas([]);
                setMembros([]);
                setErroCarga(true);
                toast.error(err instanceof Error ? err.message : "Erro ao carregar dados");
            });
        return () => {
            cancelado = true;
        };
    }, []);

    const carregando = faturas === null || membros === null;
    const faturaSelecionada = faturas?.find((f) => String(f.id) === faturaId);
    const membrosAtivos = (membros ?? []).filter((m) => m.status === "ativo");

    const mudarAba = (nova: Aba) => {
        setAba(nova);
        setErros({});
    };

    const confirmar = async () => {
        const novos: Erros = {};
        if (!metodo) novos.metodo = "Escolha o método de pagamento";

        const valorNumerico = Number(valor.replace(",", "."));
        if (aba === "fatura") {
            if (!faturaSelecionada) novos.fatura = "Escolha a fatura a pagar";
        } else {
            if (!membroId) novos.membro = "Escolha o membro";
            if (descricao.trim().length < 3) novos.descricao = "Descrição deve ter pelo menos 3 caracteres";
            if (!valor.trim() || !Number.isFinite(valorNumerico) || valorNumerico <= 0) novos.valor = "Indique um valor maior que zero";
        }
        setErros(novos);
        if (Object.keys(novos).length > 0) return;

        setSaving(true);
        try {
            if (aba === "fatura" && faturaSelecionada) {
                await api.pagarFatura(faturaSelecionada.id, metodo);
                toast.success(`Pagamento de ${formatCVE(faturaSelecionada.valor)} registado`);
            } else {
                await api.createPagamentoAvulso({
                    membro_id: Number(membroId),
                    descricao: descricao.trim(),
                    valor: valorNumerico,
                    metodo_pagamento: metodo,
                });
                toast.success(`Pagamento de ${formatCVE(valorNumerico)} registado`);
            }
            onSuccess();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao registar o pagamento");
        } finally {
            setSaving(false);
        }
    };

    const botaoAba = (chave: Aba, texto: string) => (
        <button
            type="button"
            onClick={() => mudarAba(chave)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                aba === chave ? "bg-[#FF6B00] text-white" : "text-[#B0AEAA] hover:text-[#F2F2F2]"
            }`}
        >
            {texto}
        </button>
    );

    return (
        <Modal
            titulo="Processar Pagamento"
            onClose={onClose}
            rodape={
                <>
                    <button onClick={onClose} className="px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] hover:text-[#F2F2F2] hover:bg-[#404040] transition-all cursor-pointer">
                        Cancelar
                    </button>
                    <button
                        onClick={confirmar}
                        disabled={saving || carregando || erroCarga || (aba === "fatura" && (faturas?.length ?? 0) === 0)}
                        className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {saving ? "A registar..." : aba === "fatura" ? "Confirmar pagamento" : "Registar pagamento"}
                    </button>
                </>
            }
        >
            <div className="flex bg-[#2B2B2B] rounded-md p-0.5">
                {botaoAba("fatura", "Fatura pendente")}
                {botaoAba("avulso", "Pagamento avulso")}
            </div>

            {carregando ? (
                <p className="text-[#B0AEAA] text-sm text-center py-6">Carregando...</p>
            ) : erroCarga ? (
                <p className="text-red-500 text-sm text-center py-6">Não foi possível carregar os dados. Feche a janela e tente outra vez.</p>
            ) : aba === "fatura" ? (
                faturas.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-[#B0AEAA] text-sm">Não há faturas pendentes para pagar.</p>
                        <p className="text-[#B0AEAA] text-xs mt-1">Para registar um pagamento recebido, use &quot;Pagamento avulso&quot;.</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className={labelClass}>Fatura *</label>
                            <select value={faturaId} onChange={(e) => setFaturaId(e.target.value)} className={inputClass}>
                                <option value="">Selecionar fatura</option>
                                {faturas.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.nome} - {f.descricao} - {formatCVE(f.valor)}
                                        {f.vencida ? " (vencida)" : ""}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={erros.fatura} />
                        </div>
                        {faturaSelecionada && (
                            <div className="bg-[#2B2B2B] rounded-lg p-3">
                                <p className="text-[#B0AEAA] text-xs uppercase mb-1">Valor a receber</p>
                                <p className="text-[#F59E0B] text-lg font-semibold font-mono-cve">{formatCVE(faturaSelecionada.valor)}</p>
                                <p className={`text-xs mt-1 ${faturaSelecionada.vencida ? "text-[#EF4444]" : "text-[#B0AEAA]"}`}>
                                    Vencimento: {formatDate(faturaSelecionada.data_vencimento)}
                                </p>
                            </div>
                        )}
                    </>
                )
            ) : (
                <>
                    <div>
                        <label className={labelClass}>Membro *</label>
                        <select value={membroId} onChange={(e) => setMembroId(e.target.value)} className={inputClass}>
                            <option value="">Selecionar membro</option>
                            {membrosAtivos.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.nome}
                                </option>
                            ))}
                        </select>
                        <FieldError message={erros.membro} />
                    </div>
                    <div>
                        <label className={labelClass}>Descrição *</label>
                        <input
                            type="text"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Ex: T-shirt do ginásio"
                            className={inputClass.replace(" cursor-pointer", "")}
                        />
                        <FieldError message={erros.descricao} />
                    </div>
                    <div>
                        <label className={labelClass}>Valor (CVE) *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0,00"
                            className={inputClass.replace(" cursor-pointer", "")}
                        />
                        <FieldError message={erros.valor} />
                    </div>
                </>
            )}

            {!carregando && !erroCarga && (aba === "avulso" || faturas.length > 0) && (
                <div>
                    <label className={labelClass}>Método de pagamento *</label>
                    <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={inputClass}>
                        <option value="">Selecionar método</option>
                        {METODOS_PAGAMENTO.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <FieldError message={erros.metodo} />
                </div>
            )}
        </Modal>
    );
}