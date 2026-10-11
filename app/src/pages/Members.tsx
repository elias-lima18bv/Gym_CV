import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Edit2, Eye, Filter, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/services/api";

type ModalMode = "add" | "edit" | "view" | "plano" | null;

interface Plano {
  id: number;
  nome: string;
  preco_mensal: number;
  preco_anual: number;
  duracao_dias: number;
  preco_cobranca: number; // valor a cobrar, já calculado pelo backend
  periodo_cobranca: string; // 'mês' | 'ano'
}

interface Membro {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  bi: string;
  data_nascimento: string;
  genero: string;
  status: string; // 'ativo' | 'inativo'
  foto_url: string | null;
  qr_code: string;
  pin_checkin: string;
  created_at: string;
  assinatura_id: number | null;
  plano_id: number | null;
  plano_nome: string | null;
  data_inicio: string | null;
  data_fim: string | null;
}

interface FormState {
  nome: string;
  email: string;
  telefone: string;
  bi: string;
  data_nascimento: string;
  genero: string;
  status: string;
  plano_id: string;
}

const emptyForm: FormState = {
  nome: "",
  email: "",
  telefone: "",
  bi: "",
  data_nascimento: "",
  genero: "",
  status: "ativo",
  plano_id: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = Partial<Record<keyof FormState, string>>;

// Limites mínimos de cada campo — usados na validação E nas mensagens ao passar o rato,
// para os dois nunca ficarem diferentes. Para mudar um limite, basta alterar aqui.
const LIMITS = { nome: 3, telefone: 7, documento: 5 };

const HINTS = {
  nome: `Mínimo ${LIMITS.nome} caracteres`,
  email: "Formato válido: nome@dominio.cv",
  telefone: `Mínimo ${LIMITS.telefone} dígitos`,
  bi: `Mínimo ${LIMITS.documento} caracteres (BI, passaporte ou outro documento)`,
  data_nascimento: "Não pode ser uma data futura",
  genero: "Obrigatório",
  plano: "O valor é definido automaticamente pelo plano escolhido",
};

function validarMembro(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.nome.trim() || form.nome.trim().length < LIMITS.nome) errors.nome = `Nome deve ter pelo menos ${LIMITS.nome} caracteres`;
  if (!form.email || !EMAIL_REGEX.test(form.email)) errors.email = "Email inválido";
  if (!form.telefone || form.telefone.trim().length < LIMITS.telefone) errors.telefone = `Telefone deve ter pelo menos ${LIMITS.telefone} dígitos`;
  if (!form.bi || form.bi.trim().length < LIMITS.documento) errors.bi = `Número do documento deve ter pelo menos ${LIMITS.documento} caracteres`;
  if (!form.data_nascimento) errors.data_nascimento = "Data de nascimento é obrigatória";
  else if (new Date(form.data_nascimento) > new Date()) errors.data_nascimento = "Não pode ser no futuro";
  if (!form.genero) errors.genero = "Género é obrigatório";
  return errors;
}

// Mostra uma mensagem de ajuda quando o rato passa por cima do campo
function Hint({ text, children }: { text: string; children: ReactNode }) {
  return (
      <div className="relative group">
        {children}
        <div className="pointer-events-none absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-[#1F1F1F] border border-[#4A4A4A] text-[#F2F2F2] text-xs rounded-md px-2 py-1 shadow-lg">
          {text}
        </div>
      </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

function formatCVE(value: number) {
  return `${Number(value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })} CVE`;
}

export default function Members() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [planoForm, setPlanoForm] = useState({ plano_id: "", metodo_pagamento: "" });

  const fetchMembros = async () => {
    try {
      const data = await api.getMembros();
      setMembros(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar membros");
    }
  };

  const fetchPlanos = async () => {
    try {
      const data = await api.getPlanos();
      setPlanos(data);
    } catch {
      // Rota de planos pode ainda não existir no backend — não trava a tela de membros por causa disso
      setPlanos([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMembros(), fetchPlanos()]).finally(() => setLoading(false));
  }, []);

  // Libera a URL de preview da foto ao trocar ou desmontar, evitando vazamento de memória
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const filteredMembros = useMemo(() => {
    return membros.filter((m) => {
      const matchSearch =
          search === "" ||
          m.nome.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase()) ||
          m.telefone.includes(search);
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [membros, search, statusFilter]);

  const openModal = (mode: ModalMode, membro?: Membro) => {
    setModalMode(mode);
    setErrors({});
    setFotoFile(null);
    setFotoPreview(null);
    if (membro) {
      setSelectedMembro(membro);
      setFormData({
        nome: membro.nome,
        email: membro.email,
        telefone: membro.telefone,
        bi: membro.bi ?? "",
        data_nascimento: membro.data_nascimento ? membro.data_nascimento.split("T")[0] : "",
        genero: membro.genero ?? "",
        status: membro.status,
        plano_id: membro.plano_id ? String(membro.plano_id) : "",
      });
    } else {
      setSelectedMembro(null);
      setFormData(emptyForm);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedMembro(null);
    setFormData(emptyForm);
    setErrors({});
    setFotoFile(null);
    setFotoPreview(null);
  };

  const openPlanoModal = (membro: Membro) => {
    setSelectedMembro(membro);
    setPlanoForm({ plano_id: "", metodo_pagamento: "" });
    setModalMode("plano");
  };

  const handleAssignPlano = async () => {
    if (!selectedMembro) return;
    if (!planoForm.plano_id) {
      toast.error("Selecione um plano");
      return;
    }
    setSaving(true);
    try {
      const result = await api.assignPlano({
        membro_id: selectedMembro.id,
        plano_id: planoForm.plano_id,
        metodo_pagamento: planoForm.metodo_pagamento || undefined,
      });
      toast.success(`Plano "${result.plano_nome}" atribuído com sucesso!`);
      await fetchMembros();
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao trocar/renovar plano");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const validationErrors = validarMembro(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Corrija os campos destacados");
      return;
    }

    const body = new FormData();
    body.append("nome", formData.nome.trim());
    body.append("email", formData.email);
    body.append("telefone", formData.telefone);
    body.append("bi", formData.bi);
    body.append("data_nascimento", formData.data_nascimento);
    body.append("genero", formData.genero);
    body.append("status", formData.status);
    if (fotoFile) body.append("foto", fotoFile);

    if (modalMode === "add") {
      if (formData.plano_id) body.append("plano_id", formData.plano_id);
    }

    setSaving(true);
    try {
      if (modalMode === "add") {
        const result = await api.createMembro(body);
        toast.success(`Membro registado! Senha temporária: ${result.senha_temporaria}`);
      } else if (modalMode === "edit" && selectedMembro) {
        await api.updateMembro(selectedMembro.id, body);
        toast.success("Membro atualizado com sucesso!");
      }
      await fetchMembros();
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar membro";
      if (message.toLowerCase().includes("email")) setErrors((prev) => ({ ...prev, email: message }));
      else if (message.toLowerCase().includes("nome")) setErrors((prev) => ({ ...prev, nome: message }));
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja desativar este membro?")) return;
    try {
      await api.deleteMembro(id);
      toast.success("Membro desativado com sucesso!");
      await fetchMembros();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao desativar membro");
    }
  };

  // Plano escolhido em cada formulário — o "Valor Pago" é derivado dele, nunca digitado
  const planoNovo = planos.find((p) => String(p.id) === formData.plano_id);
  const planoTroca = planos.find((p) => String(p.id) === planoForm.plano_id);
  const formatValorPlano = (p?: Plano) => (p ? `${formatCVE(p.preco_cobranca)} / ${p.periodo_cobranca}` : "");

  return (
      <div className="p-4 lg:p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0AEAA]" />
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar membros..."
                className="w-full bg-[#353535] border border-[#4A4A4A] rounded-md pl-9 pr-4 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#B0AEAA] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[rgba(255,107,0,0.15)] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm font-medium transition-all cursor-pointer ${
                    showFilters ? "bg-[rgba(255,107,0,0.1)] border-[#FF6B00] text-[#FF6B00]" : "bg-[#353535] border-[#4A4A4A] text-[#B0AEAA] hover:text-[#F2F2F2]"
                }`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            <button
                onClick={() => openModal("add")}
                className="flex items-center gap-2 px-4 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold uppercase tracking-wide hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Membro</span>
            </button>
          </div>
        </div>

        {showFilters && (
            <div className="flex flex-wrap gap-3 mb-5 p-3 bg-[#353535] border border-[#4A4A4A] rounded-xl animate-fade-in">
              <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="all">Todos os estados</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
              <button
                  onClick={() => { setStatusFilter("all"); setSearch(""); }}
                  className="text-[#B0AEAA] text-sm hover:text-[#F2F2F2] transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
        )}

        {/* Table */}
        <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="bg-[#2B2B2B] text-[#B0AEAA] text-xs uppercase font-semibold">
                <th className="text-left px-4 py-3">Membro</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Plano</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Data</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
              </thead>
              <tbody>
              {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[#B0AEAA] text-sm">Carregando membros...</td></tr>
              ) : filteredMembros.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#B0AEAA]">
                      <p className="text-sm">Nenhum membro encontrado</p>
                      <p className="text-xs mt-1">Tente ajustar os filtros de pesquisa</p>
                    </td>
                  </tr>
              ) : (
                  filteredMembros.map((m) => (
                      <tr key={m.id} className="border-t border-[#4A4A4A] hover:bg-[#404040] transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {m.foto_url ? (
                                <img src={m.foto_url} alt={m.nome} className="w-8 h-8 rounded-[4px] object-cover shrink-0" />
                            ) : (
                                <div className="w-8 h-8 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                                  {getInitials(m.nome)}
                                </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[#F2F2F2] text-sm font-medium truncate">{m.nome}</p>
                              <p className="text-[#B0AEAA] text-xs truncate">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-[#F2F2F2]">{m.plano_nome ?? "-"}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-[#B0AEAA]">{formatDate(m.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                      <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                              m.status === "ativo" ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                          }`}
                      >
                        {m.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal("view", m)} className="p-1.5 text-[#B0AEAA] hover:text-[#3B82F6] transition-colors cursor-pointer"><Eye size={14} /></button>
                            <button onClick={() => openModal("edit", m)} className="p-1.5 text-[#B0AEAA] hover:text-[#FF6B00] transition-colors cursor-pointer"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(m.id)} className="p-1.5 text-[#B0AEAA] hover:text-[#EF4444] transition-colors cursor-pointer"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#4A4A4A] text-xs text-[#B0AEAA]">
            {filteredMembros.length} membro{filteredMembros.length !== 1 ? "s" : ""} encontrado{filteredMembros.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Modal */}
        {modalMode && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeModal} />
              <div className="relative bg-[#353535] border border-[#4A4A4A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in scrollbar-thin">
                <div className="flex items-center justify-between p-5 border-b border-[#4A4A4A]">
                  <h3 className="text-[#F2F2F2] font-semibold text-lg">
                    {modalMode === "add" && "Novo Membro"}
                    {modalMode === "edit" && "Editar Membro"}
                    {modalMode === "view" && "Detalhes do Membro"}
                    {modalMode === "plano" && "Trocar / Renovar Plano"}
                  </h3>
                  <button onClick={closeModal} className="p-1 text-[#B0AEAA] hover:text-[#F2F2F2] transition-colors cursor-pointer"><X size={20} /></button>
                </div>
                <div className="p-5 space-y-4">
                  {modalMode === "view" && selectedMembro ? (
                      <ViewMembro membro={selectedMembro} onChangePlano={() => openPlanoModal(selectedMembro)} />
                  ) : modalMode === "plano" && selectedMembro ? (
                      <div className="space-y-4">
                        <p className="text-[#B0AEAA] text-sm">
                          Atribuindo novo plano para <span className="text-[#F2F2F2] font-medium">{selectedMembro.nome}</span>.
                          {selectedMembro.plano_nome && (
                              <> O plano atual (<span className="text-[#F2F2F2]">{selectedMembro.plano_nome}</span>) será encerrado.</>
                          )}
                        </p>
                        <div>
                          <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Novo Plano *</label>
                          <select
                              value={planoForm.plano_id}
                              onChange={(e) => setPlanoForm({ ...planoForm, plano_id: e.target.value })}
                              className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                          >
                            <option value="">Selecionar plano</option>
                            {planos.map((p) => (
                                <option key={p.id} value={p.id}>{p.nome} - {formatCVE(p.preco_cobranca)}/{p.periodo_cobranca}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Valor a Pagar</label>
                            <Hint text={HINTS.plano}>
                              <input
                                  type="text"
                                  disabled
                                  value={formatValorPlano(planoTroca)}
                                  className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] opacity-70 cursor-not-allowed"
                                  placeholder="Selecione um plano"
                              />
                            </Hint>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Método Pagamento</label>
                            <input
                                type="text"
                                value={planoForm.metodo_pagamento}
                                onChange={(e) => setPlanoForm({ ...planoForm, metodo_pagamento: e.target.value })}
                                className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]"
                                placeholder="Ex: Dinheiro, Transferência"
                            />
                          </div>
                        </div>
                      </div>
                  ) : (
                      <>
                        {/* Foto */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-[#2B2B2B] border border-[#4A4A4A] flex items-center justify-center overflow-hidden shrink-0">
                            {fotoPreview ? (
                                <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : selectedMembro?.foto_url ? (
                                <img src={selectedMembro.foto_url} alt="Foto atual" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[#B0AEAA] text-xs">Sem foto</span>
                            )}
                          </div>
                          <label className="flex items-center gap-2 px-3 py-2 bg-[#2B2B2B] border border-[#4A4A4A] rounded-md text-sm text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer transition-colors">
                            <Upload size={14} />
                            Escolher foto
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Nome Completo *</label>
                          <Hint text={HINTS.nome}>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]"
                                placeholder="Nome do membro"
                            />
                          </Hint>
                          <FieldError message={errors.nome} />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Email *</label>
                          <Hint text={HINTS.email}>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]"
                                placeholder="email@exemplo.cv"
                            />
                          </Hint>
                          <FieldError message={errors.email} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Telefone *</label>
                            <Hint text={HINTS.telefone}>
                              <input
                                  type="tel"
                                  value={formData.telefone}
                                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                  className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]"
                                  placeholder="+238 XXX XXX XXX"
                              />
                            </Hint>
                            <FieldError message={errors.telefone} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Número Documento *</label>
                            <Hint text={HINTS.bi}>
                              <input
                                  type="text"
                                  value={formData.bi}
                                  onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                                  className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]"
                                  placeholder="Número do documento"
                              />
                            </Hint>
                            <FieldError message={errors.bi} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Data de Nascimento *</label>
                            <Hint text={HINTS.data_nascimento}>
                              <input
                                  type="date"
                                  value={formData.data_nascimento}
                                  onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                                  className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]"
                              />
                            </Hint>
                            <FieldError message={errors.data_nascimento} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Género *</label>
                            <Hint text={HINTS.genero}>
                              <select
                                  value={formData.genero}
                                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                                  className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                              >
                                <option value="">Selecionar</option>
                                <option value="masculino">Masculino</option>
                                <option value="feminino">Feminino</option>
                                <option value="outro">Outro</option>
                              </select>
                            </Hint>
                            <FieldError message={errors.genero} />
                          </div>
                        </div>

                        {modalMode === "add" && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Plano</label>
                                <select
                                    value={formData.plano_id}
                                    onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
                                    className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                                >
                                  <option value="">Sem plano por agora</option>
                                  {planos.map((p) => (
                                      <option key={p.id} value={p.id}>{p.nome} - {formatCVE(p.preco_cobranca)}/{p.periodo_cobranca}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Valor a Pagar</label>
                                <Hint text={HINTS.plano}>
                                  <input
                                      type="text"
                                      disabled
                                      value={formatValorPlano(planoNovo)}
                                      className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] opacity-70 cursor-not-allowed"
                                      placeholder="Selecione um plano"
                                  />
                                </Hint>
                              </div>
                            </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Estado</label>
                          <div className="flex gap-3">
                            {(["ativo", "inativo"] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: s })}
                                    className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                                        formData.status === s
                                            ? s === "ativo" ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[#EF4444]"
                                            : "bg-[#2B2B2B] border border-[#4A4A4A] text-[#B0AEAA]"
                                    }`}
                                >
                                  {s === "ativo" ? "Ativo" : "Inativo"}
                                </button>
                            ))}
                          </div>
                        </div>
                      </>
                  )}
                </div>
                {modalMode !== "view" && (
                    <div className="flex justify-end gap-3 p-5 border-t border-[#4A4A4A]">
                      <button onClick={closeModal} className="px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] hover:text-[#F2F2F2] hover:bg-[#404040] transition-all cursor-pointer">
                        Cancelar
                      </button>
                      <button
                          onClick={modalMode === "plano" ? handleAssignPlano : handleSave}
                          disabled={saving}
                          className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {saving ? "Salvando..." : modalMode === "add" ? "Registar" : modalMode === "plano" ? "Confirmar" : "Guardar"}
                      </button>
                    </div>
                )}
              </div>
            </div>
        )}
      </div>
  );
}

function ViewMembro({ membro, onChangePlano }: { membro: Membro; onChangePlano: () => void }) {
  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {membro.foto_url ? (
                <img src={membro.foto_url} alt={membro.nome} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
                <div className="w-16 h-16 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white font-bold text-xl">
                  {getInitials(membro.nome)}
                </div>
            )}
            <div>
              <h4 className="text-[#F2F2F2] font-semibold text-lg">{membro.nome}</h4>
              <p className="text-[#B0AEAA] text-sm">{membro.email}</p>
            </div>
          </div>
          <button
              onClick={onChangePlano}
              className="shrink-0 px-3 py-2 bg-[rgba(255,107,0,0.1)] border border-[#FF6B00] text-[#FF6B00] text-xs font-semibold uppercase rounded-md hover:bg-[rgba(255,107,0,0.2)] transition-all cursor-pointer"
          >
            {membro.plano_nome ? "Trocar Plano" : "Atribuir Plano"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="Plano" value={membro.plano_nome ?? "-"} />
          <InfoBox label="Telefone" value={membro.telefone} />
          <InfoBox label="BI" value={membro.bi} />
          <InfoBox label="Género" value={membro.genero === "masculino" ? "Masculino" : membro.genero === "feminino" ? "Feminino" : membro.genero === "outro" ? "Outro" : "-"} />
          <InfoBox label="Data de Nascimento" value={membro.data_nascimento ? formatDate(membro.data_nascimento) : "-"} />
          <InfoBox label="Início da Assinatura" value={membro.data_inicio ? formatDate(membro.data_inicio) : "-"} />
          <InfoBox label="Fim da Assinatura" value={membro.data_fim ? formatDate(membro.data_fim) : "-"} />
          <InfoBox label="PIN de Check-in" value={membro.pin_checkin} />
        </div>
        <div className="bg-[#2B2B2B] rounded-lg p-3">
          <p className="text-[#B0AEAA] text-xs uppercase mb-1">Estado</p>
          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold uppercase rounded-full ${
              membro.status === "ativo" ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
          }`}>
          {membro.status === "ativo" ? "Ativo" : "Inativo"}
        </span>
        </div>
      </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
      <div className="bg-[#2B2B2B] rounded-lg p-3">
        <p className="text-[#B0AEAA] text-xs uppercase mb-1">{label}</p>
        <p className="text-[#F2F2F2] text-sm font-medium">{value}</p>
      </div>
  );
}