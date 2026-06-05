import type {AttendanceRecord, GymArea, Invoice, Member, MembershipPlan, ScheduleSession, TeamMember} from "./types";

export const gymAreas: GymArea[] = [
  { id: "a1", name: "Musculacao", icon: "Dumbbell", capacity: 40, currentOccupancy: 18, description: "Area de musculacao completa" },
  { id: "a2", name: "Cardio", icon: "Heart", capacity: 25, currentOccupancy: 12, description: "Esteiras, bicicletas e elipticos" },
  { id: "a3", name: "CrossFit", icon: "Flame", capacity: 20, currentOccupancy: 8, description: "Treino funcional e CrossFit" },
  { id: "a4", name: "Yoga", icon: "Sparkles", capacity: 15, currentOccupancy: 6, description: "Sala de yoga e meditacao" },
  { id: "a5", name: "Pilates", icon: "Activity", capacity: 12, currentOccupancy: 4, description: "Equipamentos de Pilates" },
  { id: "a6", name: "Luta", icon: "Swords", capacity: 16, currentOccupancy: 7, description: "Boxe, Muay Thai e Jiu-Jitsu" },
];

export const membershipPlans: MembershipPlan[] = [
  { id: "p1", name: "Basico", description: "Acesso a area de musculacao e cardio", price: 3500, billingCycle: "monthly", areas: ["a1", "a2"], active: true, color: "#3B82F6", membersCount: 68 },
  { id: "p2", name: "Premium", description: "Acesso a todas as areas do ginásio", price: 5500, billingCycle: "monthly", areas: ["a1", "a2", "a3", "a4", "a5", "a6"], active: true, color: "#FF6B00", membersCount: 52 },
  { id: "p3", name: "Estudante", description: "Plano especial para estudantes", price: 2500, billingCycle: "monthly", areas: ["a1", "a2", "a3"], active: true, color: "#22C55E", membersCount: 24 },
  { id: "p4", name: "Familia", description: "Plano familiar ate 4 pessoas", price: 12000, billingCycle: "monthly", areas: ["a1", "a2", "a3", "a4", "a5", "a6"], active: true, color: "#8B5CF6", membersCount: 8 },
  { id: "p5", name: "Trimestral Premium", description: "Plano trimestral com desconto", price: 14500, billingCycle: "quarterly", areas: ["a1", "a2", "a3", "a4", "a5", "a6"], active: true, color: "#F59E0B", membersCount: 4 },
  { id: "p6", name: "Anual VIP", description: "Plano anual com todos os beneficios", price: 55000, billingCycle: "yearly", areas: ["a1", "a2", "a3", "a4", "a5", "a6"], active: true, color: "#EF4444", membersCount: 3 },
];

export const members: Member[] = [
  { id: "m1", name: "Ana Silva", email: "ana.silva@email.cv", phone: "+238 912 345 678", planId: "p2", status: "active", joinDate: "2025-01-15", lastVisit: "2026-05-30", avatar: null, pin: "1234" },
  { id: "m2", name: "Carlos Mendes", email: "carlos.m@email.cv", phone: "+238 923 456 789", planId: "p1", status: "active", joinDate: "2025-02-20", lastVisit: "2026-05-29", avatar: null, pin: "5678" },
  { id: "m3", name: "Maria Fernandes", email: "maria.f@email.cv", phone: "+238 934 567 890", planId: "p3", status: "active", joinDate: "2025-03-10", lastVisit: "2026-05-31", avatar: null, pin: "9012" },
  { id: "m4", name: "Joao Santos", email: "joao.s@email.cv", phone: "+238 945 678 901", planId: "p2", status: "active", joinDate: "2025-01-05", lastVisit: "2026-05-28", avatar: null, pin: "3456" },
  { id: "m5", name: "Beatriz Lopes", email: "beatriz.l@email.cv", phone: "+238 956 789 012", planId: "p1", status: "inactive", joinDate: "2024-11-20", lastVisit: "2026-04-15", avatar: null, pin: "7890" },
  { id: "m6", name: "Pedro Goncalves", email: "pedro.g@email.cv", phone: "+238 967 890 123", planId: "p2", status: "active", joinDate: "2025-04-01", lastVisit: "2026-05-31", avatar: null, pin: "2345" },
  { id: "m7", name: "Sofia Rocha", email: "sofia.r@email.cv", phone: "+238 978 901 234", planId: "p4", status: "active", joinDate: "2025-02-15", lastVisit: "2026-05-30", avatar: null, pin: "6789" },
  { id: "m8", name: "Miguel Andrade", email: "miguel.a@email.cv", phone: "+238 989 012 345", planId: "p1", status: "active", joinDate: "2025-05-01", lastVisit: "2026-05-27", avatar: null, pin: "0123" },
  { id: "m9", name: "Laura Pires", email: "laura.p@email.cv", phone: "+238 990 123 456", planId: "p3", status: "active", joinDate: "2025-03-25", lastVisit: "2026-05-31", avatar: null, pin: "4567" },
  { id: "m10", name: "Rui Barros", email: "rui.b@email.cv", phone: "+238 901 234 567", planId: "p2", status: "inactive", joinDate: "2024-10-10", lastVisit: "2026-03-20", avatar: null, pin: "8901" },
  { id: "m11", name: "Catarina Neves", email: "catarina.n@email.cv", phone: "+238 912 345 679", planId: "p1", status: "active", joinDate: "2025-04-15", lastVisit: "2026-05-29", avatar: null, pin: "1111" },
  { id: "m12", name: "Tiago Vieira", email: "tiago.v@email.cv", phone: "+238 923 456 780", planId: "p2", status: "active", joinDate: "2025-01-20", lastVisit: "2026-05-30", avatar: null, pin: "2222" },
  { id: "m13", name: "Diana Correia", email: "diana.c@email.cv", phone: "+238 934 567 891", planId: "p5", status: "active", joinDate: "2025-06-01", lastVisit: "2026-05-31", avatar: null, pin: "3333" },
  { id: "m14", name: "Bruno Teixeira", email: "bruno.t@email.cv", phone: "+238 945 678 902", planId: "p1", status: "active", joinDate: "2025-05-10", lastVisit: "2026-05-31", avatar: null, pin: "4444" },
  { id: "m15", name: "Ines Duarte", email: "ines.d@email.cv", phone: "+238 956 789 013", planId: "p2", status: "active", joinDate: "2025-02-28", lastVisit: "2026-05-28", avatar: null, pin: "5555" },
  { id: "m16", name: "Filipe Cardoso", email: "filipe.c@email.cv", phone: "+238 967 890 124", planId: "p3", status: "active", joinDate: "2025-04-20", lastVisit: "2026-05-30", avatar: null, pin: "6666" },
  { id: "m17", name: "Raquel Martins", email: "raquel.m@email.cv", phone: "+238 978 901 235", planId: "p2", status: "active", joinDate: "2025-01-08", lastVisit: "2026-05-31", avatar: null, pin: "7777" },
  { id: "m18", name: "Andre Fonseca", email: "andre.f@email.cv", phone: "+238 989 012 346", planId: "p6", status: "active", joinDate: "2024-12-01", lastVisit: "2026-05-31", avatar: null, pin: "8888" },
  { id: "m19", name: "Mariana Reis", email: "mariana.r@email.cv", phone: "+238 990 123 457", planId: "p1", status: "active", joinDate: "2025-05-20", lastVisit: "2026-05-29", avatar: null, pin: "9999" },
  { id: "m20", name: "Goncalo Lima", email: "goncalo.l@email.cv", phone: "+238 901 234 568", planId: "p2", status: "active", joinDate: "2025-03-05", lastVisit: "2026-05-27", avatar: null, pin: "0000" },
];

export const teamMembers: TeamMember[] = [
  { id: "t1", name: "Ricardo Sousa", email: "ricardo@ginasio.cv", role: "admin", phone: "+238 912 000 001", avatar: null, status: "active" },
  { id: "t2", name: "Patricia Amaral", email: "patricia@ginasio.cv", role: "manager", phone: "+238 912 000 002", avatar: null, status: "active" },
  { id: "t3", name: "Daniel Costa", email: "daniel@ginasio.cv", role: "trainer", phone: "+238 912 000 003", avatar: null, status: "active" },
  { id: "t4", name: "Helena Matos", email: "helena@ginasio.cv", role: "trainer", phone: "+238 912 000 004", avatar: null, status: "active" },
  { id: "t5", name: "Sergio Pinheiro", email: "sergio@ginasio.cv", role: "trainer", phone: "+238 912 000 005", avatar: null, status: "inactive" },
  { id: "t6", name: "Carla Ribeiro", email: "carla@ginasio.cv", role: "receptionist", phone: "+238 912 000 006", avatar: null, status: "active" },
];

export const invoices: Invoice[] = [
  { id: "i1", memberId: "m5", amount: 5500, dueDate: "2026-05-15", status: "overdue", description: "Mensalidade Maio - Premium" },
  { id: "i2", memberId: "m10", amount: 5500, dueDate: "2026-05-15", status: "overdue", description: "Mensalidade Maio - Premium" },
  { id: "i3", memberId: "m1", amount: 5500, dueDate: "2026-06-15", status: "pending", description: "Mensalidade Junho - Premium" },
  { id: "i4", memberId: "m2", amount: 3500, dueDate: "2026-06-15", status: "pending", description: "Mensalidade Junho - Basico" },
  { id: "i5", memberId: "m3", amount: 2500, dueDate: "2026-06-15", status: "pending", description: "Mensalidade Junho - Estudante" },
  { id: "i6", memberId: "m4", amount: 5500, dueDate: "2026-06-15", status: "pending", description: "Mensalidade Junho - Premium" },
  { id: "i7", memberId: "m6", amount: 5500, dueDate: "2026-06-15", status: "pending", description: "Mensalidade Junho - Premium" },
  { id: "i8", memberId: "m7", amount: 12000, dueDate: "2026-06-15", status: "pending", description: "Mensalidade Junho - Familia" },
  { id: "i9", memberId: "m11", amount: 3500, dueDate: "2026-06-01", status: "paid", description: "Mensalidade Junho - Basico", paidDate: "2026-06-01" },
  { id: "i10", memberId: "m12", amount: 5500, dueDate: "2026-06-01", status: "paid", description: "Mensalidade Junho - Premium", paidDate: "2026-06-01" },
  { id: "i11", memberId: "m15", amount: 5500, dueDate: "2026-06-01", status: "paid", description: "Mensalidade Junho - Premium", paidDate: "2026-06-02" },
  { id: "i12", memberId: "m17", amount: 5500, dueDate: "2026-06-01", status: "paid", description: "Mensalidade Junho - Premium", paidDate: "2026-06-03" },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: "at1", memberId: "m1", areaId: "a1", timestamp: "2026-05-31T08:30:00", method: "qr" },
  { id: "at2", memberId: "m6", areaId: "a2", timestamp: "2026-05-31T08:45:00", method: "qr" },
  { id: "at3", memberId: "m3", areaId: "a3", timestamp: "2026-05-31T09:00:00", method: "pin" },
  { id: "at4", memberId: "m4", areaId: "a1", timestamp: "2026-05-31T09:15:00", method: "qr" },
  { id: "at5", memberId: "m14", areaId: "a2", timestamp: "2026-05-31T09:30:00", method: "qr" },
  { id: "at6", memberId: "m9", areaId: "a4", timestamp: "2026-05-31T10:00:00", method: "pin" },
  { id: "at7", memberId: "m16", areaId: "a1", timestamp: "2026-05-31T10:15:00", method: "qr" },
  { id: "at8", memberId: "m18", areaId: "a6", timestamp: "2026-05-31T10:30:00", method: "qr" },
  { id: "at9", memberId: "m20", areaId: "a1", timestamp: "2026-05-31T11:00:00", method: "qr" },
  { id: "at10", memberId: "m19", areaId: "a2", timestamp: "2026-05-31T11:15:00", method: "pin" },
  { id: "at11", memberId: "m12", areaId: "a3", timestamp: "2026-05-31T14:00:00", method: "qr" },
  { id: "at12", memberId: "m7", areaId: "a5", timestamp: "2026-05-31T14:30:00", method: "qr" },
  { id: "at13", memberId: "m1", areaId: "a2", timestamp: "2026-05-31T15:00:00", method: "qr" },
  { id: "at14", memberId: "m4", areaId: "a6", timestamp: "2026-05-31T16:00:00", method: "pin" },
  { id: "at15", memberId: "m15", areaId: "a1", timestamp: "2026-05-31T16:30:00", method: "qr" },
];

export const scheduleSessions: ScheduleSession[] = [
  { id: "s1", title: "Musculacao Iniciante", trainerId: "t3", areaId: "a1", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", maxCapacity: 12, enrolled: 8 },
  { id: "s2", title: "HIIT Cardio", trainerId: "t4", areaId: "a2", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", maxCapacity: 15, enrolled: 10 },
  { id: "s3", title: "CrossFit WOD", trainerId: "t3", areaId: "a3", dayOfWeek: 1, startTime: "18:00", endTime: "19:00", maxCapacity: 16, enrolled: 14 },
  { id: "s4", title: "Yoga Flow", trainerId: "t4", areaId: "a4", dayOfWeek: 1, startTime: "19:00", endTime: "20:00", maxCapacity: 12, enrolled: 9 },
  { id: "s5", title: "Pilates", trainerId: "t4", areaId: "a5", dayOfWeek: 2, startTime: "07:00", endTime: "08:00", maxCapacity: 10, enrolled: 7 },
  { id: "s6", title: "Boxe Fitness", trainerId: "t3", areaId: "a6", dayOfWeek: 2, startTime: "18:00", endTime: "19:00", maxCapacity: 14, enrolled: 11 },
  { id: "s7", title: "Musculacao Avancado", trainerId: "t3", areaId: "a1", dayOfWeek: 2, startTime: "19:00", endTime: "20:00", maxCapacity: 10, enrolled: 6 },
  { id: "s8", title: "Spinning", trainerId: "t4", areaId: "a2", dayOfWeek: 3, startTime: "07:00", endTime: "08:00", maxCapacity: 15, enrolled: 12 },
  { id: "s9", title: "CrossFit WOD", trainerId: "t3", areaId: "a3", dayOfWeek: 3, startTime: "18:00", endTime: "19:00", maxCapacity: 16, enrolled: 13 },
  { id: "s10", title: "Yoga Relax", trainerId: "t4", areaId: "a4", dayOfWeek: 3, startTime: "19:00", endTime: "20:00", maxCapacity: 12, enrolled: 8 },
  { id: "s11", title: "Musculacao Iniciante", trainerId: "t3", areaId: "a1", dayOfWeek: 4, startTime: "07:00", endTime: "08:00", maxCapacity: 12, enrolled: 9 },
  { id: "s12", title: "Muay Thai", trainerId: "t3", areaId: "a6", dayOfWeek: 4, startTime: "18:00", endTime: "19:00", maxCapacity: 14, enrolled: 10 },
  { id: "s13", title: "Pilates Avancado", trainerId: "t4", areaId: "a5", dayOfWeek: 4, startTime: "19:00", endTime: "20:00", maxCapacity: 10, enrolled: 6 },
  { id: "s14", title: "HIIT Cardio", trainerId: "t4", areaId: "a2", dayOfWeek: 5, startTime: "07:00", endTime: "08:00", maxCapacity: 15, enrolled: 11 },
  { id: "s15", title: "CrossFit Team", trainerId: "t3", areaId: "a3", dayOfWeek: 5, startTime: "18:00", endTime: "19:00", maxCapacity: 16, enrolled: 15 },
  { id: "s16", title: "Jiu-Jitsu", trainerId: "t3", areaId: "a6", dayOfWeek: 5, startTime: "19:00", endTime: "20:00", maxCapacity: 14, enrolled: 9 },
  { id: "s17", title: "Yoga Manha", trainerId: "t4", areaId: "a4", dayOfWeek: 6, startTime: "09:00", endTime: "10:00", maxCapacity: 12, enrolled: 7 },
  { id: "s18", title: "Musculacao Livre", trainerId: "t3", areaId: "a1", dayOfWeek: 6, startTime: "10:00", endTime: "11:00", maxCapacity: 15, enrolled: 10 },
];

export const weeklyRevenue = [
  { label: "25/05", planRevenue: 42000, extraRevenue: 8500 },
  { label: "26/05", planRevenue: 38000, extraRevenue: 6200 },
  { label: "27/05", planRevenue: 45000, extraRevenue: 9800 },
  { label: "28/05", planRevenue: 51000, extraRevenue: 11200 },
  { label: "29/05", planRevenue: 48000, extraRevenue: 10500 },
  { label: "30/05", planRevenue: 55000, extraRevenue: 12500 },
  { label: "31/05", planRevenue: 72300, extraRevenue: 17450 },
];

export const monthlyRevenue = [
  { label: "Dez", planRevenue: 152000, extraRevenue: 28000 },
  { label: "Jan", planRevenue: 168000, extraRevenue: 32000 },
  { label: "Fev", planRevenue: 175000, extraRevenue: 35000 },
  { label: "Mar", planRevenue: 162000, extraRevenue: 31000 },
  { label: "Abr", planRevenue: 180000, extraRevenue: 38000 },
  { label: "Mai", planRevenue: 195000, extraRevenue: 42000 },
];
