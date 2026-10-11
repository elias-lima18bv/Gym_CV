import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCVE(amount: number): string {
  return new Intl.NumberFormat("pt-CV", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " CVE";
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  // O Postgres pode devolver a coluna DATE como "1995-12-18" ou, depois de
  // passar pelo driver pg + JSON, como ISO completo "1995-12-18T00:00:00.000Z".
  // Pegamos só os primeiros 10 caracteres (AAAA-MM-DD) antes de anexar o
  // horário fixo — assim funciona nos dois casos, sem duplicar o "T".
  const datePart = dateStr.slice(0, 10);
  const d = new Date(datePart + "T12:00:00");
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthName(month: number): string {
  const names = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return names[month];
}

export function getDayName(day: number): string {
  const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sabado"];
  return names[day];
}

export function getShortDayName(day: number): string {
  const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return names[day];
}

export function generateQRData(memberId: string): string {
  return `GYM-${memberId}-${Date.now()}`;
}
