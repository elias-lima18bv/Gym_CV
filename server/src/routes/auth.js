const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { gerarPin, gerarQrCode } = require('../utils/credentials');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida os campos obrigatórios do cadastro. Retorna null se tudo ok,
// ou uma string com a primeira mensagem de erro encontrada.
function validarCadastro({ nome, email, telefone, senha, data_nascimento, genero, bi }) {
    if (!nome || nome.trim().length < 3) {
        return 'Nome deve ter pelo menos 3 caracteres';
    }
    if (!email || !EMAIL_REGEX.test(email)) {
        return 'Email inválido';
    }
    if (!telefone || telefone.trim().length < 7) {
        return 'Telefone inválido';
    }
    if (!senha || senha.length < 6) {
        return 'Senha deve ter pelo menos 6 caracteres';
    }
    if (!bi || bi.trim().length < 5) {
        return 'Nº Doc inválido';
    }
    if (!data_nascimento) {
        return 'Data de nascimento é obrigatória';
    }
    if (new Date(data_nascimento) > new Date()) {
        return 'Data de nascimento não pode ser no futuro';
    }
    if (!genero) {
        return 'Género é obrigatório';
    }
    return null;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { nome, email, telefone, senha, data_nascimento, genero, bi, gym_id } = req.body;

    const erroValidacao = validarCadastro({ nome, email, telefone, senha, data_nascimento, genero, bi });
    if (erroValidacao) {
        return res.status(400).json({ error: erroValidacao });
    }

    try {
        // Verifica duplicidade por email OU nome (case-insensitive) numa única query
        const conflito = await pool.query(
            'SELECT id, email, nome FROM usuarios WHERE email = $1 OR LOWER(nome) = LOWER($2)',
            [email, nome.trim()]
        );
        if (conflito.rows.length > 0) {
            const jaExiste = conflito.rows[0];
            if (jaExiste.email === email) {
                return res.status(409).json({ error: 'Email já cadastrado' });
            }
            return res.status(409).json({ error: 'Já existe um membro cadastrado com esse nome' });
        }

        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        // qr_code: identificador único para o QR físico/digital do membro
        // pin_checkin: PIN de 4 dígitos para check-in manual
        const qrCode = gerarQrCode();
        const pinCheckin = gerarPin();

        const result = await pool.query(
            `INSERT INTO usuarios
       (nome, email, telefone, senha_hash, data_nascimento, genero, bi, gym_id, status, email_verificado, qr_code, pin_checkin, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ativo', false, $9, $10, NOW(), NOW())
       RETURNING id, nome, email, telefone, status, foto_url, qr_code, pin_checkin, gym_id, perfil_id, created_at`,
            [nome.trim(), email, telefone, senha_hash, data_nascimento, genero, bi, gym_id, qrCode, pinCheckin]
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, gym_id: user.gym_id, perfil_id: user.perfil_id },
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
    const { email, senha } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

        const validPassword = await bcrypt.compare(senha, user.senha_hash);
        if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

        await pool.query('UPDATE usuarios SET ultimo_acesso = NOW(), updated_at = NOW() WHERE id = $1', [user.id]);

        const token = jwt.sign(
            { id: user.id, email: user.email, gym_id: user.gym_id, perfil_id: user.perfil_id },
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
                perfil_id: user.perfil_id,
                gym_id: user.gym_id,
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
            'SELECT id, nome, email, telefone, foto_url, status, perfil_id, gym_id, ultimo_acesso FROM usuarios WHERE id = $1',
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

module.exports = router;