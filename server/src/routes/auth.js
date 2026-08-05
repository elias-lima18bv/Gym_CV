const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, phone, plan } = req.body;

    try {
        // Verifica se email já existe
        const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insere no banco
        const result = await pool.query(
            `INSERT INTO usuarios (name, email, password, phone, plan, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW())
       RETURNING id, name, email, phone, plan, status, created_at`,
            [name, email, hashedPassword, phone, plan]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                plan: user.plan,
                status: user.status,
                photo_url: user.photo_url
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// GET /api/auth/me (pega usuário logado)
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, phone, plan, status, photo_url, created_at FROM usuarios WHERE id = $1',
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

module.exports = router;