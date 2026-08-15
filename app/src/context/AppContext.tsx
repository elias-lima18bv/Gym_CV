import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useState,
} from "react";
import type {
    AttendanceRecord,
    GymArea,
    Invoice,
    Member,
    MembershipPlan,
    TeamMember,
} from "@/data/types";
import {
    attendanceRecords as initialAttendance,
    gymAreas,
    invoices as initialInvoices,
    members as initialMembers,
    membershipPlans as initialPlans,
    teamMembers as initialTeam,
} from "@/data/mockData";

/* ========== TIPOS DO DASHBOARD ========== */

interface GraficoReceita {
    data: string;
    planos: number;
    extras: number;
}

interface AtividadeRecente {
    id: number;
    nome: string;
    foto_url: string | null;
    data_hora: string;
    metodo: string;
    tipo: string;
}

interface FaturaPendente {
    id: number;
    nome: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
}

interface DashboardStats {
    totalMembros: number;
    membrosAtivos: number;
    receitaMensal: number;
    pagamentosPendentes: { total: number; quantidade: number };
    graficoReceitas: GraficoReceita[];
    atividadeRecente: AtividadeRecente[];
    faturasPendentes: FaturaPendente[];
}

/* ========== TIPOS DO USER ========== */

interface Perfil {
    id: number;
    nome: string;
    nivel_acesso: number;
    permissoes: Record<string, string>;
}

interface User {
    id: number;
    nome: string;
    email: string;
    foto_url?: string;
    telefone?: string;
    gym_id?: number;
    perfil: Perfil;
}

/* ========== TIPOS DO ESTADO LOCAL ========== */

interface AppState {
    members: Member[];
    plans: MembershipPlan[];
    invoices: Invoice[];
    attendance: AttendanceRecord[];
    team: TeamMember[];
}

interface AppContextType extends AppState {
    user: User | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    can: (recurso: string, acao?: "view" | "create" | "edit" | "delete") => boolean;
    isAdmin: () => boolean;
    dashboardStats: DashboardStats | null;
    refreshDashboard: () => Promise<void>;
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
    getAreaById: (id: string) => GymArea | undefined;
    getTeamMemberById: (id: string) => TeamMember | undefined;
}

/* ========== CONTEXT ========== */

const AppContext = createContext<AppContextType | null>(null);
const API_URL = "http://localhost:5000/api";

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>({
        members: initialMembers,
        plans: initialPlans,
        invoices: initialInvoices,
        attendance: initialAttendance,
        team: initialTeam,
    });

    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                return null;
            }
        }

        return null;
    });

    const [isAuthLoading] = useState(false);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

    const login = useCallback((token: string, user: User) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setDashboardStats(null);
    }, []);

    const can = useCallback(
        (recurso: string, acao?: "view" | "create" | "edit" | "delete"): boolean => {
            if (!user?.perfil?.permissoes) return false;
            const nivel = user.perfil.permissoes[recurso];
            if (!nivel || nivel === "none") return false;
            if (nivel === "all" || nivel === "crud_global") return true;

            switch (acao) {
                case "view":
                    return [
                        "visualizar",
                        "crud_unidade",
                        "unidade",
                        "unidades",
                        "multi_unidade",
                        "registrar_visualizar",
                        "seus_alunos",
                        "seus_alunos_nutricao",
                        "proprio",
                        "proprios",
                        "resumo",
                        "limitado",
                    ].includes(nivel);
                case "create":
                    return ["registrar", "crud_unidade", "registrar_visualizar"].includes(nivel);
                case "edit":
                case "delete":
                    return ["crud_unidade", "crud_global"].includes(nivel);
                default:
                    return true;
            }
        },
        [user]
    );

    const isAdmin = useCallback(
        () => (user?.perfil?.nivel_acesso ?? 0) >= 5,
        [user]
    );

    const refreshDashboard = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Erro ao carregar dashboard");
            const data: DashboardStats = await res.json();
            setDashboardStats(data);
        } catch (err) {
            console.error("Dashboard error:", err);
        }
    }, []);

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

    const addPlan = useCallback(
        (plan: Omit<MembershipPlan, "id" | "membersCount">) => {
            const newPlan: MembershipPlan = {
                ...plan,
                id: `p${Date.now()}`,
                membersCount: 0,
            };
            setState((s) => ({ ...s, plans: [...s.plans, newPlan] }));
        },
        []
    );

    const updatePlan = useCallback(
        (id: string, updates: Partial<MembershipPlan>) => {
            setState((s) => ({
                ...s,
                plans: s.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
            }));
        },
        []
    );

    const addInvoice = useCallback((invoice: Omit<Invoice, "id">) => {
        const newInvoice: Invoice = { ...invoice, id: `i${Date.now()}` };
        setState((s) => ({ ...s, invoices: [...s.invoices, newInvoice] }));
    }, []);

    const updateInvoice = useCallback(
        (id: string, updates: Partial<Invoice>) => {
            setState((s) => ({
                ...s,
                invoices: s.invoices.map((i) =>
                    i.id === id ? { ...i, ...updates } : i
                ),
            }));
        },
        []
    );

    const addAttendance = useCallback(
        (record: Omit<AttendanceRecord, "id">) => {
            const newRecord: AttendanceRecord = { ...record, id: `at${Date.now()}` };
            setState((s) => ({ ...s, attendance: [newRecord, ...s.attendance] }));
        },
        []
    );

    const addTeamMember = useCallback((member: Omit<TeamMember, "id">) => {
        const newMember: TeamMember = { ...member, id: `t${Date.now()}` };
        setState((s) => ({ ...s, team: [...s.team, newMember] }));
    }, []);

    const updateTeamMember = useCallback(
        (id: string, updates: Partial<TeamMember>) => {
            setState((s) => ({
                ...s,
                team: s.team.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            }));
        },
        []
    );

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
                user,
                isAuthenticated: !!user,
                isAuthLoading,
                login,
                logout,
                can,
                isAdmin,
                dashboardStats,
                refreshDashboard,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider");
    return ctx;
}