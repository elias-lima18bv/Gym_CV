import {useMemo, useState} from "react";
import {useApp} from "@/context/AppContext";
import {Edit2, Eye, Filter, Plus, Search, Trash2, X} from "lucide-react";
import {formatCVE, formatDate, getInitials} from "@/lib/utils";
import {toast} from "sonner";
import type {Member} from "@/data/types";

type ModalMode = "add" | "edit" | "view" | null;

const emptyMember: Omit<Member, "id"> = {
  name: "",
  email: "",
  phone: "",
  planId: "",
  status: "active",
  joinDate: new Date().toISOString().split("T")[0],
  lastVisit: "",
  avatar: null,
  pin: "",
};

export default function Members() {
  const { members, plans, addMember, updateMember, deleteMember } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Omit<Member, "id">>(emptyMember);
  const [showFilters, setShowFilters] = useState(false);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        search === "" ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.includes(search);
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      const matchPlan = planFilter === "all" || m.planId === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [members, search, statusFilter, planFilter]);

  const openModal = (mode: ModalMode, member?: Member) => {
    setModalMode(mode);
    if (member) {
      setSelectedMember(member);
      setFormData({ ...member });
    } else {
      setSelectedMember(null);
      setFormData(emptyMember);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedMember(null);
    setFormData(emptyMember);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.planId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (modalMode === "add") {
      addMember(formData);
      toast.success("Membro registado com sucesso!");
    } else if (modalMode === "edit" && selectedMember) {
      updateMember(selectedMember.id, formData);
      toast.success("Membro atualizado com sucesso!");
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este membro?")) {
      deleteMember(id);
      toast.success("Membro removido com sucesso!");
    }
  };

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

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-5 p-3 bg-[#353535] border border-[#4A4A4A] rounded-xl animate-fade-in">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
          >
            <option value="all">Todos os estados</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
          >
            <option value="all">Todos os planos</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => { setStatusFilter("all"); setPlanFilter("all"); setSearch(""); }}
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
                <th className="text-right px-4 py-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#B0AEAA]">
                    <p className="text-sm">Nenhum membro encontrado</p>
                    <p className="text-xs mt-1">Tente ajustar os filtros de pesquisa</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const plan = plans.find((p) => p.id === m.planId);
                  return (
                    <tr key={m.id} className="border-t border-[#4A4A4A] hover:bg-[#404040] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {getInitials(m.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#F2F2F2] text-sm font-medium truncate">{m.name}</p>
                            <p className="text-[#B0AEAA] text-xs truncate">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-[#F2F2F2]">{plan?.name ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-[#B0AEAA]">{formatDate(m.joinDate)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                            m.status === "active"
                              ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]"
                              : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                          }`}
                        >
                          {m.status === "active" ? "Ativo" : "Inativo"}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#4A4A4A] text-xs text-[#B0AEAA]">
          {filteredMembers.length} membro{filteredMembers.length !== 1 ? "s" : ""} encontrado{filteredMembers.length !== 1 ? "s" : ""}
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
              </h3>
              <button onClick={closeModal} className="p-1 text-[#B0AEAA] hover:text-[#F2F2F2] transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {modalMode === "view" && selectedMember ? (
                <ViewMember member={selectedMember} plans={plans} />
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[rgba(255,107,0,0.15)]"
                      placeholder="Nome do membro"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[rgba(255,107,0,0.15)]"
                      placeholder="email@exemplo.cv"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[rgba(255,107,0,0.15)]"
                      placeholder="+238 XXX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Plano *</label>
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                      className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
                    >
                      <option value="">Selecionar plano</option>
                      {plans.filter((p) => p.active).map((p) => (
                        <option key={p.id} value={p.id}>{p.name} - {formatCVE(p.price)}/mes</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">PIN de Check-in (4 digitos)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[rgba(255,107,0,0.15)]"
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Estado</label>
                    <div className="flex gap-3">
                      {(["active", "inactive"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFormData({ ...formData, status: s })}
                          className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                            formData.status === s
                              ? s === "active" ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[#EF4444]"
                              : "bg-[#2B2B2B] border border-[#4A4A4A] text-[#B0AEAA]"
                          }`}
                        >
                          {s === "active" ? "Ativo" : "Inativo"}
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
                <button onClick={handleSave} className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer">
                  {modalMode === "add" ? "Registar" : "Guardar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewMember({ member, plans }: { member: Member; plans: import("@/data/types").MembershipPlan[] }) {
  const plan = plans.find((p) => p.id === member.planId);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-bold text-xl">
          {getInitials(member.name)}
        </div>
        <div>
          <h4 className="text-[#F2F2F2] font-semibold text-lg">{member.name}</h4>
          <p className="text-[#B0AEAA] text-sm">{member.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#2B2B2B] rounded-lg p-3">
          <p className="text-[#B0AEAA] text-xs uppercase mb-1">Plano</p>
          <p className="text-[#F2F2F2] text-sm font-medium">{plan?.name ?? "-"}</p>
        </div>
        <div className="bg-[#2B2B2B] rounded-lg p-3">
          <p className="text-[#B0AEAA] text-xs uppercase mb-1">Telefone</p>
          <p className="text-[#F2F2F2] text-sm font-medium">{member.phone}</p>
        </div>
        <div className="bg-[#2B2B2B] rounded-lg p-3">
          <p className="text-[#B0AEAA] text-xs uppercase mb-1">Data de entrada</p>
          <p className="text-[#F2F2F2] text-sm font-medium">{formatDate(member.joinDate)}</p>
        </div>
        <div className="bg-[#2B2B2B] rounded-lg p-3">
          <p className="text-[#B0AEAA] text-xs uppercase mb-1">Ultima visita</p>
          <p className="text-[#F2F2F2] text-sm font-medium">{member.lastVisit ? formatDate(member.lastVisit) : "Nunca"}</p>
        </div>
      </div>
      <div className="bg-[#2B2B2B] rounded-lg p-3">
        <p className="text-[#B0AEAA] text-xs uppercase mb-1">Estado</p>
        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold uppercase rounded-full ${
          member.status === "active" ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
        }`}>
          {member.status === "active" ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}
