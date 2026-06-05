import {useState} from "react";
import {useApp} from "@/context/AppContext";
import {Dumbbell, Mail, Phone, Shield, UserCheck, UserPlus, X} from "lucide-react";
import {getInitials} from "@/lib/utils";
import {toast} from "sonner";
import type {TeamMember} from "@/data/types";

const roleConfig = {
  admin: { label: "Administrador", icon: Shield, color: "#FF6B00" },
  manager: { label: "Gerente", icon: UserCheck, color: "#3B82F6" },
  trainer: { label: "Treinador", icon: Dumbbell, color: "#22C55E" },
  receptionist: { label: "Rececionista", icon: Mail, color: "#8B5CF6" },
};

export default function Team() {
  const { team, addTeamMember, updateTeamMember, deleteTeamMember } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "trainer" as TeamMember["role"],
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast.error("Preencha o nome e email");
      return;
    }
    addTeamMember({
      ...formData,
      avatar: null,
      status: "active",
    });
    toast.success("Membro da equipa adicionado!");
    setShowAdd(false);
    setFormData({ name: "", email: "", phone: "", role: "trainer" });
  };

  const toggleStatus = (id: string, current: TeamMember["status"]) => {
    updateTeamMember(id, { status: current === "active" ? "inactive" : "active" });
    toast.success(`Estado atualizado!`);
  };

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-5">
        <p className="text-[#B0AEAA] text-sm">{team.length} membro{team.length !== 1 ? "s" : ""} na equipa</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold uppercase tracking-wide hover:brightness-110 transition-all cursor-pointer"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Convidar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map((member) => {
          const config = roleConfig[member.role];
          const RoleIcon = config.icon;
          return (
            <div key={member.id} className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,107,0,0.2)]">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-[4px] flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: config.color }}>
                  {getInitials(member.name)}
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                  member.status === "active" ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                }`}>
                  {member.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>

              <h3 className="text-[#F2F2F2] font-semibold text-lg mb-0.5">{member.name}</h3>
              <div className="flex items-center gap-1.5 mb-3">
                <RoleIcon size={12} style={{ color: config.color }} />
                <span className="text-sm" style={{ color: config.color }}>{config.label}</span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-[#B0AEAA] text-xs">
                  <Mail size={12} />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#B0AEAA] text-xs">
                  <Phone size={12} />
                  <span>{member.phone}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#4A4A4A]">
                <button
                  onClick={() => toggleStatus(member.id, member.status)}
                  className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer bg-[#2B2B2B] border border-[#4A4A4A] text-[#B0AEAA] hover:text-[#F2F2F2]"
                >
                  {member.status === "active" ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => { if (confirm("Remover membro da equipa?")) { deleteTeamMember(member.id); toast.success("Removido!"); } }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-[#EF4444] bg-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.2)] transition-all cursor-pointer"
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-[#353535] border border-[#4A4A4A] rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-[#4A4A4A]">
              <h3 className="text-[#F2F2F2] font-semibold text-lg">Convidar para Equipa</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="email@ginasio.cv" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Telefone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="+238 XXX XXX XXX" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Funcao</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(roleConfig) as [TeamMember["role"], typeof roleConfig.admin][]).map(([role, config]) => (
                    <button
                      key={role}
                      onClick={() => setFormData({ ...formData, role })}
                      className={`flex items-center gap-2 p-2.5 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                        formData.role === role
                          ? "border-[#FF6B00] bg-[rgba(255,107,0,0.1)] text-[#FF6B00]"
                          : "border-[#4A4A4A] bg-[#2B2B2B] text-[#B0AEAA]"
                      }`}
                    >
                      <config.icon size={14} />
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#4A4A4A]">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] cursor-pointer hover:bg-[#404040]">Cancelar</button>
              <button onClick={handleSubmit} className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold cursor-pointer hover:brightness-110">Convidar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
