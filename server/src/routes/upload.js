const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Cria pasta se não existir
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, unique);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Apenas JPG, PNG ou WEBP'));
    },
});

// POST /api/upload/photo
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

        const photoUrl = `/uploads/${req.file.filename}`;

        // Atualiza foto do usuário logado
        await pool.query('UPDATE usuarios SET photo_url = $1 WHERE id = $2', [
            photoUrl,
            req.user.id,
        ]);

        res.json({ photoUrl, message: 'Foto enviada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no upload' });
    }
});

// GET /api/upload/qrcode/:userId
router.get('/qrcode/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Gera QR Code com dados do aluno
        const qrData = JSON.stringify({
            gym: 'Gym-Elias',
            userId: userId,
            timestamp: new Date().toISOString(),
        });

        const qrImage = await QRCode.toDataURL(qrData);

        res.json({ qrCode: qrImage });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao gerar QR Code' });
    }
});

module.exports = router;