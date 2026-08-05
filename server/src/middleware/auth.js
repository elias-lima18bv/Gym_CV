const jwt = require('jsonwebtoken');

// Espera um header: Authorization: Bearer <token>
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // decoded deve conter, no mínimo, o id do usuário staff logado
        req.user = jwt.verify(token, process.env.JWT_SECRET); // ex: { id: 12, perfil_id: 1, gym_id: 3 }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

module.exports = authMiddleware;