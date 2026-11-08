const API_URL = '/api';

// Helper para headers com token (requisições JSON)
const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// Helper para requisições multipart (upload de foto) — NUNCA definir Content-Type
// manualmente aqui, o navegador precisa gerar o boundary correto sozinho.
const getAuthHeaderOnly = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token || ''}`,
    };
};

// Lê o corpo da resposta como JSON. Se o servidor devolver outra coisa (tipicamente a página HTML
// "Cannot GET ...", quando a rota não existe ou o backend não foi reiniciado), diz o que se passou
// em vez de mostrar "Unexpected token '<'".
async function lerJson(res: Response): ReturnType<Response['json']> {
    try {
        return await res.json();
    } catch {
        const caminho = (res.url || '').replace(/^https?:\/\/[^/]+/, '');
        throw new Error(
            `Resposta inesperada do servidor (HTTP ${res.status}) em ${caminho || 'pedido'}. ` +
            'Confirme que o backend está a correr e que foi reiniciado depois de acrescentar rotas novas.'
        );
    }
}

export interface RegisterData {
    nome: string;
    email: string;
    telefone: string;
    senha: string;
    data_nascimento: string | null;
    genero: string | null;
    bi: string;
    gym_id: number;
}

export interface FaturaPendente {
    id: number;
    membro_id: number;
    nome: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    vencida: boolean;
}

export interface PagamentoAvulso {
    membro_id: number;
    descricao: string;
    valor: number;
    metodo_pagamento: string;
}

export interface RelatorioLinha {
    id: number;
    data: string;
    membro: string | null;
    descricao: string | null;
    tipo: 'Plano' | 'Extra';
    valor: number;
    moeda: string | null;
    metodo_pagamento: string | null;
    status: string;
    data_vencimento: string | null;
    registado_por: string | null;
}

export interface RelatorioFinanceiro {
    de: string;
    ate: string;
    resumo: {
        quantidade: number;
        total_pago: number;
        total_pendente: number;
        pago_planos: number;
        pago_extras: number;
    };
    linhas: RelatorioLinha[];
}

export interface Treinador {
    id: number;
    nome: string;
    proximas: number; // sessões agendadas que ainda tem pela frente
}

export interface Sessao {
    id: number;
    membro_id: number;
    atleta: string;
    foto_url: string | null;
    treinador_id: number | null;
    treinador: string | null;
    tipo_treino: string;
    data: string; // AAAA-MM-DD
    hora: string; // HH:MM
    duracao_min: number;
    estado: string;
    observacoes: string | null;
    iniciada: boolean; // já passou a hora de início
    atrasada: boolean; // já acabou e continua "agendada" (falta concluir ou marcar falta)
}

export interface SessaoNova {
    membro_id: number;
    treinador_id: number | null;
    tipo_treino: string;
    data: string;
    hora: string;
    duracao_min: number;
    observacoes: string;
}

export interface ResumoSessoes {
    total: number;
    agendadas: number;
    proximas: number;
    hoje: number;
}

export const api = {
    // Auth
    async login(email: string, senha: string) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }), // ← estava "password", agora é "senha"
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        return data;
    },

    async register(userData: RegisterData) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        return data;
    },

    async getMe() {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Não autenticado');
        return lerJson(res);
    },

    // Dashboard
    async getDashboardStats() {
        const res = await fetch(`${API_URL}/dashboard/stats`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar dashboard');
        return data;
    },

    // Gráfico de receitas: periodo = '7d' | '30d' | '90d' | '1y'
    async getReceitas(periodo: string) {
        const res = await fetch(`${API_URL}/dashboard/receitas?periodo=${periodo}`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar receitas');
        return data as { data: string; planos: number; extras: number }[];
    },

    // Pagamentos (Ações Rápidas do dashboard)
    async getFaturasPendentes() {
        const res = await fetch(`${API_URL}/pagamentos/pendentes`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar faturas pendentes');
        return data as FaturaPendente[];
    },

    async pagarFatura(id: number, metodo_pagamento: string) {
        const res = await fetch(`${API_URL}/pagamentos/${id}/pagar`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ metodo_pagamento }),
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao registar o pagamento');
        return data;
    },

    async createPagamentoAvulso(payload: PagamentoAvulso) {
        const res = await fetch(`${API_URL}/pagamentos/avulso`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao registar o pagamento');
        return data;
    },

    // Relatório financeiro: datas no formato AAAA-MM-DD
    async getRelatorioFinanceiro(de: string, ate: string) {
        const res = await fetch(`${API_URL}/relatorios/financeiro?de=${de}&ate=${ate}`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar o relatório');
        return data as RelatorioFinanceiro;
    },

    // Sessões de treino
    // Todos os filtros são opcionais; "de" e "ate" (AAAA-MM-DD) incluem o próprio dia
    async getSessoes(estado?: string, de?: string, ate?: string) {
        const params = new URLSearchParams();
        if (estado) params.set('estado', estado);
        if (de) params.set('de', de);
        if (ate) params.set('ate', ate);
        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(`${API_URL}/sessoes${query}`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar sessões');
        return data as Sessao[];
    },

    async getResumoSessoes() {
        const res = await fetch(`${API_URL}/sessoes/resumo`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar o resumo das sessões');
        return data as ResumoSessoes;
    },

    async getTreinadores() {
        const res = await fetch(`${API_URL}/sessoes/treinadores`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar treinadores');
        return data as Treinador[];
    },

    async createSessao(payload: SessaoNova) {
        const res = await fetch(`${API_URL}/sessoes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao agendar a sessão');
        return data;
    },

    // estado: 'concluida' | 'faltou' | 'cancelada'
    async atualizarEstadoSessao(id: number, estado: string) {
        const res = await fetch(`${API_URL}/sessoes/${id}/estado`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ estado }),
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao atualizar a sessão');
        return data;
    },

    // Planos
    async getPlanos() {
        const res = await fetch(`${API_URL}/planos`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar planos');
        return data;
    },

    // Membros
    async getMembros() {
        const res = await fetch(`${API_URL}/membros`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar membros');
        return data;
    },

    // Recebe um FormData já montado pelo componente (campos + arquivo 'foto' opcional)
    async createMembro(formData: FormData) {
        const res = await fetch(`${API_URL}/membros`, {
            method: 'POST',
            headers: getAuthHeaderOnly(),
            body: formData,
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao cadastrar membro');
        return data;
    },

    async updateMembro(id: number | string, formData: FormData) {
        const res = await fetch(`${API_URL}/membros/${id}`, {
            method: 'PUT',
            headers: getAuthHeaderOnly(),
            body: formData,
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao atualizar membro');
        return data;
    },

    async deleteMembro(id: number | string) {
        const res = await fetch(`${API_URL}/membros/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao desativar membro');
        return data;
    },

    // Assinaturas (trocar/renovar plano)
    async assignPlano(payload: { membro_id: number | string; plano_id: number | string; valor_pago?: string; metodo_pagamento?: string }) {
        const res = await fetch(`${API_URL}/assinaturas`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao trocar/renovar plano');
        return data;
    },

    async getHistoricoAssinaturas(membroId: number | string) {
        const res = await fetch(`${API_URL}/assinaturas/membro/${membroId}`, { headers: getHeaders() });
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar histórico de assinaturas');
        return data;
    },

    // Check-in por QR ou PIN
    async checkin(credencial: string, method: 'qr' | 'pin') {
        let res: Response;
        try {
            res = await fetch(`${API_URL}/checkin`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ credencial, method }),
            });
        } catch {
            throw new Error('Falha na conexão com o servidor');
        }
        const data = await lerJson(res);
        if (!res.ok) throw new Error(data.error ?? 'Erro ao processar check-in');
        return data as {
            success: boolean;
            type: 'entrada' | 'saida';
            member: { name: string };
            timestamp: string;
        };
    },

    // Upload
    async uploadPhoto(file: File) {
        const formData = new FormData();
        formData.append('photo', file);

        const res = await fetch(`${API_URL}/upload/photo`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
            body: formData,
        });
        if (!res.ok) throw new Error('Erro no upload');
        return lerJson(res);
    },
};