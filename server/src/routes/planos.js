const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { calcularCobranca } = require('../utils/planos');

// GET /api/planos — planos disponíveis para o ginásio do usuário logado
router.get('/', auth, async (req, res) => {
    const gymId = req.user.gym_id;
    try {
        const { rows } = await pool.query(
            `SELECT id, nome, descricao, tipo_acesso, preco_mensal, preco_anual, moeda,
                    duracao_dias, limite_checkins_dia, inclui_aulas, inclui_nutricao, inclui_pt, status
             FROM planos
             WHERE (gyms_permitidos IS NULL OR $1 = ANY(gyms_permitidos)) AND status = 'ativo'
             ORDER BY preco_mensal ASC`,
            [gymId]
        );
        const planos = rows.map((p) => {
            const { valor, periodo } = calcularCobranca(p);
            return { ...p, preco_cobranca: valor, periodo_cobranca: periodo };
        });
        res.json(planos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar planos' });
    }
});

module.exports = router;