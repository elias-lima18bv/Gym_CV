const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/membros (só usuários com perfil_id = 7 = membro)
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                 id, nome, email, telefone, foto_url, status,
                 data_nascimento, genero, bi, numero_cartao,
                 ultimo_acesso, created_at
             FROM usuarios
             WHERE gym_id = $1 AND perfil_id = 7
             ORDER BY created_at DESC`,
            [req.user.gym_id || 1]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar membros' });
    }
});

module.exports = router;