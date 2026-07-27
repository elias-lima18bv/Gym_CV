import {useState} from "react";
import {
    Building2,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    Dumbbell,
    Layers,
    Map,
    Users
} from "lucide-react";
import {toast} from "sonner";

const steps = [
  { id: "gym", label: "Ginasio", icon: Building2, description: "Configure os dados do seu ginasio" },
  { id: "schedule", label: "Horario", icon: Clock, description: "Defina o horario de funcionamento" },
  { id: "areas", label: "Areas", icon: Map, description: "Cadastre as areas de treino" },
  { id: "team", label: "Equipa", icon: Users, description: "Adicione a sua equipa" },
  { id: "plans", label: "Planos", icon: Layers, description: "Crie planos de matricula" },
  { id: "billing", label: "Faturacao", icon: CreditCard, description: "Configure pagamentos" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [gymData, setGymData] = useState({ name: "", address: "", phone: "" });
  const [hours, setHours] = useState({ open: "06:00", close: "22:00" });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
      toast.success("Configuracao concluida! Bem-vindo ao GymMaster.");
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (completed) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-[#22C55E]" />
          </div>
          <h2 className="text-[#F2F2F2] font-bold text-2xl mb-2">Configuracao Concluida!</h2>
          <p className="text-[#B0AEAA] text-sm mb-6">O seu ginasio esta pronto para comecar. Pode agora gerir membros, registar pagamentos e acompanhar o crescimento do seu negocio.</p>
          <button
            onClick={() => { setCompleted(false); setCurrentStep(0); }}
            className="px-6 py-3 gradient-orange rounded-md text-white font-semibold hover:brightness-110 transition-all cursor-pointer"
          >
            Voltar ao Inicio
          </button>
        </div>
      </div>
    );
  }

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i < currentStep
                        ? "bg-[#22C55E] text-white"
                        : i === currentStep
                        ? "bg-[#FF6B00] text-white"
                        : "bg-[#2B2B2B] border-2 border-[#4A4A4A] text-[#B0AEAA]"
                    }`}
                  >
                    {i < currentStep ? <CheckCircle size={16} /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${i === currentStep ? "text-[#FF6B00]" : "text-[#B0AEAA]"}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 transition-all ${i < currentStep ? "bg-[#22C55E]" : "bg-[#4A4A4A]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[4px] bg-[rgba(255,107,0,0.15)] flex items-center justify-center">
              <StepIcon size={20} className="text-[#FF6B00]" />
            </div>
            <div>
              <h3 className="text-[#F2F2F2] font-semibold text-lg">{steps[currentStep].label}</h3>
              <p className="text-[#B0AEAA] text-sm">{steps[currentStep].description}</p>
            </div>
          </div>

          {/* Step Forms */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Nome do Ginasio</label>
                <input type="text" value={gymData.name} onChange={(e) => setGymData({ ...gymData, name: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="Ex: Ginasio Cabo Verde" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Endereco</label>
                <input type="text" value={gymData.address} onChange={(e) => setGymData({ ...gymData, address: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="Praia, Cabo Verde" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Telefone</label>
                <input type="tel" value={gymData.phone} onChange={(e) => setGymData({ ...gymData, phone: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" placeholder="+238 XXX XXX XXX" />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Abertura</label>
                  <input type="time" value={hours.open} onChange={(e) => setHours({ ...hours, open: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-1.5">Fecho</label>
                  <input type="time" value={hours.close} onChange={(e) => setHours({ ...hours, close: e.target.value })} className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
                  <span key={d} className="px-3 py-1 bg-[rgba(34,197,94,0.15)] text-[#22C55E] text-xs font-medium rounded-full">{d}</span>
                ))}
                <span className="px-3 py-1 bg-[rgba(239,68,68,0.15)] text-[#EF4444] text-xs font-medium rounded-full">Dom - Fechado</span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Musculacao", icon: Dumbbell },
                { name: "Cardio", icon: "Heart" },
                { name: "CrossFit", icon: "Flame" },
                { name: "Yoga", icon: "Sparkles" },
              ].map((area, i) => (
                <div key={i} className="bg-[#2B2B2B] border border-[#4A4A4A] rounded-lg p-4 text-center hover:border-[#FF6B00] transition-colors cursor-pointer">
                  <p className="text-[#F2F2F2] text-sm font-medium">{area.name}</p>
                  <p className="text-[#B0AEAA] text-xs mt-1">Ativo</p>
                </div>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <p className="text-[#B0AEAA] text-sm">A sua equipa ja foi configurada com os seguintes membros:</p>
              {["Administrador", "Gerente", "Treinadores (2)", "Rececionista"].map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[#F2F2F2] text-sm">
                  <CheckCircle size={14} className="text-[#22C55E]" />
                  {r}
                </div>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              <p className="text-[#B0AEAA] text-sm">Planos de membro configurados:</p>
              {["Basico - 3.500 CVE/mes", "Premium - 5.500 CVE/mes", "Estudante - 2.500 CVE/mes", "Familia - 12.000 CVE/mes"].map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[#F2F2F2] text-sm">
                  <CheckCircle size={14} className="text-[#22C55E]" />
                  {p}
                </div>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-[#2B2B2B] border border-[#4A4A4A] rounded-lg p-4">
                <p className="text-[#F2F2F2] font-medium text-sm mb-2">Metodos de Pagamento</p>
                <div className="flex flex-wrap gap-2">
                  {["Dinheiro", "Transferencia Bancaria", "Cartao de Credito", "POS Movel"].map((m) => (
                    <span key={m} className="px-3 py-1 bg-[rgba(255,107,0,0.15)] text-[#FF6B00] text-xs font-medium rounded-full">{m}</span>
                  ))}
                </div>
              </div>
              <div className="bg-[#2B2B2B] border border-[#4A4A4A] rounded-lg p-4">
                <p className="text-[#F2F2F2] font-medium text-sm mb-1">Moeda</p>
                <p className="text-[#B0AEAA] text-xs">Escudo cabo-verdiano (CVE)</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              currentStep === 0
                ? "bg-[#2B2B2B] text-[#4A4A4A] cursor-not-allowed"
                : "bg-[#353535] border border-[#4A4A4A] text-[#B0AEAA] hover:text-[#F2F2F2]"
            }`}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 gradient-orange rounded-md text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
          >
            {currentStep === steps.length - 1 ? "Finalizar" : "Proximo"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
