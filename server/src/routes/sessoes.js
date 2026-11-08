const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

const PERFIL_MEMBRO = 7;
// Perfis que podem dar sessões de treino (1 = administração, 4 = o perfil indicado para treinadores).
// Para mudar quem aparece na lista de treinadores, altera só esta linha.
const PERFIS_TREINADOR = [1, 4];
// Os valores têm de ser iguais aos da restrição sessoes_treino_tipo_check (e a app/src/lib/sessoes.ts)
const TIPOS_TREINO = ['musculacao', 'cardio', 'crossfit', 'yoga', 'pilates', 'luta'];
const DURACOES = [30, 45, 60, 90, 120];
const ESTADOS_FINAIS = ['concluida', 'faltou', 'cancelada'];
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const CHAVE_BLOQUEIO = 7001; // serializa os agendamentos do mesmo ginásio (evita duas marcações em simultâneo)

// Recusa "esperada" (erro de quem pede, não do servidor): leva o código HTTP e a mensagem
class Recusa extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}

function dataValida(texto) {
    if (typeof texto !== 'string' || !DATA_REGEX.test(texto)) return false;
    const d = new Date(texto + 'T12:00:00Z');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto; // recusa 2026-02-31
}

function idValido(valor) {
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : null;
}

// GET /api/sessoes/treinadores — quem pode ser treinador (utilizadores ativos com um dos perfis
// de treinador), com o número de sessões agendadas que ainda têm pela frente
router.get('/treinadores', auth, async (req, res) => {
    try {
        const gymId = req.user.gym_id || 1;
        const { rows } = await pool.query(
            `SELECT u.id, u.nome,
              COUNT(s.id) FILTER (WHERE s.estado = 'agendada' AND s.data_hora_inicio >= LOCALTIMESTAMP)::int AS proximas
       FROM usuarios u
                LEFT JOIN sessoes_treino s ON s.treinador_id = u.id AND s.gym_id = $1
       WHERE u.gym_id = $1 AND u.perfil_id = ANY($2::int[]) AND u.status = 'ativo'
       GROUP BY u.id, u.nome
       ORDER BY u.nome`,
            [gymId, PERFIS_TREINADOR]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar treinadores' });
    }
});

// GET /api/sessoes/resumo — números para os cartões de estatísticas
router.get('/resumo', auth, async (req, res) => {
    try {
        const gymId = req.user.gym_id || 1;
        const { rows } = await pool.query(
            `SELECT COUNT(*)::int AS total,
                 COUNT(*) FILTER (WHERE estado = 'agendada')::int AS agendadas,
                 COUNT(*) FILTER (WHERE estado = 'agendada' AND data_hora_inicio >= LOCALTIMESTAMP)::int AS proximas,
                 COUNT(*) FILTER (WHERE estado = 'agendada' AND data_hora_inicio::date = LOCALTIMESTAMP::date)::int AS hoje
             FROM sessoes_treino WHERE gym_id = $1`,
            [gymId]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar o resumo das sessões' });
    }
});

// GET /api/sessoes?estado=agendada&de=AAAA-MM-DD&ate=AAAA-MM-DD — lista (todos os filtros são opcionais),
// da mais próxima para a mais distante. "de" e "ate" incluem o próprio dia.
const MAX_DIAS_LISTA = 93; // o calendário pede 1 mês; isto limita o tamanho da resposta
router.get('/', auth, async (req, res) => {
    const { estado, de, ate } = req.query;
    if (estado !== undefined && !['agendada', ...ESTADOS_FINAIS].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }
    if (de !== undefined && !dataValida(de)) return res.status(400).json({ error: 'Data inicial inválida' });
    if (ate !== undefined && !dataValida(ate)) return res.status(400).json({ error: 'Data final inválida' });
    if (de !== undefined && ate !== undefined) {
        if (de > ate) return res.status(400).json({ error: 'A data inicial não pode ser depois da final' });
        if ((new Date(ate + 'T12:00:00Z') - new Date(de + 'T12:00:00Z')) / 86400000 > MAX_DIAS_LISTA) {
            return res.status(400).json({ error: 'O período máximo é de 3 meses' });
        }
    }

    try {
        const { rows } = await pool.query(
            `SELECT s.id, s.membro_id, m.nome AS atleta, m.foto_url,
              s.treinador_id, t.nome AS treinador,
              s.tipo_treino,
              to_char(s.data_hora_inicio, 'YYYY-MM-DD') AS data,
              to_char(s.data_hora_inicio, 'HH24:MI') AS hora,
              s.duracao_min, s.estado, s.observacoes,
              (s.data_hora_inicio <= LOCALTIMESTAMP) AS iniciada,
              (s.estado = 'agendada'
                  AND s.data_hora_inicio + (s.duracao_min * interval '1 minute') < LOCALTIMESTAMP) AS atrasada
       FROM sessoes_treino s
                JOIN usuarios m ON m.id = s.membro_id
                LEFT JOIN usuarios t ON t.id = s.treinador_id
       WHERE s.gym_id = $1 AND ($2::text IS NULL OR s.estado = $2)
         AND ($3::date IS NULL OR s.data_hora_inicio >= $3::date)
         AND ($4::date IS NULL OR s.data_hora_inicio < $4::date + 1)
       ORDER BY s.data_hora_inicio ASC, s.id ASC
       LIMIT 1000`,
            [req.user.gym_id || 1, estado ?? null, de ?? null, ate ?? null]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar sessões' });
    }
});

// POST /api/sessoes — agenda uma sessão
router.post('/', auth, async (req, res) => {
    const { membro_id, treinador_id, tipo_treino, data, hora, duracao_min, observacoes } = req.body;
    const gymId = req.user.gym_id || 1;

    const membroId = idValido(membro_id);
    if (!membroId) return res.status(400).json({ error: 'Escolha o atleta' });
    if (!TIPOS_TREINO.includes(tipo_treino)) return res.status(400).json({ error: 'Tipo de treino inválido' });
    if (!dataValida(data)) return res.status(400).json({ error: 'Data inválida' });
    if (typeof hora !== 'string' || !HORA_REGEX.test(hora)) return res.status(400).json({ error: 'Hora inválida' });
    const duracao = Number(duracao_min);
    if (!DURACOES.includes(duracao)) return res.status(400).json({ error: 'Duração inválida' });

    const semTreinador = treinador_id === undefined || treinador_id === null || treinador_id === '';
    const treinadorId = semTreinador ? null : idValido(treinador_id);
    if (!semTreinador && !treinadorId) return res.status(400).json({ error: 'Treinador inválido' });

    if (observacoes !== undefined && observacoes !== null && typeof observacoes !== 'string') {
        return res.status(400).json({ error: 'Observações inválidas' });
    }
    const notas = (observacoes ?? '').trim();
    if (notas.length > 500) return res.status(400).json({ error: 'Observações demasiado longas (máximo 500 caracteres)' });

    const inicio = `${data} ${hora}:00`;

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1, $2)', [CHAVE_BLOQUEIO, gymId]);

        const { rows: [tempo] } = await client.query(
            `SELECT ($1::timestamp < LOCALTIMESTAMP - interval '5 minutes') AS passado`,
            [inicio]
        );
        if (tempo.passado) throw new Recusa(400, 'A data e hora escolhidas já passaram');

        const atleta = await client.query(
            `SELECT id FROM usuarios WHERE id = $1 AND gym_id = $2 AND perfil_id = $3 AND status = 'ativo'`,
            [membroId, gymId, PERFIL_MEMBRO]
        );
        if (atleta.rows.length === 0) throw new Recusa(404, 'Atleta não encontrado ou inativo');

        if (treinadorId) {
            const treinador = await client.query(
                `SELECT id FROM usuarios WHERE id = $1 AND gym_id = $2 AND perfil_id = ANY($3::int[]) AND status = 'ativo'`,
                [treinadorId, gymId, PERFIS_TREINADOR]
            );
            if (treinador.rows.length === 0) throw new Recusa(404, 'Treinador não encontrado ou inativo');
        }

        // Choque de horário: existe outra sessão agendada que começa antes de esta acabar
        // e acaba depois de esta começar (sessões "encostadas" — uma a acabar quando a outra começa — são permitidas)
        const choque = (coluna, valor) =>
            client.query(
                `SELECT 1 FROM sessoes_treino
                 WHERE gym_id = $1 AND ${coluna} = $2 AND estado = 'agendada'
                   AND data_hora_inicio < $3::timestamp + ($4 * interval '1 minute')
                   AND data_hora_inicio + (duracao_min * interval '1 minute') > $3::timestamp
                     LIMIT 1`,
                [gymId, valor, inicio, duracao]
            );
        if ((await choque('membro_id', membroId)).rows.length > 0) {
            throw new Recusa(409, 'O atleta já tem uma sessão agendada nesse horário');
        }
        if (treinadorId && (await choque('treinador_id', treinadorId)).rows.length > 0) {
            throw new Recusa(409, 'O treinador já tem uma sessão agendada nesse horário');
        }

        const { rows: [sessao] } = await client.query(
            `INSERT INTO sessoes_treino
             (gym_id, membro_id, treinador_id, tipo_treino, data_hora_inicio, duracao_min, estado, observacoes, criado_por, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5::timestamp, $6, 'agendada', $7, $8, NOW(), NOW())
                 RETURNING id, estado`,
            [gymId, membroId, treinadorId, tipo_treino, inicio, duracao, notas === '' ? null : notas, req.user.id]
        );
        await client.query('COMMIT');
        res.status(201).json({ sessao });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        if (err instanceof Recusa) return res.status(err.status).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Erro ao agendar a sessão' });
    } finally {
        if (client) client.release();
    }
});

// PATCH /api/sessoes/:id/estado — concluir, marcar falta ou cancelar uma sessão agendada
router.patch('/:id/estado', auth, async (req, res) => {
    const id = idValido(req.params.id);
    const { estado } = req.body;
    const gymId = req.user.gym_id || 1;

    if (!id) return res.status(400).json({ error: 'Sessão inválida' });
    if (!ESTADOS_FINAIS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    try {
        // Um único UPDATE condicionado: só mexe numa sessão ainda "agendada" e, para concluir ou
        // marcar falta, que já tenha começado (cancelar pode fazer-se a qualquer momento).
        const { rows } = await pool.query(
            `UPDATE sessoes_treino SET estado = $1, updated_at = NOW()
             WHERE id = $2 AND gym_id = $3 AND estado = 'agendada'
               AND ($1 = 'cancelada' OR data_hora_inicio <= LOCALTIMESTAMP)
                 RETURNING id, estado`,
            [estado, id, gymId]
        );
        if (rows.length > 0) return res.json({ sessao: rows[0] });

        const { rows: [atual] } = await pool.query(
            'SELECT estado FROM sessoes_treino WHERE id = $1 AND gym_id = $2',
            [id, gymId]
        );
        if (!atual) return res.status(404).json({ error: 'Sessão não encontrada' });
        if (atual.estado !== 'agendada') return res.status(409).json({ error: 'Esta sessão já não está agendada' });
        return res.status(409).json({ error: 'Só é possível concluir ou marcar falta numa sessão que já começou' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar a sessão' });
    }
});

module.exports = router;