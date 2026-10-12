const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const PERFIL_MEMBRO = 7; // mesma constante usada em membros.js

// Períodos do gráfico de receitas. Os valores são fixos (lista fechada abaixo) e
// só entram no SQL depois de validar a chave recebida, por isso não há risco de injeção.
//  - granularidade: cada barra do gráfico representa 1 dia, 1 semana ou 1 mês
//  - inicio: primeiro dia do período (entre parênteses por causa do "::date")
const PERIODOS = {
    '7d': { granularidade: 'day', inicio: '(CURRENT_DATE - 6)' },
    '30d': { granularidade: 'day', inicio: '(CURRENT_DATE - 29)' },
    '90d': { granularidade: 'week', inicio: '(CURRENT_DATE - 89)' },
    '1y': { granularidade: 'month', inicio: "((date_trunc('month', CURRENT_DATE) - interval '11 months')::date)" },
};

// GET /api/dashboard/stats — números dos cartões, atividade recente e faturas pendentes
router.get('/stats', auth, async (req, res) => {
    try {
        const gymId = req.user.gym_id || 1;

        const [
            totalMembros,
            novosMembros,
            membrosAtivos,
            receitaMes,
            receitaMesAnterior,
            pendentes,
            atividade,
            faturas,
        ] = await Promise.all([
            pool.query(
                `SELECT COUNT(*) FROM usuarios WHERE gym_id = $1 AND perfil_id = $2`,
                [gymId, PERFIL_MEMBRO]
            ),
            pool.query(
                `SELECT COUNT(*) FROM usuarios
         WHERE gym_id = $1 AND perfil_id = $2
           AND created_at >= date_trunc('month', CURRENT_DATE)`,
                [gymId, PERFIL_MEMBRO]
            ),
            pool.query(
                `SELECT COUNT(*) FROM usuarios
         WHERE gym_id = $1 AND perfil_id = $2 AND status = 'ativo'`,
                [gymId, PERFIL_MEMBRO]
            ),
            pool.query(
                `SELECT COALESCE(SUM(valor), 0) AS total FROM pagamentos
         WHERE gym_id = $1 AND status = 'pago'
           AND data_pagamento >= date_trunc('month', CURRENT_DATE)
           AND data_pagamento <  date_trunc('month', CURRENT_DATE) + interval '1 month'`,
                [gymId]
            ),
            pool.query(
                `SELECT COALESCE(SUM(valor), 0) AS total FROM pagamentos
         WHERE gym_id = $1 AND status = 'pago'
           AND data_pagamento >= date_trunc('month', CURRENT_DATE) - interval '1 month'
           AND data_pagamento <  date_trunc('month', CURRENT_DATE)`,
                [gymId]
            ),
            pool.query(
                `SELECT COALESCE(SUM(valor), 0) AS total, COUNT(*) AS quantidade
         FROM pagamentos WHERE gym_id = $1 AND status = 'pendente'`,
                [gymId]
            ),
            // Só check-ins válidos: as tentativas recusadas não são "atividade"
            pool.query(
                `SELECT c.id, u.nome, u.foto_url, c.data_hora, c.metodo, c.tipo
         FROM checkins c
                  JOIN usuarios u ON c.membro_id = u.id
         WHERE c.gym_id = $1 AND c.valido = true AND DATE(c.data_hora) = CURRENT_DATE
         ORDER BY c.data_hora DESC
         LIMIT 8`,
                [gymId]
            ),
            pool.query(
                `SELECT p.id, u.nome, p.descricao, p.valor,
                to_char(p.data_vencimento, 'YYYY-MM-DD') AS data_vencimento,
                (p.data_vencimento < CURRENT_DATE) AS vencida
         FROM pagamentos p
                  JOIN usuarios u ON p.membro_id = u.id
         WHERE p.gym_id = $1 AND p.status = 'pendente'
         ORDER BY p.data_vencimento ASC
         LIMIT 6`,
                [gymId]
            ),
        ]);

        res.json({
            totalMembros: parseInt(totalMembros.rows[0].count),
            novosMembrosMes: parseInt(novosMembros.rows[0].count),
            membrosAtivos: parseInt(membrosAtivos.rows[0].count),
            receitaMensal: parseFloat(receitaMes.rows[0].total),
            receitaMesAnterior: parseFloat(receitaMesAnterior.rows[0].total),
            pagamentosPendentes: {
                total: parseFloat(pendentes.rows[0].total),
                quantidade: parseInt(pendentes.rows[0].quantidade),
            },
            atividadeRecente: atividade.rows,
            faturasPendentes: faturas.rows.map((f) => ({ ...f, valor: parseFloat(f.valor) })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
});

// GET /api/dashboard/receitas?periodo=7d|30d|90d|1y — dados do gráfico
// "Planos" = pagamentos ligados a uma assinatura; "Extras" = pagamentos avulsos.
// Os períodos sem pagamentos aparecem com zero (em vez de ficarem de fora do gráfico).
router.get('/receitas', auth, async (req, res) => {
    const periodo = req.query.periodo ?? '7d';
    const cfg = PERIODOS[periodo];
    if (!cfg) {
        return res.status(400).json({ error: 'Período inválido' });
    }

    try {
        const gymId = req.user.gym_id || 1;
        const { granularidade: g, inicio } = cfg;

        const { rows } = await pool.query(
            `WITH serie AS (
         SELECT generate_series(
                  date_trunc('${g}', ${inicio}::date),
                  date_trunc('${g}', CURRENT_DATE),
                  interval '1 ${g}'
                )::date AS bucket
       )
       SELECT to_char(s.bucket, 'YYYY-MM-DD') AS data,
              COALESCE(SUM(p.valor) FILTER (WHERE p.assinatura_id IS NOT NULL), 0) AS planos,
              COALESCE(SUM(p.valor) FILTER (WHERE p.assinatura_id IS NULL), 0) AS extras
       FROM serie s
                LEFT JOIN pagamentos p
                          ON p.gym_id = $1
                              AND p.status = 'pago'
                              AND p.data_pagamento >= ${inicio}::date
                              AND date_trunc('${g}', p.data_pagamento)::date = s.bucket
       GROUP BY s.bucket
       ORDER BY s.bucket`,
            [gymId]
        );

        res.json(
            rows.map((r) => ({ data: r.data, planos: parseFloat(r.planos), extras: parseFloat(r.extras) }))
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar receitas' });
    }
});

module.exports = router;