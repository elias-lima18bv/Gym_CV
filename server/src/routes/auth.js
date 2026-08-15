const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    // LOG TEMPORÁRIO — depois remove
    console.log('>>> BODY RECEBIDO:', req.body);
    console.log('>>> EMAIL:', email);
    console.log('>>> SENHA:', senha);

    try {
        const result = await pool.query(
            `SELECT 
         u.id, u.nome, u.email, u.senha_hash, u.telefone, u.foto_url, 
         u.status, u.gym_id, u.perfil_id, u.ultimo_acesso,
         p.nome as perfil_nome, p.nivel_acesso, p.permissoes
       FROM usuarios u
       LEFT JOIN perfis p ON u.perfil_id = p.id
       WHERE u.email = $1`,
            [email]
        );

        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
        if (user.status !== 'ativo') return res.status(403).json({ error: 'Conta desativada' });

        const valid = await bcrypt.compare(senha, user.senha_hash);
        if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

        // Atualiza último acesso
        await pool.query(
            'UPDATE usuarios SET ultimo_acesso = NOW(), updated_at = NOW() WHERE id = $1',
            [user.id]
        );

        // Parse das permissões (JSONB do Postgres já vem como objeto, mas garante)
        const permissoes = typeof user.permissoes === 'string'
            ? JSON.parse(user.permissoes)
            : user.permissoes;

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                perfil_id: user.perfil_id,
                nivel_acesso: user.nivel_acesso,
                gym_id: user.gym_id,
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                telefone: user.telefone,
                foto_url: user.foto_url,
                status: user.status,
                gym_id: user.gym_id,
                perfil: {
                    id: user.perfil_id,
                    nome: user.perfil_nome,
                    nivel_acesso: user.nivel_acesso,
                    permissoes: permissoes || {},
                },
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
         u.id, u.nome, u.email, u.telefone, u.foto_url, u.status, 
         u.gym_id, u.ultimo_acesso, u.perfil_id,
         p.nome as perfil_nome, p.nivel_acesso, p.permissoes
       FROM usuarios u
       LEFT JOIN perfis p ON u.perfil_id = p.id
       WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

        const user = result.rows[0];
        const permissoes = typeof user.permissoes === 'string'
            ? JSON.parse(user.permissoes)
            : user.permissoes;

        res.json({
            id: user.id,
            nome: user.nome,
            email: user.email,
            telefone: user.telefone,
            foto_url: user.foto_url,
            status: user.status,
            gym_id: user.gym_id,
            ultimo_acesso: user.ultimo_acesso,
            perfil: {
                id: user.perfil_id,
                nome: user.perfil_nome,
                nivel_acesso: user.nivel_acesso,
                permissoes: permissoes || {},
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

module.exports = router;