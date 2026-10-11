const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { calcularCobranca } = require('../utils/planos');

// GET /api/assinaturas/membro/:membroId — histórico de assinaturas do membro
router.get('/membro/:membroId', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.*, p.nome AS plano_nome
             FROM assinaturas a
                      JOIN planos p ON p.id = a.plano_id
             WHERE a.membro_id = $1
             ORDER BY a.data_inicio DESC`,
            [req.params.membroId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar histórico de assinaturas' });
    }
});

// POST /api/assinaturas — troca ou renova o plano de um membro
router.post('/', auth, async (req, res) => {
    const { membro_id, plano_id, metodo_pagamento } = req.body;
    const gymId = req.user.gym_id;

    if (!membro_id || !plano_id) {
        return res.status(400).json({ error: 'membro_id e plano_id são obrigatórios' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const membroResult = await client.query('SELECT id FROM usuarios WHERE id = $1', [membro_id]);
        if (membroResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Membro não encontrado' });
        }

        const planoResult = await client.query('SELECT * FROM planos WHERE id = $1', [plano_id]);
        const plano = planoResult.rows[0];
        if (!plano) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Plano não encontrado' });
        }

        // Encerra a assinatura ativa anterior, se houver — ajusta data_fim para
        // hoje só se ela ainda não tivesse vencido (troca antecipada); se já
        // tinha vencido naturalmente (renovação), mantém a data_fim original.
        await client.query(
            `UPDATE assinaturas
             SET status = 'cancelada', data_fim = LEAST(data_fim, CURRENT_DATE), updated_at = NOW()
             WHERE membro_id = $1 AND status = 'ativa'`,
            [membro_id]
        );

        // O valor vem sempre do plano (nunca do que o cliente enviar), para evitar preço errado
        const { valor: valorFinal } = calcularCobranca(plano);
        const duracao = plano.duracao_dias ?? 30;

        const novaAssinatura = await client.query(
            `INSERT INTO assinaturas
             (membro_id, plano_id, gym_id, data_inicio, data_fim, valor_pago, metodo_pagamento,
              status, auto_renovar, criado_por, created_at, updated_at)
             VALUES ($1,$2,$3,CURRENT_DATE,CURRENT_DATE + ($4 || ' days')::interval,$5,$6,'ativa',true,$7,NOW(),NOW())
                 RETURNING id, data_inicio, data_fim, valor_pago`,
            [membro_id, plano_id, gymId, duracao, valorFinal, metodo_pagamento ?? null, req.user.id]
        );

        await client.query('COMMIT');
        res.status(201).json({ assinatura: novaAssinatura.rows[0], plano_nome: plano.nome });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao trocar/renovar plano' });
    } finally {
        client.release();
    }
});

module.exports = router;