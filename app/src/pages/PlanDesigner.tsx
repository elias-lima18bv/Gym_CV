import {useState} from "react";
import {useApp} from "@/context/AppContext";
import {Check, Edit2, Layers, Plus, ToggleLeft, ToggleRight, X} from "lucide-react";
import {formatCVE} from "@/lib/utils";
import {gymAreas} from "@/data/mockData";
import {toast} from "sonner";
import type {MembershipPlan} from "@/data/types";

const billingCycles = [
  { key: "monthly", label: "Mensal" },
  { key: "quarterly", label: "Trimestral" },
  { key: "yearly", label: "Anual" },
];

const colorOptions = ["#FF6B00", "#3B82F6", "#22C55E", "#EF4444", "#8B5CF6", "#F59E0B", "#EC4899", "#14B8A6"];

export default function PlanDesigner() {
  const { plans, addPlan, updatePlan } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [formData, setFormData] = useState<Partial<MembershipPlan>>({
    name: "",
    description: "",
    price: 0,
    billingCycle: "monthly",
    areas: [],
    active: true,
    color: "#FF6B00",
  });

  const openModal = (plan?: MembershipPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ ...plan });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        billingCycle: "monthly",
        areas: [],
        active: true,
        color: "#FF6B00",
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.description || !formData.price || (formData.areas ?? []).length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (editingPlan) {
      updatePlan(editingPlan.id, formData);
      toast.success("Plano atualizado!");
    } else {
      addPlan(formData as Omit<MembershipPlan, "id" | "membersCount">);
      toast.success("Plano criado com sucesso!");
    }
    setShowModal(false);
  };

  const toggleArea = (areaId: string) => {
    const current = formData.areas ?? [];
    if (current.includes(areaId)) {
      setFormData({ ...formData, areas: current.filter((a) => a !== areaId) });
    } else {
      setFormData({ ...formData, areas: [...current, areaId] });
    }
  };

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-5">
        <p className="text-[#B0AEAA] text-sm">{plans.length} plano{plans.length !== 1 ? "s" : ""} configurado{plans.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold uppercase tracking-wide hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Plano</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,107,0,0.2)] hover:shadow-lg group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[4px] flex items-center justify-center"
                  style={{ backgroundColor: `${plan.color}20`, border: `2px solid ${plan.color}` }}
                >
                  <Layers size={18} style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="text-[#F2F2F2] font-semibold">{plan.name}</h3>
                  <p className="text-[#B0AEAA] text-xs">{billingCycles.find((c) => c.key === plan.billingCycle)?.label}</p>
                </div>
              </div>
              <button onClick={() => openModal(plan)} className="p-1.5 text-[#B0AEAA] hover:text-[#FF6B00] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                <Edit2 size={14} />
              </button>
            </div>

            <p className="text-[#B0AEAA] text-sm mb-3">{plan.description}</p>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-[#FF6B00] font-bold text-2xl font-mono-cve">{formatCVE(plan.price)}</span>
              <span className="text-[#B0AEAA] text-xs">/ {billingCycles.find((c) => c.key === plan.billingCycle)?.label.toLowerCase()}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {plan.areas.map((areaId) => {
                const area = gymAreas.find((a) => a.id === areaId);
                return (
                  <span key={areaId} className="px-2 py-0.5 bg-[#2B2B2B] border border-[#4A4A4A] rounded text-[#B0AEAA] text-[10px]">
                    {area?.name ?? areaId}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#4A4A4A]">
              <span className="text-[#B0AEAA] text-xs">{plan.membersCount} membro{plan.membersCount !== 1 ? "s" : ""}</span>
              <button
                onClick={() => updatePlan(plan.id, { active: !plan.active })}
                className="cursor-pointer"
              >
                {plan.active ? (
                  <ToggleRight size={22} className="text-[#22C55E]" />
                ) : (
                  <ToggleLeft size={22} className="text-[#4A4A4A]" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#353535] border border-[#4A4A4A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in scrollbar-thin">
            <div className="flex items-center justify-between p-5 border-b border-[#4A4A4A]">
              <h3 className="text-[#F2F2F2] font-semibold text-lg">{editingPlan ? "Editar Plano" : "Novo Plano"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Nome *</label>
                <input type="text" value={formData.name ?? ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="Ex: Premium" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Descricao *</label>
                <input type="text" value={formData.description ?? ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="Descricao do plano" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Preco (CVE) *</label>
                  <input type="number" value={formData.price ?? 0} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] font-mono-cve" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Ciclo</label>
                  <select value={formData.billingCycle ?? "monthly"} onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as MembershipPlan["billingCycle"] })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer">
                    {billingCycles.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                        formData.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#353535] scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Areas de Acesso *</label>
                <div className="grid grid-cols-2 gap-2">
                  {gymAreas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => toggleArea(area.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                        (formData.areas ?? []).includes(area.id)
                          ? "border-[#FF6B00] bg-[rgba(255,107,0,0.1)] text-[#FF6B00]"
                          : "border-[#4A4A4A] bg-[#2B2B2B] text-[#B0AEAA]"
                      }`}
                    >
                      {(formData.areas ?? []).includes(area.id) && <Check size={12} />}
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#4A4A4A]">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] cursor-pointer hover:bg-[#404040]">Cancelar</button>
              <button onClick={handleSave} className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold cursor-pointer hover:brightness-110">{editingPlan ? "Guardar" : "Criar Plano"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
