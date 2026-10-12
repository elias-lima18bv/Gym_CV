// Valores aceites pela restrição "assinaturas_metodo_pagamento_check" da base de dados.
// Se um dia a restrição mudar no banco, é só atualizar esta lista (e a do Members.tsx).
const METODOS_PAGAMENTO = ['dinheiro', 'transferencia', 'cartao_credito', 'cartao_debito', 'mbway', 'paypal'];

// O método é opcional: vazio é aceite; se vier preenchido, tem de estar na lista.
function metodoPagamentoValido(metodo) {
    if (metodo === undefined || metodo === null || metodo === '') return true;
    return METODOS_PAGAMENTO.includes(metodo);
}

module.exports = { METODOS_PAGAMENTO, metodoPagamentoValido };