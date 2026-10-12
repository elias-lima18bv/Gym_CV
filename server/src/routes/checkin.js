const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
    const { credencial, method, terminalId } = req.body;
    // credencial = valor lido do QR (coluna qr_code) ou PIN digitado (coluna pin_checkin)
    // method = 'qr' | 'pin'
    const metodo = method === 'qr' ? 'qr_code' : 'pin';
    const ipAddress = req.ip;
    const registradoPor = req.user.id; // staff autenticado que operou o terminal

    try {
        const campoBusca = method === 'qr' ? 'qr_code' : 'pin_checkin';
        const { rows: usuarios } = await pool.query(
            `SELECT * FROM usuarios WHERE ${campoBusca} = $1`,
            [credencial]
        );
        const membro = usuarios[0];

        let valido = true;
        let motivoInvalido = null;
        const membroId = membro?.id ?? null;
        // Credencial desconhecida: não há membro, então usa o ginásio de quem opera o terminal
        const gymId = membro?.gym_id ?? req.user.gym_id ?? null;

        if (!membro) {
            valido = false;
            motivoInvalido = 'Credencial não encontrada';
        } else if (membro.status !== 'ativo') {
            valido = false;
            motivoInvalido = 'Membro inativo';
        }

        let tipo = 'entrada';
        if (valido) {
            const { rows: ultimos } = await pool.query(
                `SELECT tipo FROM checkins
                 WHERE membro_id = $1 AND valido = true AND DATE(data_hora) = CURRENT_DATE
                 ORDER BY data_hora DESC LIMIT 1`,
                [membroId]
            );
            tipo = (!ultimos[0] || ultimos[0].tipo === 'saida') ? 'entrada' : 'saida';

            // A assinatura só é exigida na ENTRADA. Quem já está dentro do ginásio pode
            // sempre registar a saída, mesmo que a assinatura tenha vencido entretanto.
            if (tipo === 'entrada') {
                const { rows: assinaturas } = await pool.query(
                    `SELECT (data_fim IS NULL OR data_fim >= CURRENT_DATE) AS vigente
                     FROM assinaturas
                     WHERE membro_id = $1 AND status = 'ativa'
                     ORDER BY created_at DESC LIMIT 1`,
                    [membroId]
                );

                if (!assinaturas[0]) {
                    valido = false;
                    motivoInvalido = 'Sem assinatura ativa';
                } else if (!assinaturas[0].vigente) {
                    valido = false;
                    motivoInvalido = 'Assinatura vencida';
                }
            }
        }

        // Sempre grava — tentativas inválidas também viram registro de auditoria
        try {
            await pool.query(
                `INSERT INTO checkins
                 (membro_id, gym_id, data_hora, metodo, valido, motivo_invalido, terminal_id, ip_address, registrado_por, tipo)
                 VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)`,
                [membroId, gymId, metodo, valido, motivoInvalido, terminalId ?? 'web-app', ipAddress, registradoPor, tipo]
            );
        } catch (auditErr) {
            // Um check-in válido TEM de ficar registado, senão a entrada não existe: falha com erro.
            if (valido) throw auditErr;
            // Numa recusa, a falha de auditoria não deve esconder o motivo real ao operador.
            console.error('Falha ao gravar a tentativa recusada em checkins:', auditErr.message);
        }

        if (!valido) {
            return res.status(membro ? 403 : 404).json({ error: motivoInvalido });
        }

        res.json({
            success: true,
            type: tipo,
            member: { name: membro.nome },
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor ao processar check-in.' });
    }
});

module.exports = router;