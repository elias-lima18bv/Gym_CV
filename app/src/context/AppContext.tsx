import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Member, MembershipPlan, Invoice, AttendanceRecord, TeamMember, GymArea } from "@/data/types";
import { members as initialMembers, membershipPlans as initialPlans, invoices as initialInvoices, attendanceRecords as initialAttendance, teamMembers as initialTeam, gymAreas } from "@/data/mockData";

interface AppState {
  members: Member[];
  plans: MembershipPlan[];
  invoices: Invoice[];
  attendance: AttendanceRecord[];
  team: TeamMember[];
}

interface AppContextType extends AppState {
  addMember: (member: Omit<Member, "id">) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addPlan: (plan: Omit<MembershipPlan, "id" | "membersCount">) => void;
  updatePlan: (id: string, updates: Partial<MembershipPlan>) => void;
  addInvoice: (invoice: Omit<Invoice, "id">) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  addAttendance: (record: Omit<AttendanceRecord, "id">) => void;
  addTeamMember: (member: Omit<TeamMember, "id">) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  getPlanById: (id: string) => MembershipPlan | undefined;
  getAreaById: (id: string) => import("@/data/types").GymArea | undefined;
  getTeamMemberById: (id: string) => TeamMember | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    members: initialMembers,
    plans: initialPlans,
    invoices: initialInvoices,
    attendance: initialAttendance,
    team: initialTeam,
  });

  const addMember = useCallback((member: Omit<Member, "id">) => {
    const newMember: Member = { ...member, id: `m${Date.now()}` };
    setState((s) => ({ ...s, members: [...s.members, newMember] }));
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    setState((s) => ({
      ...s,
      members: s.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));
  }, []);

  const addPlan = useCallback((plan: Omit<MembershipPlan, "id" | "membersCount">) => {
    const newPlan: MembershipPlan = { ...plan, id: `p${Date.now()}`, membersCount: 0 };
    setState((s) => ({ ...s, plans: [...s.plans, newPlan] }));
  }, []);

  const updatePlan = useCallback((id: string, updates: Partial<MembershipPlan>) => {
    setState((s) => ({
      ...s,
      plans: s.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const addInvoice = useCallback((invoice: Omit<Invoice, "id">) => {
    const newInvoice: Invoice = { ...invoice, id: `i${Date.now()}` };
    setState((s) => ({ ...s, invoices: [...s.invoices, newInvoice] }));
  }, []);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setState((s) => ({
      ...s,
      invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  }, []);

  const addAttendance = useCallback((record: Omit<AttendanceRecord, "id">) => {
    const newRecord: AttendanceRecord = { ...record, id: `at${Date.now()}` };
    setState((s) => ({ ...s, attendance: [newRecord, ...s.attendance] }));
  }, []);

  const addTeamMember = useCallback((member: Omit<TeamMember, "id">) => {
    const newMember: TeamMember = { ...member, id: `t${Date.now()}` };
    setState((s) => ({ ...s, team: [...s.team, newMember] }));
  }, []);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    setState((s) => ({
      ...s,
      team: s.team.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, []);

  const deleteTeamMember = useCallback((id: string) => {
    setState((s) => ({ ...s, team: s.team.filter((t) => t.id !== id) }));
  }, []);

  const getMemberById = useCallback(
    (id: string) => state.members.find((m) => m.id === id),
    [state.members]
  );

  const getPlanById = useCallback(
    (id: string) => state.plans.find((p) => p.id === id),
    [state.plans]
  );

  const getAreaById = useCallback(
    (id: string): GymArea | undefined => gymAreas.find((a) => a.id === id),
    []
  );

  const getTeamMemberById = useCallback(
    (id: string) => state.team.find((t) => t.id === id),
    [state.team]
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        addMember,
        updateMember,
        deleteMember,
        addPlan,
        updatePlan,
        addInvoice,
        updateInvoice,
        addAttendance,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        getMemberById,
        getPlanById,
        getAreaById,
        getTeamMemberById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
