const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { gerarPin, gerarQrCode, gerarSenhaTemporaria } = require('../utils/credentials');
const { calcularCobranca } = require('../utils/planos');

const PERFIL_MEMBRO = 7; // mesma constante já usada em dashboard.js

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'photos');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `membro-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
            return cb(new Error('Formato inválido. Envie JPEG, PNG ou WEBP.'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarMembro({ nome, email, telefone, bi, data_nascimento, genero }) {
    if (!nome || nome.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    if (!email || !EMAIL_REGEX.test(email)) return 'Email inválido';
    if (!telefone || telefone.trim().length < 7) return 'Telefone inválido';
    if (!bi || bi.trim().length < 5) return 'BI inválido';
    if (!data_nascimento) return 'Data de nascimento é obrigatória';
    if (new Date(data_nascimento) > new Date()) return 'Data de nascimento não pode ser no futuro';
    if (!genero) return 'Género é obrigatório';
    return null;
}

// GET /api/membros — lista membros do ginásio, com o plano ativo (se houver)
router.get('/', auth, async (req, res) => {
    const gymId = req.user.gym_id;
    try {
        const { rows } = await pool.query(
            `SELECT
                 u.id, u.nome, u.email, u.telefone, u.foto_url, u.status,
                 u.bi, u.data_nascimento, u.genero, u.qr_code, u.pin_checkin, u.created_at,
                 a.id AS assinatura_id, a.data_inicio, a.data_fim, a.status AS assinatura_status,
                 p.id AS plano_id, p.nome AS plano_nome
             FROM usuarios u
                      LEFT JOIN LATERAL (
                 SELECT * FROM assinaturas
                 WHERE membro_id = u.id
                 ORDER BY (status = 'ativa') DESC, created_at DESC
                     LIMIT 1
           ) a ON true
                 LEFT JOIN planos p ON p.id = a.plano_id
             WHERE u.gym_id = $1 AND u.perfil_id = $2
             ORDER BY u.created_at DESC`,
            [gymId, PERFIL_MEMBRO]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar membros' });
    }
});

// POST /api/membros — cria membro + assinatura numa única transação
router.post('/', auth, (req, res) => {
    upload.single('foto')(req, res, async (uploadErr) => {
        if (uploadErr) {
            return res.status(400).json({ error: uploadErr.message });
        }

        const {
            nome, email, telefone, bi, data_nascimento, genero,
            status = 'ativo', plano_id, metodo_pagamento,
        } = req.body;
        const gymId = req.user.gym_id;

        const erroValidacao = validarMembro({ nome, email, telefone, bi, data_nascimento, genero });
        if (erroValidacao) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.status(400).json({ error: erroValidacao });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const conflito = await client.query(
                'SELECT id, email, nome FROM usuarios WHERE email = $1 OR LOWER(nome) = LOWER($2)',
                [email, nome.trim()]
            );
            if (conflito.rows.length > 0) {
                await client.query('ROLLBACK');
                if (req.file) fs.unlink(req.file.path, () => {});
                const jaExiste = conflito.rows[0];
                const msg = jaExiste.email === email ? 'Email já cadastrado' : 'Já existe um membro cadastrado com esse nome';
                return res.status(409).json({ error: msg });
            }

            const senhaTemporaria = gerarSenhaTemporaria();
            const senha_hash = await bcrypt.hash(senhaTemporaria, 10);
            const qrCode = gerarQrCode();
            const pinCheckin = gerarPin();
            const fotoUrl = req.file ? `/uploads/photos/${req.file.filename}` : null;

            const novoUsuario = await client.query(
                `INSERT INTO usuarios
                 (nome, email, telefone, senha_hash, data_nascimento, genero, bi, gym_id, perfil_id,
                  status, email_verificado, foto_url, qr_code, pin_checkin, created_at, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,$11,$12,$13,NOW(),NOW())
                     RETURNING id, nome, email, telefone, status, foto_url, qr_code, pin_checkin, created_at`,
                [nome.trim(), email, telefone, senha_hash, data_nascimento, genero, bi, gymId, PERFIL_MEMBRO,
                    status, fotoUrl, qrCode, pinCheckin]
            );
            const membro = novoUsuario.rows[0];

            let assinatura = null;
            if (plano_id) {
                const planoResult = await client.query('SELECT * FROM planos WHERE id = $1', [plano_id]);
                const plano = planoResult.rows[0];
                if (!plano) {
                    await client.query('ROLLBACK');
                    if (req.file) fs.unlink(req.file.path, () => {});
                    return res.status(400).json({ error: 'Plano não encontrado' });
                }

                // O valor vem sempre do plano (nunca do que o cliente enviar), para evitar preço errado
                const { valor: valorFinal } = calcularCobranca(plano);
                const duracao = plano.duracao_dias ?? 30;

                const novaAssinatura = await client.query(
                    `INSERT INTO assinaturas
                     (membro_id, plano_id, gym_id, data_inicio, data_fim, valor_pago, metodo_pagamento,
                      status, auto_renovar, criado_por, created_at, updated_at)
                     VALUES ($1,$2,$3,CURRENT_DATE,CURRENT_DATE + ($4 || ' days')::interval,$5,$6,'ativa',true,$7,NOW(),NOW())
                         RETURNING id, data_inicio, data_fim, valor_pago`,
                    [membro.id, plano_id, gymId, duracao, valorFinal, metodo_pagamento ?? null, req.user.id]
                );
                assinatura = novaAssinatura.rows[0];
            }

            await client.query('COMMIT');

            res.status(201).json({ membro, assinatura, senha_temporaria: senhaTemporaria });
        } catch (err) {
            await client.query('ROLLBACK');
            if (req.file) fs.unlink(req.file.path, () => {});
            console.error(err);
            res.status(500).json({ error: 'Erro ao cadastrar membro' });
        } finally {
            client.release();
        }
    });
});

// PUT /api/membros/:id — atualiza dados pessoais (não mexe em senha, qr_code ou pin)
router.put('/:id', auth, (req, res) => {
    upload.single('foto')(req, res, async (uploadErr) => {
        if (uploadErr) {
            return res.status(400).json({ error: uploadErr.message });
        }

        const { id } = req.params;
        const { nome, email, telefone, bi, data_nascimento, genero, status } = req.body;

        const erroValidacao = validarMembro({ nome, email, telefone, bi, data_nascimento, genero });
        if (erroValidacao) {
            return res.status(400).json({ error: erroValidacao });
        }

        try {
            const conflito = await pool.query(
                `SELECT id, email, nome FROM usuarios
                 WHERE (email = $1 OR LOWER(nome) = LOWER($2)) AND id != $3`,
                [email, nome.trim(), id]
            );
            if (conflito.rows.length > 0) {
                const jaExiste = conflito.rows[0];
                const msg = jaExiste.email === email ? 'Email já cadastrado' : 'Já existe um membro cadastrado com esse nome';
                return res.status(409).json({ error: msg });
            }

            let fotoUrl;
            if (req.file) {
                const { rows: atual } = await pool.query('SELECT foto_url FROM usuarios WHERE id = $1', [id]);
                const fotoAntiga = atual[0]?.foto_url;
                fotoUrl = `/uploads/photos/${req.file.filename}`;
                if (fotoAntiga && fotoAntiga.startsWith('/uploads/photos/')) {
                    fs.unlink(path.join(__dirname, '..', '..', fotoAntiga), () => {});
                }
            }

            const { rows } = await pool.query(
                `UPDATE usuarios SET
                                     nome = $1, email = $2, telefone = $3, bi = $4, data_nascimento = $5,
                                     genero = $6, status = $7, foto_url = COALESCE($8, foto_url), updated_at = NOW()
                 WHERE id = $9
                     RETURNING id, nome, email, telefone, status, foto_url, bi, data_nascimento, genero`,
                [nome.trim(), email, telefone, bi, data_nascimento, genero, status, fotoUrl ?? null, id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Membro não encontrado' });
            }
            res.json(rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao atualizar membro' });
        }
    });
});

// DELETE /api/membros/:id — soft delete (mantém histórico de checkins/pagamentos)
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            `UPDATE usuarios SET status = 'inativo', updated_at = NOW() WHERE id = $1 RETURNING id`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Membro não encontrado' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover membro' });
    }
});

module.exports = router;