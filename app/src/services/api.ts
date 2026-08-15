const API_URL = 'http://localhost:5000/api';

// Helper para headers com token
const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

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

    async register(userData: any) {
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
        if (!res.ok) throw new Error('Erro ao carregar dashboard');
        return res.json();
    },

    // Membros
    async getMembros() {
        const res = await fetch(`${API_URL}/membros`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Erro ao buscar membros');
        return res.json();
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