require('dotenv').config();
const express = require('express');
const cors = require('cors');


const checkinRoutes = require('./routes/checkin.js');
const {join} = require("node:path");
// À medida que for criando outras rotas (usuarios, gyms, aulas...),
// importe e registre-as aqui do mesmo jeito:
// const usuariosRoutes = require('./routes/usuarios');

const app = express();

// Middlewares
app.use(cors()); // Permite requisições do frontend
app.use(express.json()); // Permite receber JSON no body

// Rotas
app.use('/api', checkinRoutes);
// app.use('/api', usuariosRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Rota de upload
app.use('/api/upload', require('./routes/upload'));


// CORS para produção e desenvolvimento
const allowedOrigins = [
    'http://localhost:5173',
    'https://seu-frontend-no-vercel.vercel.app', // depois você coloca o do frontend
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());

// Servir uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
