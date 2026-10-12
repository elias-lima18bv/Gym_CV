const { calcularCobranca } = require('./planos');

// Cria a assinatura de um membro E o pagamento correspondente.
// Recebe o "client" da transação de quem chama: se qualquer um dos dois INSERT
// falhar, quem chama faz ROLLBACK e nada fica gravado pela metade.
// O valor vem sempre do plano, nunca do cliente.
async function criarAssinaturaComPagamento(client, { membroId, plano, gymId, metodoPagamento, criadoPor }) {
    const { valor, periodo } = calcularCobranca(plano);
    const duracao = plano.duracao_dias ?? 30;
    const metodo = metodoPagamento || null;

    const { rows: [assinatura] } = await client.query(
        `INSERT INTO assinaturas
     (membro_id, plano_id, gym_id, data_inicio, data_fim, valor_pago, metodo_pagamento,
      status, auto_renovar, criado_por, created_at, updated_at)
     VALUES ($1,$2,$3,CURRENT_DATE,CURRENT_DATE + ($4 || ' days')::interval,$5,$6,'ativa',true,$7,NOW(),NOW())
     RETURNING id, data_inicio, data_fim, valor_pago`,
        [membroId, plano.id, gymId, duracao, valor, metodo, criadoPor]
    );

    // O pagamento fica registado como "pago" no momento (quem regista o plano recebe na receção)
    const descricao = `${plano.nome} - ${periodo === 'ano' ? 'anuidade' : 'mensalidade'}`;
    const { rows: [pagamento] } = await client.query(
        `INSERT INTO pagamentos
     (membro_id, assinatura_id, gym_id, descricao, valor, moeda, data_vencimento, data_pagamento,
      status, metodo_pagamento, registrado_por, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,CURRENT_DATE,NOW(),'pago',$7,$8,NOW(),NOW())
     RETURNING id, valor, status`,
        [membroId, assinatura.id, gymId, descricao, valor, plano.moeda || 'CVE', metodo, criadoPor]
    );

    return { assinatura, pagamento };
}

module.exports = { criarAssinaturaComPagamento };