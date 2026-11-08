export const NOMES_MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// A semana começa à segunda-feira
export const DIAS_SEMANA_CURTOS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// AAAA-MM-DD na hora local (toISOString usaria UTC e podia mudar o dia)
export function paraIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface CelulaDia {
    dia: number;
    iso: string;
}

// As células de um mês, em semanas completas de segunda a domingo: null = espaço vazio.
// mes vai de 0 (janeiro) a 11 (dezembro).
export function celulasDoMes(ano: number, mes: number): (CelulaDia | null)[] {
    const antes = (new Date(ano, mes, 1).getDay() + 6) % 7; // getDay(): domingo = 0 -> passa a ser o 7.º dia
    const total = new Date(ano, mes + 1, 0).getDate();
    const celulas: (CelulaDia | null)[] = Array.from({ length: antes }, () => null);
    for (let dia = 1; dia <= total; dia++) {
        celulas.push({ dia, iso: paraIso(new Date(ano, mes, dia)) });
    }
    while (celulas.length % 7 !== 0) celulas.push(null);
    return celulas;
}

// Primeiro e último dia do mês, para pedir só esse período ao servidor
export function intervaloDoMes(ano: number, mes: number): { de: string; ate: string } {
    return { de: paraIso(new Date(ano, mes, 1)), ate: paraIso(new Date(ano, mes + 1, 0)) };
}

// O mês anterior (-1) ou seguinte (+1), a passar de dezembro para janeiro (e vice-versa) mudando o ano
export function mesVizinho(ano: number, mes: number, sentido: 1 | -1): { ano: number; mes: number } {
    const d = new Date(ano, mes + sentido, 1);
    return { ano: d.getFullYear(), mes: d.getMonth() };
}