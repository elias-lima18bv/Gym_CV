export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  planId: string;
  status: "active" | "inactive";
  joinDate: string;
  lastVisit: string;
  avatar: string | null;
  pin: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "yearly";
  areas: string[];
  active: boolean;
  color: string;
  membersCount: number;
}

export interface GymArea {
  id: string;
  name: string;
  icon: string;
  capacity: number;
  currentOccupancy: number;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "trainer" | "receptionist";
  phone: string;
  avatar: string | null;
  status: "active" | "inactive";
}

export interface Invoice {
  id: string;
  memberId: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  description: string;
  paidDate?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  areaId: string;
  timestamp: string;
  method: "qr" | "pin";
}

export interface ScheduleSession {
  id: string;
  title: string;
  trainerId: string;
  areaId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  enrolled: number;
}

export interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}
