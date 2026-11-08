const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DIAS = 366; // limita o tamanho da resposta: no máximo 1 ano por relatório

function dataValida(texto) {
    if (typeof texto !== 'string' || !DATA_REGEX.test(texto)) return false;
    const d = new Date(texto + 'T12:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto; // recusa 2026-02-31
}

// GET /api/relatorios/financeiro?de=AAAA-MM-DD&ate=AAAA-MM-DD
// Lista os pagamentos do período. A data de cada linha é a do pagamento; nas faturas
// ainda por pagar (sem data de pagamento) usa-se a do vencimento.
router.get('/financeiro', auth, async (req, res) => {
    const { de, ate } = req.query;

    if (!dataValida(de) || !dataValida(ate)) {
        return res.status(400).json({ error: 'Datas inválidas (use AAAA-MM-DD)' });
    }
    if (de > ate) {
        return res.status(400).json({ error: 'A data inicial não pode ser depois da final' });
    }
    const dias = (new Date(ate + 'T12:00:00Z') - new Date(de + 'T12:00:00Z')) / 86400000;
    if (dias > MAX_DIAS) {
        return res.status(400).json({ error: 'O período máximo de um relatório é 1 ano' });
    }

    try {
        const gymId = req.user.gym_id || 1;
        const { rows } = await pool.query(
            `SELECT p.id,
              to_char(COALESCE(p.data_pagamento, p.data_vencimento), 'YYYY-MM-DD') AS data,
              u.nome AS membro,
              p.descricao,
              CASE WHEN p.assinatura_id IS NOT NULL THEN 'Plano' ELSE 'Extra' END AS tipo,
              p.valor,
              p.moeda,
              p.metodo_pagamento,
              p.status,
              to_char(p.data_vencimento, 'YYYY-MM-DD') AS data_vencimento,
              r.nome AS registado_por
       FROM pagamentos p
                LEFT JOIN usuarios u ON u.id = p.membro_id
                LEFT JOIN usuarios r ON r.id = p.registrado_por
       WHERE p.gym_id = $1
         AND COALESCE(p.data_pagamento, p.data_vencimento)::date BETWEEN $2::date AND $3::date
       ORDER BY COALESCE(p.data_pagamento, p.data_vencimento) DESC, p.id DESC`,
            [gymId, de, ate]
        );

        const linhas = rows.map((r) => ({ ...r, valor: parseFloat(r.valor) }));
        const soma = (filtro) => linhas.filter(filtro).reduce((s, l) => s + l.valor, 0);

        res.json({
            de,
            ate,
            resumo: {
                quantidade: linhas.length,
                total_pago: soma((l) => l.status === 'pago'),
                total_pendente: soma((l) => l.status === 'pendente'),
                pago_planos: soma((l) => l.status === 'pago' && l.tipo === 'Plano'),
                pago_extras: soma((l) => l.status === 'pago' && l.tipo === 'Extra'),
            },
            linhas,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar o relatório' });
    }
});

module.exports = router;