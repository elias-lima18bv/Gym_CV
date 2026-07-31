import {useMemo, useState} from "react";
import {useApp} from "@/context/AppContext";
import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {AlertTriangle, BarChart3, CalendarPlus, CreditCard, DollarSign, UserCheck, UserPlus, Users} from "lucide-react";
import {formatCVE, formatDate, formatTime, getInitials} from "@/lib/utils";
import {monthlyRevenue, weeklyRevenue} from "@/data/mockData";
import {toast} from "sonner";
import * as React from "react";

const timePeriods = [
  { key: "7d", label: "7 Dias" },
  { key: "30d", label: "30 Dias" },
  { key: "90d", label: "90 Dias" },
  { key: "1y", label: "1 Ano" },
];

export default function Dashboard() {
  const { members, attendance, invoices } = useApp();
  const [period, setPeriod] = useState("7d");

  const stats = useMemo(() => {
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "active").length;
    const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
    const monthlyRevenueTotal = invoices
      .filter((i) => i.status === "paid" || i.status === "pending")
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingTotal = invoices
      .filter((i) => i.status === "overdue" || i.status === "pending")
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingCount = invoices.filter((i) => i.status === "overdue" || i.status === "pending").length;
    return { totalMembers, activeMembers, retentionRate, monthlyRevenueTotal, pendingTotal, pendingCount };
  }, [members, invoices]);

  const recentActivity = useMemo(() => {
    return attendance.slice(0, 8).map((a) => {
      const member = members.find((m) => m.id === a.memberId);
      return { ...a, memberName: member?.name ?? "Desconhecido" };
    });
  }, [attendance, members]);

  const pendingPayments = useMemo(() => {
    return invoices
      .filter((i) => i.status === "overdue" || i.status === "pending")
      .slice(0, 6)
      .map((i) => {
        const member = members.find((m) => m.id === i.memberId);
        return { ...i, memberName: member?.name ?? "Desconhecido" };
      });
  }, [invoices, members]);

  const chartData = period === "1y" ? monthlyRevenue : weeklyRevenue;

  const handleQuickAction = (action: string) => {
    toast.info(`${action} - Funcionalidade em desenvolvimento`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={22} className="text-[#B0AEAA]" />}
          label="Total de Membros"
          value={stats.totalMembers.toString()}
          subtext={`+${members.filter((m) => {
            const d = new Date(m.joinDate);
            return d.getMonth() === 4 && d.getFullYear() === 2026;
          }).length} este mes`}
          subtextColor="text-[#22C55E]"
        />
        <StatCard
          icon={<UserCheck size={22} className="text-[#22C55E]" />}
          label="Membros Ativos"
          value={stats.activeMembers.toString()}
          badge={`${stats.retentionRate}%`}
        />
        <StatCard
          icon={<DollarSign size={22} className="text-[#FF6B00]" />}
          label="Receita Mensal"
          value={formatCVE(stats.monthlyRevenueTotal)}
          valueColor="text-[#FF6B00]"
          subtext="+15% vs mes anterior"
          subtextColor="text-[#22C55E]"
          gradient
        />
        <StatCard
          icon={<AlertTriangle size={22} className="text-[#F59E0B]" />}
          label="Pagamentos Pendentes"
          value={formatCVE(stats.pendingTotal)}
          valueColor="text-[#F59E0B]"
          badge={`${stats.pendingCount} faturas`}
          badgeVariant="warning"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[#F2F2F2] font-semibold text-lg">Visão Geral de Receitas</h3>
            <p className="text-[#B0AEAA] text-sm">Acompanhe o desempenho financeiro do seu ginásio</p>
          </div>
          <div className="flex bg-[#2B2B2B] rounded-md p-0.5">
            {timePeriods.map((tp) => (
              <button
                key={tp.key}
                onClick={() => setPeriod(tp.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  period === tp.key
                    ? "bg-[#FF6B00] text-white"
                    : "text-[#B0AEAA] hover:text-[#F2F2F2]"
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={6} barCategoryGap={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" stroke="#B0AEAA" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#B0AEAA" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  background: "rgba(43,43,43,0.95)",
                  border: "1px solid #4A4A4A",
                  borderRadius: "8px",
                  color: "#F2F2F2",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  formatCVE(value),
                  name === "planRevenue" ? "Planos" : "Extras",
                ]}
              />
              <Legend
                formatter={(value: string) => (value === "planRevenue" ? "Planos" : "Extras")}
                wrapperStyle={{ fontSize: "12px", color: "#B0AEAA" }}
              />
              <Bar dataKey="planRevenue" fill="#FF6B00" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="extraRevenue" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#4A4A4A]">
          <div className="text-center">
            <div className="text-[#F2F2F2] font-semibold text-lg font-mono-cve">
              {formatCVE(chartData.reduce((s, d) => s + d.planRevenue + d.extraRevenue, 0))}
            </div>
            <div className="text-[#B0AEAA] text-xs">Receita Total</div>
          </div>
          <div className="text-center border-x border-[#4A4A4A]">
            <div className="text-[#FF6B00] font-semibold font-mono-cve">
              {formatCVE(chartData.reduce((s, d) => s + d.planRevenue, 0))}
            </div>
            <div className="text-[#B0AEAA] text-xs">Planos</div>
          </div>
          <div className="text-center">
            <div className="text-[#22C55E] font-semibold font-mono-cve">
              {formatCVE(chartData.reduce((s, d) => s + d.extraRevenue, 0))}
            </div>
            <div className="text-[#B0AEAA] text-xs">Extras</div>
          </div>
        </div>
      </div>

      {/* Activity + Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[#F2F2F2] font-semibold">Atividade Recente</h3>
              <span className="px-2 py-0.5 bg-[rgba(255,107,0,0.15)] text-[#FF6B00] text-[10px] font-semibold uppercase rounded-full">Hoje</span>
            </div>
          </div>
          <div className="space-y-0">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#B0AEAA] text-sm">Nenhuma atividade registrar hoje</p>
                <p className="text-[#B0AEAA] text-xs mt-1">Os membros aparecerao aqui quando fizerem check-in</p>
              </div>
            ) : (
              recentActivity.map((a, i) => (
                <div key={a.id} className={`flex items-center gap-3 py-2.5 ${i < recentActivity.length - 1 ? "border-b border-[#4A4A4A]" : ""}`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="w-8 h-8 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                    {getInitials(a.memberName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F2F2F2] text-sm truncate">{a.memberName}</p>
                    <p className="text-[#B0AEAA] text-xs">Check-in via {a.method === "qr" ? "QR" : "PIN"}</p>
                  </div>
                  <span className="text-[#B0AEAA] text-xs shrink-0">{formatTime(a.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[#F2F2F2] font-semibold">Pagamentos Pendentes</h3>
              <span className="px-2 py-0.5 bg-[rgba(245,158,11,0.15)] text-[#F59E0B] text-[10px] font-semibold uppercase rounded-full">
                {stats.pendingCount} pendentes
              </span>
            </div>
          </div>
          <div className="space-y-0">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#B0AEAA] text-sm">Nenhum pagamento pendente</p>
              </div>
            ) : (
              pendingPayments.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 py-2.5 ${i < pendingPayments.length - 1 ? "border-b border-[#4A4A4A]" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F2F2F2] text-sm font-medium truncate">{p.memberName}</p>
                    <p className="text-[#B0AEAA] text-xs truncate">{p.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#F59E0B] text-sm font-semibold font-mono-cve">{formatCVE(p.amount)}</p>
                    <p className={`text-xs ${p.status === "overdue" ? "text-[#EF4444]" : "text-[#B0AEAA]"}`}>
                      Venc {formatDate(p.dueDate)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-[#4A4A4A]">
            <p className="text-[#F59E0B] font-semibold text-sm">
              Total pendente: <span className="font-mono-cve">{formatCVE(stats.pendingTotal)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-[#F2F2F2] font-semibold text-lg mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <ActionCard icon={<UserPlus size={28} className="text-[#FF6B00]" />} title="Registar Membro" description="Adicione um novo membro ao ginasio" onClick={() => handleQuickAction("Registar Membro")} />
          <ActionCard icon={<CreditCard size={28} className="text-[#22C55E]" />} title="Processar Pagamento" description="Registe um novo pagamento" onClick={() => handleQuickAction("Processar Pagamento")} />
          <ActionCard icon={<CalendarPlus size={28} className="text-[#3B82F6]" />} title="Nova Sessao" description="Agende uma sessao de treino" onClick={() => handleQuickAction("Nova Sessão")} />
          <ActionCard icon={<BarChart3 size={28} className="text-[#F59E0B]" />} title="Gerar Relatorio" description="Exporte dados financeiros" onClick={() => handleQuickAction("Gerar Relatório")} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueColor = "text-[#F2F2F2]",
  subtext,
  subtextColor = "",
  badge,
  badgeVariant = "neutral",
  gradient = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  subtext?: string;
  subtextColor?: string;
  badge?: string;
  badgeVariant?: "neutral" | "warning";
  gradient?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        gradient
          ? "gradient-hero border-[rgba(255,107,0,0.15)]"
          : "bg-[#353535] border-[#4A4A4A] hover:border-[rgba(255,107,0,0.3)]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        {icon}
        {badge && (
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full ${
              badgeVariant === "warning"
                ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B]"
                : "bg-[#404040] text-[#B0AEAA]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-[#B0AEAA] text-xs uppercase font-medium tracking-wide mb-1">{label}</p>
      <p className={`text-2xl lg:text-3xl font-bold ${valueColor} font-mono-cve`}>{value}</p>
      {subtext && <p className={`text-xs mt-1 ${subtextColor}`}>{subtext}</p>}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-[#353535] border border-[#4A4A4A] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(255,107,0,0.2)] hover:shadow-lg cursor-pointer group"
    >
      <div className="mb-3 group-hover:scale-105 transition-transform">{icon}</div>
      <h4 className="text-[#F2F2F2] font-semibold mb-1">{title}</h4>
      <p className="text-[#B0AEAA] text-sm">{description}</p>
    </button>
  );
}
