require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
}));

app.use(express.json());

// Serve os arquivos de uploads/ como estáticos, ex: /uploads/photos/user-3-169...jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== ROTAS =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/membros', require('./routes/membros'));
app.use('/api/planos', require('./routes/planos'));
app.use('/api/assinaturas', require('./routes/assinaturas'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});