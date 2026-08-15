const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        const gymId = req.user.gym_id || 1;

        // Total de membros (usuários com perfil_id = 7 = membro, ou todos exceto staff)
        const totalMembros = await pool.query(
            `SELECT COUNT(*) FROM usuarios 
       WHERE gym_id = $1 AND perfil_id = 7`, // 7 = membro
            [gymId]
        );

        // Membros ativos
        const membrosAtivos = await pool.query(
            `SELECT COUNT(*) FROM usuarios 
       WHERE gym_id = $1 AND perfil_id = 7 AND status = 'ativo'`,
            [gymId]
        );

        // Receita mensal
        const receitaMensal = await pool.query(
            `SELECT COALESCE(SUM(valor), 0) as total
             FROM pagamentos
             WHERE gym_id = $1
               AND EXTRACT(MONTH FROM data_pagamento) = EXTRACT(MONTH FROM CURRENT_DATE)
               AND EXTRACT(YEAR FROM data_pagamento) = EXTRACT(YEAR FROM CURRENT_DATE)
               AND status = 'pago'`,
            [gymId]
        );

        // Pagamentos pendentes
        const pagamentosPendentes = await pool.query(
            `SELECT COALESCE(SUM(valor), 0) as total, COUNT(*) as quantidade
             FROM pagamentos
             WHERE gym_id = $1 AND status = 'pendente'`,
            [gymId]
        );

        // Receita gráfico 7 dias
        const receitaGrafico = await pool.query(
            `SELECT
                 DATE(data_pagamento) as data,
                 SUM(CASE WHEN tipo = 'plano' THEN valor ELSE 0 END) as planos,
                 SUM(CASE WHEN tipo = 'extra' THEN valor ELSE 0 END) as extras
             FROM pagamentos
             WHERE gym_id = $1
               AND data_pagamento >= CURRENT_DATE - INTERVAL '7 days'
               AND status = 'pago'
             GROUP BY DATE(data_pagamento)
             ORDER BY data`,
            [gymId]
        );

        // Atividade recente (check-ins de hoje)
        const atividadeRecente = await pool.query(
            `SELECT
                 c.id,
                 u.nome,
                 u.foto_url,
                 c.data_hora,
                 c.metodo,
                 c.tipo
             FROM checkins c
                      JOIN usuarios u ON c.membro_id = u.id
             WHERE c.gym_id = $1
               AND DATE(c.data_hora) = CURRENT_DATE
             ORDER BY c.data_hora DESC
                 LIMIT 5`,
            [gymId]
        );

        // Faturas pendentes
        const faturasPendentes = await pool.query(
            `SELECT
                 p.id,
                 u.nome,
                 p.descricao,
                 p.valor,
                 p.data_vencimento
             FROM pagamentos p
                      JOIN usuarios u ON p.usuario_id = u.id
             WHERE p.gym_id = $1
               AND p.status = 'pendente'
             ORDER BY p.data_vencimento ASC
                 LIMIT 5`,
            [gymId]
        );

        res.json({
            totalMembros: parseInt(totalMembros.rows[0].count),
            membrosAtivos: parseInt(membrosAtivos.rows[0].count),
            receitaMensal: parseFloat(receitaMensal.rows[0].total),
            pagamentosPendentes: {
                total: parseFloat(pagamentosPendentes.rows[0].total),
                quantidade: parseInt(pagamentosPendentes.rows[0].quantidade),
            },
            graficoReceitas: receitaGrafico.rows,
            atividadeRecente: atividadeRecente.rows,
            faturasPendentes: faturasPendentes.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
});

module.exports = router;