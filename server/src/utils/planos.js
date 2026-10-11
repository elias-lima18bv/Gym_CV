// Regra única para decidir quanto cobrar por um plano.
// Planos com duração de 1 ano ou mais usam preco_anual (se estiver preenchido);
// os restantes usam preco_mensal.
function calcularCobranca(plano) {
    const duracao = Number(plano.duracao_dias ?? 30);
    const anual = duracao >= 365 && plano.preco_anual != null;

    return {
        valor: Number(anual ? plano.preco_anual : plano.preco_mensal),
        periodo: anual ? 'ano' : 'mês',
    };
}

module.exports = { calcularCobranca };