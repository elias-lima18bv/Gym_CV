// Os "value" são exatamente os aceites pela base de dados (restrição sessoes_treino_tipo_check)
// e pelo backend (server/src/routes/sessoes.js). Se mudares um, muda os três.
export const TIPOS_TREINO = [
    { value: "musculacao", label: "Musculação" },
    { value: "cardio", label: "Cardio" },
    { value: "crossfit", label: "CrossFit" },
    { value: "yoga", label: "Yoga" },
    { value: "pilates", label: "Pilates" },
    { value: "luta", label: "Luta" },
];

export const DURACOES = [30, 45, 60, 90, 120];

export function rotuloTipo(valor: string): string {
    return TIPOS_TREINO.find((t) => t.value === valor)?.label ?? valor;
}