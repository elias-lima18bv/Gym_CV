import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { toast } from "sonner";

type FormErrors = Partial<Record<keyof typeof initialForm | "confirmarSenha", string>>;

const initialForm = {
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
    data_nascimento: "",
    genero: "",
    bi: "",
    gym_id: 1,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mesmas regras do backend (server/src/routes/auth.js) — validação client-side
// serve para feedback imediato; o backend continua sendo a fonte da verdade.
function validarCadastro(form: typeof initialForm): FormErrors {
    const errors: FormErrors = {};

    if (!form.nome.trim() || form.nome.trim().length < 3) {
        errors.nome = "Nome deve ter pelo menos 3 caracteres";
    }
    if (!form.email || !EMAIL_REGEX.test(form.email)) {
        errors.email = "Email inválido";
    }
    if (!form.telefone || form.telefone.trim().length < 7) {
        errors.telefone = "Telefone inválido";
    }
    if (!form.senha || form.senha.length < 6) {
        errors.senha = "Senha deve ter pelo menos 6 caracteres";
    }
    if (form.senha !== form.confirmarSenha) {
        errors.confirmarSenha = "As senhas não coincidem";
    }
    if (!form.bi || form.bi.trim().length < 5) {
        errors.bi = "BI inválido";
    }
    if (!form.data_nascimento) {
        errors.data_nascimento = "Data de nascimento é obrigatória";
    } else if (new Date(form.data_nascimento) > new Date()) {
        errors.data_nascimento = "Data de nascimento não pode ser no futuro";
    }
    if (!form.genero) {
        errors.genero = "Género é obrigatório";
    }

    return errors;
}

function validarLogin(form: typeof initialForm): FormErrors {
    const errors: FormErrors = {};
    if (!form.email || !EMAIL_REGEX.test(form.email)) {
        errors.email = "Email inválido";
    }
    if (!form.senha) {
        errors.senha = "Senha é obrigatória";
    }
    return errors;
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-red-500 text-xs mt-1 ml-1">{message}</p>;
}

export default function Auth() {
    const { login } = useApp();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const [form, setForm] = useState(initialForm);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Limpa o erro do campo assim que o usuário começa a corrigir
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = isRegister ? validarCadastro(form) : validarLogin(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Corrija os campos destacados");
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            if (isRegister) {
                const data = await api.register({
                    nome: form.nome.trim(),
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
        } catch (err: any) {
            // Erros de duplicidade (409) do backend vêm com mensagens específicas
            // ("Email já cadastrado" / "Já existe um membro cadastrado com esse nome")
            const message = err?.message ?? "Erro inesperado. Tente novamente.";

            if (message.toLowerCase().includes("email")) {
                setErrors((prev) => ({ ...prev, email: message }));
            } else if (message.toLowerCase().includes("nome")) {
                setErrors((prev) => ({ ...prev, nome: message }));
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (hasError?: string) =>
        `w-full px-4 py-3 rounded-xl bg-[hsl(0,0%,21%)] border text-[hsl(0,0%,95%)] placeholder-[hsl(0,0%,50%)] focus:outline-none focus:ring-1 transition-all ${
            hasError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-[hsl(0,0%,29%)] focus:border-orange-500 focus:ring-orange-500"
        }`;

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

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {isRegister && (
                        <>
                            <div>
                                <input
                                    name="nome"
                                    placeholder="Nome completo"
                                    value={form.nome}
                                    onChange={handleChange}
                                    className={inputClass(errors.nome)}
                                />
                                <FieldError message={errors.nome} />
                            </div>

                            <div>
                                <input
                                    name="telefone"
                                    placeholder="Telefone"
                                    value={form.telefone}
                                    onChange={handleChange}
                                    className={inputClass(errors.telefone)}
                                />
                                <FieldError message={errors.telefone} />
                            </div>

                            <div>
                                <input
                                    name="bi"
                                    placeholder="Número do BI"
                                    value={form.bi}
                                    onChange={handleChange}
                                    className={inputClass(errors.bi)}
                                />
                                <FieldError message={errors.bi} />
                            </div>

                            <div>
                                <input
                                    name="data_nascimento"
                                    type="date"
                                    value={form.data_nascimento}
                                    onChange={handleChange}
                                    className={inputClass(errors.data_nascimento)}
                                />
                                <FieldError message={errors.data_nascimento} />
                            </div>

                            <div>
                                <select
                                    name="genero"
                                    value={form.genero}
                                    onChange={handleChange}
                                    className={inputClass(errors.genero)}
                                >
                                    <option value="" className="bg-[hsl(0,0%,21%)]">Gênero</option>
                                    <option value="M" className="bg-[hsl(0,0%,21%)]">Masculino</option>
                                    <option value="F" className="bg-[hsl(0,0%,21%)]">Feminino</option>
                                </select>
                                <FieldError message={errors.genero} />
                            </div>
                        </>
                    )}

                    <div>
                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            className={inputClass(errors.email)}
                        />
                        <FieldError message={errors.email} />
                    </div>

                    <div>
                        <input
                            name="senha"
                            type="password"
                            placeholder="Senha"
                            value={form.senha}
                            onChange={handleChange}
                            className={inputClass(errors.senha)}
                        />
                        <FieldError message={errors.senha} />
                    </div>

                    {isRegister && (
                        <div>
                            <input
                                name="confirmarSenha"
                                type="password"
                                placeholder="Confirmar senha"
                                value={form.confirmarSenha}
                                onChange={handleChange}
                                className={inputClass(errors.confirmarSenha)}
                            />
                            <FieldError message={errors.confirmarSenha} />
                        </div>
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
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setErrors({});
                        }}
                        className="text-orange-500 hover:text-orange-400 font-medium"
                    >
                        {isRegister ? "Entrar" : "Criar conta"}
                    </button>
                </p>
            </div>
        </div>
    );
}