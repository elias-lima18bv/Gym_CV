import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { toast } from "sonner";

export default function Auth() {
    const { login } = useApp();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        nome: "",
        email: "",
        telefone: "",
        senha: "",
        confirmarSenha: "",
        data_nascimento: "",
        genero: "",
        bi: "",
        gym_id: 1,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isRegister) {
                if (form.senha !== form.confirmarSenha) {
                    toast.error("As senhas não coincidem");
                    setLoading(false);
                    return;
                }
                const data = await api.register({
                    nome: form.nome,
                    email: form.email,
                    telefone: form.telefone,
                    senha: form.senha,
                    data_nascimento: form.data_nascimento || null,
                    genero: form.genero || null,
                    bi: form.bi,
                    gym_id: form.gym_id,
                });
                login(data.token, data.user);
                toast.success("Conta criada com sucesso!");
            } else {
                const data = await api.login(form.email, form.senha);
                login(data.token, data.user);
                toast.success("Bem-vindo de volta!");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro desconhecido");
        }
    };

    const inputClass =
        "w-full px-4 py-3 rounded-xl bg-[hsl(0,0%,21%)] border border-[hsl(0,0%,29%)] text-[hsl(0,0%,95%)] placeholder-[hsl(0,0%,50%)] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all";

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[hsl(0,0%,17%)] p-4">
            <div className="w-full max-w-md bg-[hsl(0,0%,21%)] rounded-2xl p-8 shadow-2xl border border-[hsl(0,0%,29%)]">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-orange-500 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-[hsl(0,0%,95%)]">Gym-Elias</h1>
                    <p className="text-[hsl(0,0%,60%)] mt-1">
                        {isRegister ? "Crie sua conta" : "Entre na sua conta"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <>
                            <input name="nome" placeholder="Nome completo" value={form.nome} onChange={handleChange} required className={inputClass} />
                            <input name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} className={inputClass} />
                            <input name="bi" placeholder="Número do BI" value={form.bi} onChange={handleChange} required className={inputClass} />
                            <input name="data_nascimento" type="date" value={form.data_nascimento} onChange={handleChange} className={inputClass} />
                            <select name="genero" value={form.genero} onChange={handleChange} className={inputClass}>
                                <option value="" className="bg-[hsl(0,0%,21%)]">Gênero</option>
                                <option value="M" className="bg-[hsl(0,0%,21%)]">Masculino</option>
                                <option value="F" className="bg-[hsl(0,0%,21%)]">Feminino</option>
                            </select>
                        </>
                    )}

                    <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className={inputClass} />
                    <input name="senha" type="password" placeholder="Senha" value={form.senha} onChange={handleChange} required className={inputClass} />

                    {isRegister && (
                        <input name="confirmarSenha" type="password" placeholder="Confirmar senha" value={form.confirmarSenha} onChange={handleChange} required className={inputClass} />
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                    >
                        {loading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
                    </button>
                </form>

                <p className="mt-6 text-center text-[hsl(0,0%,60%)] text-sm">
                    {isRegister ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-orange-500 hover:text-orange-400 font-medium"
                    >
                        {isRegister ? "Entrar" : "Criar conta"}
                    </button>
                </p>
            </div>
        </div>
    );
}