import {useMemo, useState} from "react";
import {useApp} from "@/context/AppContext";
import {AlertTriangle, CheckCircle, Clock, FileText, Plus, X} from "lucide-react";
import {formatCVE, formatDate} from "@/lib/utils";
import {toast} from "sonner";

export default function Billing() {
  const { invoices, members, addInvoice, updateInvoice } = useApp();
  const [filter, setFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    memberId: "",
    amount: "",
    dueDate: "",
    description: "",
  });

  const filteredInvoices = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const stats = useMemo(() => {
    const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const totalPending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
    const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    return { totalPaid, totalPending, totalOverdue };
  }, [invoices]);

  const handlePayInvoice = (id: string) => {
    updateInvoice(id, { status: "paid", paidDate: new Date().toISOString().split("T")[0] });
    toast.success("Pagamento registado!");
  };

  const handleAddInvoice = () => {
    if (!newInvoice.memberId || !newInvoice.amount || !newInvoice.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    addInvoice({
      memberId: newInvoice.memberId,
      amount: Number(newInvoice.amount),
      dueDate: newInvoice.dueDate,
      status: "pending",
      description: newInvoice.description || "Mensalidade",
    });
    toast.success("Fatura criada!");
    setShowAdd(false);
    setNewInvoice({ memberId: "", amount: "", dueDate: "", description: "" });
  };

  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-[#22C55E]" />
            <span className="text-[#B0AEAA] text-xs uppercase font-medium">Recebido</span>
          </div>
          <p className="text-[#22C55E] font-bold text-xl font-mono-cve">{formatCVE(stats.totalPaid)}</p>
        </div>
        <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-[#F59E0B]" />
            <span className="text-[#B0AEAA] text-xs uppercase font-medium">Pendente</span>
          </div>
          <p className="text-[#F59E0B] font-bold text-xl font-mono-cve">{formatCVE(stats.totalPending)}</p>
        </div>
        <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-[#EF4444]" />
            <span className="text-[#B0AEAA] text-xs uppercase font-medium">Em Atraso</span>
          </div>
          <p className="text-[#EF4444] font-bold text-xl font-mono-cve">{formatCVE(stats.totalOverdue)}</p>
        </div>
      </div>

      {/* Filters & Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1 bg-[#353535] border border-[#4A4A4A] rounded-lg p-0.5 overflow-x-auto">
          {[
            { key: "all", label: "Todas" },
            { key: "paid", label: "Pagas" },
            { key: "pending", label: "Pendentes" },
            { key: "overdue", label: "Atrasadas" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                filter === f.key ? "bg-[#FF6B00] text-white" : "text-[#B0AEAA] hover:text-[#F2F2F2]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 gradient-orange rounded-md text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Nova Fatura
        </button>
      </div>

      {/* Invoice Table */}
      <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#2B2B2B] text-[#B0AEAA] text-xs uppercase font-semibold">
                <th className="text-left px-4 py-3">Membro</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Descricao</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Vencimento</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acao</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#B0AEAA]">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma fatura encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const member = members.find((m) => m.id === inv.memberId);
                  return (
                    <tr key={inv.id} className="border-t border-[#4A4A4A] hover:bg-[#404040] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[#F2F2F2] text-sm">{member?.name ?? "Desconhecido"}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[#B0AEAA] text-xs">{inv.description}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[#F2F2F2] text-sm font-semibold font-mono-cve">{formatCVE(inv.amount)}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs ${inv.status === "overdue" ? "text-[#EF4444]" : "text-[#B0AEAA]"}`}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
                          inv.status === "paid"
                            ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]"
                            : inv.status === "overdue"
                            ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                            : "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]"
                        }`}>
                          {inv.status === "paid" ? "Paga" : inv.status === "overdue" ? "Atrasada" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => handlePayInvoice(inv.id)}
                            className="px-3 py-1 bg-[rgba(34,197,94,0.15)] text-[#22C55E] text-xs font-semibold rounded hover:bg-[rgba(34,197,94,0.25)] transition-all cursor-pointer"
                          >
                            Pagar
                          </button>
                        )}
                        {inv.status === "paid" && (
                          <span className="text-[#22C55E] text-xs">{inv.paidDate ? formatDate(inv.paidDate) : ""}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-[#353535] border border-[#4A4A4A] rounded-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-[#4A4A4A]">
              <h3 className="text-[#F2F2F2] font-semibold text-lg">Nova Fatura</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-[#B0AEAA] hover:text-[#F2F2F2] cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Membro *</label>
                <select value={newInvoice.memberId} onChange={(e) => setNewInvoice({ ...newInvoice, memberId: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer">
                  <option value="">Selecionar membro</option>
                  {activeMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Valor (CVE) *</label>
                <input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] font-mono-cve" placeholder="3500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Data de Vencimento *</label>
                <input type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Descricao</label>
                <input type="text" value={newInvoice.description} onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="Ex: Mensalidade Junho" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#4A4A4A]">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-[#4A4A4A] rounded-md text-sm font-medium text-[#B0AEAA] cursor-pointer hover:bg-[#404040]">Cancelar</button>
              <button onClick={handleAddInvoice} className="px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold cursor-pointer hover:brightness-110">Criar Fatura</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
