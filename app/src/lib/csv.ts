import type { RelatorioLinha } from "@/services/api";
import { rotuloMetodo } from "@/lib/pagamentos";

const CABECALHO = ["Data", "Membro", "Descrição", "Tipo", "Valor", "Moeda", "Método", "Estado", "Vencimento", "Registado por"];

// Aspas à volta da célula quando tem separador, aspas ou quebra de linha
function escapar(texto: string): string {
    return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// Texto livre (nomes, descrições): o Excel executa como fórmula o que começa por = + - @,
// por isso essas células levam um apóstrofo à frente (proteção contra "injeção de fórmulas").
function celulaTexto(valor: string | null | undefined): string {
    let texto = valor ?? "";
    if (/^[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
    return escapar(texto);
}

// AAAA-MM-DD -> DD/MM/AAAA
function formatarData(iso: string | null | undefined): string {
    if (!iso) return "";
    const [ano, mes, dia] = iso.slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
}

// Vírgula decimal e sem separador de milhares: o Excel em português lê como número
function formatarValor(valor: number): string {
    return valor.toFixed(2).replace(".", ",");
}

const ESTADOS: Record<string, string> = { pago: "Pago", pendente: "Pendente" };

// Ficheiro CSV para o Excel: separador ";" e BOM UTF-8 (para os acentos aparecerem bem)
export function gerarCsvFinanceiro(linhas: RelatorioLinha[]): string {
    const corpo = linhas.map((l) =>
        [
            formatarData(l.data),
            celulaTexto(l.membro),
            celulaTexto(l.descricao),
            l.tipo,
            formatarValor(l.valor),
            celulaTexto(l.moeda),
            celulaTexto(rotuloMetodo(l.metodo_pagamento)),
            ESTADOS[l.status] ?? celulaTexto(l.status),
            formatarData(l.data_vencimento),
            celulaTexto(l.registado_por),
        ].join(";")
    );
    return "\uFEFF" + [CABECALHO.join(";"), ...corpo].join("\r\n") + "\r\n";
}

export function descarregarCsv(nomeArquivo: string, conteudo: string) {
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}