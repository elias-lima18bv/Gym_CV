// Os "value" são exatamente os aceites pela base de dados (restrição do método de pagamento).
// Se um dia a restrição mudar no banco, atualiza esta lista (e a de server/src/utils/pagamentos.js).
export const METODOS_PAGAMENTO = [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "transferencia", label: "Transferência" },
    { value: "cartao_credito", label: "Cartão de crédito" },
    { value: "cartao_debito", label: "Cartão de débito" },
    { value: "mbway", label: "MB Way" },
    { value: "paypal", label: "PayPal" },
];

export function rotuloMetodo(valor: string | null | undefined): string {
    if (!valor) return "";
    return METODOS_PAGAMENTO.find((m) => m.value === valor)?.label ?? valor;
}