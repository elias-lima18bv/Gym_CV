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

export const api = {
    // Auth
    async login(email: string, senha: string) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }), // ← estava "password", agora é "senha"
        });
        const data = await res.json();
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem('token', data.token);
        return data;
    },

    async getMe() {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Não autenticado');
        return res.json();
    },

    // Dashboard
    async getDashboardStats() {
        const res = await fetch(`${API_URL}/dashboard/stats`, { headers: getHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar dashboard');
        return data;
    },

    // Gráfico de receitas: periodo = '7d' | '30d' | '90d' | '1y'
    async getReceitas(periodo: string) {
        const res = await fetch(`${API_URL}/dashboard/receitas?periodo=${periodo}`, { headers: getHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar receitas');
        return data as { data: string; planos: number; extras: number }[];
    },

    // Planos
    async getPlanos() {
        const res = await fetch(`${API_URL}/planos`, { headers: getHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar planos');
        return data;
    },

    // Membros
    async getMembros() {
        const res = await fetch(`${API_URL}/membros`, { headers: getHeaders() });
        const data = await res.json();
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao cadastrar membro');
        return data;
    },

    async updateMembro(id: number | string, formData: FormData) {
        const res = await fetch(`${API_URL}/membros/${id}`, {
            method: 'PUT',
            headers: getAuthHeaderOnly(),
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao atualizar membro');
        return data;
    },

    async deleteMembro(id: number | string) {
        const res = await fetch(`${API_URL}/membros/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await res.json();
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erro ao trocar/renovar plano');
        return data;
    },

    async getHistoricoAssinaturas(membroId: number | string) {
        const res = await fetch(`${API_URL}/assinaturas/membro/${membroId}`, { headers: getHeaders() });
        const data = await res.json();
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
        const data = await res.json();
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
        return res.json();
    },
};