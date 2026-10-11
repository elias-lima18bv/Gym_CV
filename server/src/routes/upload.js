const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'photos');

// Garante que a pasta existe (evita erro na primeira execução)
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Nome único: id do usuário + timestamp + extensão original
        // Evita sobrescrever arquivos de usuários diferentes ou uploads simultâneos
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
    },
});

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
        return cb(new Error('Formato inválido. Envie JPEG, PNG ou WEBP.'));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post('/photo', auth, (req, res) => {
    upload.single('photo')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Erro no upload: ${err.message}` });
        }
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        try {
            // Busca a foto antiga para apagar do disco depois de trocar (evita acumular lixo)
            const { rows: atual } = await pool.query(
                'SELECT foto_url FROM usuarios WHERE id = $1',
                [req.user.id]
            );
            const fotoAntiga = atual[0]?.foto_url;

            const fotoUrl = `/uploads/photos/${req.file.filename}`;

            await pool.query(
                'UPDATE usuarios SET foto_url = $1, updated_at = NOW() WHERE id = $2',
                [fotoUrl, req.user.id]
            );

            // Remove o arquivo antigo do disco, se existir e for um upload nosso
            if (fotoAntiga && fotoAntiga.startsWith('/uploads/photos/')) {
                const caminhoAntigo = path.join(__dirname, '..', '..', fotoAntiga);
                fs.unlink(caminhoAntigo, () => {}); // ignora erro se já não existir
            }

            res.json({ foto_url: fotoUrl });
        } catch (dbErr) {
            console.error(dbErr);
            res.status(500).json({ error: 'Erro ao salvar foto no banco de dados' });
        }
    });
});

module.exports = router;