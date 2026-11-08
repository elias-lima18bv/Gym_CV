const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { metodoPagamentoValido } = require('../utils/metodosPagamento');

const PERFIL_MEMBRO = 7;
const VALOR_MAXIMO = 10000000; // trava um engano de zeros a mais

// Aqui o método é obrigatório (num pagamento registado à mão faz parte do registo)
function metodoValido(metodo) {
    return typeof metodo === 'string' && metodo !== '' && metodoPagamentoValido(metodo);
}

// GET /api/pagamentos/pendentes — todas as faturas por pagar do ginásio
router.get('/pendentes', auth, async (req, res) => {
    try {
        const gymId = req.user.gym_id || 1;
        const { rows } = await pool.query(
            `SELECT p.id, p.membro_id, u.nome, p.descricao, p.valor,
                    to_char(p.data_vencimento, 'YYYY-MM-DD') AS data_vencimento,
                    (p.data_vencimento < CURRENT_DATE) AS vencida
             FROM pagamentos p
                      JOIN usuarios u ON u.id = p.membro_id
             WHERE p.gym_id = $1 AND p.status = 'pendente'
             ORDER BY p.data_vencimento ASC, p.id ASC`,
            [gymId]
        );
        res.json(rows.map((f) => ({ ...f, valor: parseFloat(f.valor) })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar faturas pendentes' });
    }
});

// POST /api/pagamentos/avulso — pagamento avulso (sem assinatura), já pago
// Conta como "Extras" no gráfico do dashboard.
router.post('/avulso', auth, async (req, res) => {
    const { membro_id, descricao, valor, metodo_pagamento } = req.body;
    const gymId = req.user.gym_id || 1;

    const membroId = Number(membro_id);
    if (!Number.isInteger(membroId) || membroId <= 0) {
        return res.status(400).json({ error: 'Escolha o membro' });
    }
    const texto = typeof descricao === 'string' ? descricao.trim() : '';
    if (texto.length < 3) {
        return res.status(400).json({ error: 'Descrição deve ter pelo menos 3 caracteres' });
    }
    if (texto.length > 200) {
        return res.status(400).json({ error: 'Descrição demasiado longa (máximo 200 caracteres)' });
    }
    const valorNumerico = Number(valor);
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).json({ error: 'Valor inválido' });
    }
    if (valorNumerico > VALOR_MAXIMO) {
        return res.status(400).json({ error: 'Valor demasiado alto' });
    }
    if (!metodoValido(metodo_pagamento)) {
        return res.status(400).json({ error: 'Método de pagamento inválido' });
    }

    try {
        const membro = await pool.query(
            'SELECT id FROM usuarios WHERE id = $1 AND gym_id = $2 AND perfil_id = $3',
            [membroId, gymId, PERFIL_MEMBRO]
        );
        if (membro.rows.length === 0) {
            return res.status(404).json({ error: 'Membro não encontrado' });
        }

        const { rows } = await pool.query(
            `INSERT INTO pagamentos
             (membro_id, assinatura_id, gym_id, descricao, valor, moeda, data_vencimento, data_pagamento,
              status, metodo_pagamento, registrado_por, created_at, updated_at)
             VALUES ($1, NULL, $2, $3, $4, 'CVE', CURRENT_DATE, NOW(), 'pago', $5, $6, NOW(), NOW())
                 RETURNING id, valor, status`,
            [membroId, gymId, texto, Math.round(valorNumerico * 100) / 100, metodo_pagamento, req.user.id]
        );
        res.status(201).json({ pagamento: { ...rows[0], valor: parseFloat(rows[0].valor) } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registar pagamento' });
    }
});

// POST /api/pagamentos/:id/pagar — dá como paga uma fatura pendente (o valor é o da fatura)
router.post('/:id/pagar', auth, async (req, res) => {
    const id = Number(req.params.id);
    const { metodo_pagamento } = req.body;
    const gymId = req.user.gym_id || 1;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Fatura inválida' });
    }
    if (!metodoValido(metodo_pagamento)) {
        return res.status(400).json({ error: 'Método de pagamento inválido' });
    }

    try {
        // Um único UPDATE condicionado ao estado: se dois operadores clicarem ao mesmo
        // tempo, só um consegue (o outro apanha 0 linhas) e a fatura nunca é paga duas vezes.
        const { rows } = await pool.query(
            `UPDATE pagamentos
             SET status = 'pago', data_pagamento = NOW(), metodo_pagamento = $1,
                 registrado_por = $2, updated_at = NOW()
             WHERE id = $3 AND gym_id = $4 AND status = 'pendente'
                 RETURNING id, valor, status`,
            [metodo_pagamento, req.user.id, id, gymId]
        );

        if (rows.length === 0) {
            const existe = await pool.query('SELECT status FROM pagamentos WHERE id = $1 AND gym_id = $2', [id, gymId]);
            if (existe.rows.length === 0) {
                return res.status(404).json({ error: 'Fatura não encontrada' });
            }
            return res.status(409).json({ error: 'Esta fatura já não está pendente' });
        }
        res.json({ pagamento: { ...rows[0], valor: parseFloat(rows[0].valor) } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registar o pagamento da fatura' });
    }
});

module.exports = router;