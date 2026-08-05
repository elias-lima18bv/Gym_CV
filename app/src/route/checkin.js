const GYM_ID = 1; // fixo por agora — trocar se/quando houver multi-ginásio

// Gera o próximo ID sequencial no formato 'at{n}', ex: at1, at2, at3...
async function generateNextCheckinId(pool) {
    const { rows } = await pool.query(
        `SELECT id FROM checkins 
     WHERE id LIKE 'at%' 
     ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER) DESC LIMIT 1`
    );
    const lastId = rows[0]?.id; // ex: 'at42'
    const nextNum = lastId ? parseInt(lastId.slice(2), 10) + 1 : 1;
    return `at${nextNum}`;
}

router.post('/checkin', authMiddleware, async (req, res) => {
    const { credencial, method, terminalId } = req.body;
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
        const gymId = membro?.gym_id ?? null;

        if (!membro) {
            valido = false;
            motivoInvalido = 'Credencial não encontrada';
        } else if (membro.status !== 'active') {
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
        }

        await pool.query(
            `INSERT INTO checkins 
       (membro_id, gym_id, data_hora, metodo, valido, motivo_invalido, terminal_id, ip_address, registrado_por, tipo) 
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)`,
            [membroId, gymId, metodo, valido, motivoInvalido, terminalId ?? 'web-app', ipAddress, registradoPor, tipo]
        );

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