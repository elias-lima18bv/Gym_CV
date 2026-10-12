import { useState, useCallback, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, Hash, CheckCircle, XCircle, Camera } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/services/api";
import { gymAreas } from "@/data/mockData";

type CheckInMode = "qr" | "pin";
type CheckInResult = "idle" | "success" | "error";
type CheckInType = "entrada" | "saida";

function QrScanner({ onScan }: { onScan: (pin: string) => void }) {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: 250 },
            false
        );

        let hasScanned = false;

        scanner.render(
            (decodedText) => {
                // Evita disparos duplicados enquanto a câmera continua ativa
                if (hasScanned) return;
                hasScanned = true;
                onScan(decodedText);
                scanner.clear().catch(() => {});
            },
            () => {
                // Ignora falhas de leitura frame a frame (nenhum QR no quadro ainda)
            }
        );

        return () => {
            scanner.clear().catch(() => {});
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div id="qr-reader" className="rounded-xl overflow-hidden" />;
}

function CheckIn() {
    const [mode, setMode] = useState<CheckInMode>("qr");
    const [selectedAreaId, setSelectedAreaId] = useState<string>(gymAreas[0]?.id ?? "");
    const [pin, setPin] = useState("");
    const [result, setResult] = useState<CheckInResult>("idle");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [lastCheckin, setLastCheckin] = useState<{
        name: string;
        area: string;
        time: string;
        type: CheckInType;
    } | null>(null);

    const selectedArea = gymAreas.find((a) => a.id === selectedAreaId);

    const processCheckIn = useCallback(
        async (credencial: string, method: CheckInMode) => {
            setIsSubmitting(true);
            try {
                const data = await api.checkin(credencial, method);

                setResult("success");
                setLastCheckin({
                    name: data.member.name,
                    area: selectedArea?.name ?? "",
                    time: formatDateTime(data.timestamp),
                    type: data.type,
                });
                toast.success(
                    `${data.type === "entrada" ? "Entrada" : "Saída"} confirmada: ${data.member.name}`
                );
                setTimeout(() => {
                    setPin("");
                    setResult("idle");
                }, 3000);
            } catch (err) {
                // A mensagem vem do backend: "Credencial não encontrada", "Membro inativo",
                // "Sem assinatura ativa", "Assinatura vencida", etc.
                const message = err instanceof Error ? err.message : "Erro ao processar check-in";
                setErrorMessage(message);
                setResult("error");
                toast.error(message);
                setTimeout(() => {
                    setPin("");
                    setResult("idle");
                }, 2500);
            } finally {
                setIsSubmitting(false);
            }
        },
        [selectedArea]
    );

    const handlePinDigit = useCallback(
        (digit: string) => {
            if (pin.length >= 4 || isSubmitting) return;
            const newPin = pin + digit;
            setPin(newPin);

            if (newPin.length === 4) {
                setTimeout(() => processCheckIn(newPin, "pin"), 300);
            }
        },
        [pin, isSubmitting, processCheckIn]
    );

    const clearPin = () => setPin("");

    const handleQrScan = useCallback(
        (decodedPin: string) => {
            if (isSubmitting) return;
            processCheckIn(decodedPin, "qr");
        },
        [isSubmitting, processCheckIn]
    );

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            <div className="max-w-2xl mx-auto">
                {/* Mode Toggle */}
                <div className="flex bg-[#353535] border border-[#4A4A4A] rounded-xl p-1 mb-6">
                    <button
                        onClick={() => {
                            setMode("qr");
                            setPin("");
                            setResult("idle");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            mode === "qr" ? "bg-[#FF6B00] text-white" : "text-[#B0AEAA] hover:text-[#F2F2F2]"
                        }`}
                    >
                        <QrCode size={18} />
                        QR Code
                    </button>
                    <button
                        onClick={() => {
                            setMode("pin");
                            setResult("idle");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            mode === "pin" ? "bg-[#FF6B00] text-white" : "text-[#B0AEAA] hover:text-[#F2F2F2]"
                        }`}
                    >
                        <Hash size={18} />
                        PIN
                    </button>
                </div>

                {/* Area Selector */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-2">Área de Acesso</label>
                    <div className="flex flex-wrap gap-2">
                        {gymAreas.map((area) => (
                            <button
                                key={area.id}
                                onClick={() => setSelectedAreaId(area.id)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                    selectedAreaId === area.id
                                        ? "bg-[rgba(255,107,0,0.15)] text-[#FF6B00] border border-[#FF6B00]"
                                        : "bg-[#353535] border border-[#4A4A4A] text-[#B0AEAA] hover:text-[#F2F2F2]"
                                }`}
                            >
                                {area.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* QR Mode */}
                {mode === "qr" && (
                    <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-6">
                        {result === "idle" && (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="w-full max-w-xs">
                                        <QrScanner onScan={handleQrScan} />
                                    </div>
                                </div>
                                <p className="text-center text-[#B0AEAA] text-sm flex items-center justify-center gap-2">
                                    <Camera size={16} />
                                    Aponte a câmera para o QR Code do membro
                                </p>
                            </>
                        )}

                        {result === "success" && lastCheckin && (
                            <div className="text-center py-8 animate-scale-in">
                                <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={40} className="text-[#22C55E]" />
                                </div>
                                <h3 className="text-[#22C55E] font-semibold text-xl mb-1">
                                    {lastCheckin.type === "entrada" ? "Entrada Confirmada!" : "Saída Confirmada!"}
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-[#F2F2F2] text-lg font-medium">{lastCheckin.name}</p>
                                    <p className="text-[#B0AEAA] text-sm">{lastCheckin.area}</p>
                                    <p className="text-[#B0AEAA] text-xs">{lastCheckin.time}</p>
                                </div>
                            </div>
                        )}

                        {result === "error" && (
                            <div className="text-center py-8 animate-scale-in">
                                <div className="w-20 h-20 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center mx-auto mb-4">
                                    <XCircle size={40} className="text-[#EF4444]" />
                                </div>
                                <h3 className="text-[#EF4444] font-semibold text-xl mb-1">Check-in Inválido</h3>
                                <p className="text-[#B0AEAA] text-sm">{errorMessage}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* PIN Mode */}
                {mode === "pin" && (
                    <div className="bg-[#353535] border border-[#4A4A4A] rounded-xl p-6">
                        {result === "idle" && (
                            <>
                                {/* PIN Display */}
                                <div className="flex justify-center gap-3 mb-8">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                                                i < pin.length
                                                    ? "border-[#FF6B00] bg-[rgba(255,107,0,0.1)] text-[#FF6B00]"
                                                    : "border-[#4A4A4A] bg-[#2B2B2B] text-[#B0AEAA]"
                                            }`}
                                        >
                                            {i < pin.length ? "*" : ""}
                                        </div>
                                    ))}
                                </div>

                                {/* Keypad */}
                                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "<"].map((key) => (
                                        <button
                                            key={key}
                                            disabled={isSubmitting}
                                            onClick={() => {
                                                if (key === "C") clearPin();
                                                else if (key === "<") setPin(pin.slice(0, -1));
                                                else handlePinDigit(key);
                                            }}
                                            className={`h-14 rounded-xl text-lg font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                                key === "C"
                                                    ? "bg-[rgba(239,68,68,0.1)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]"
                                                    : key === "<"
                                                        ? "bg-[#404040] text-[#B0AEAA] hover:bg-[#4A4A4A]"
                                                        : "bg-[#2B2B2B] border border-[#4A4A4A] text-[#F2F2F2] hover:bg-[#404040] active:scale-95"
                                            }`}
                                        >
                                            {key === "<" ? "Del" : key}
                                        </button>
                                    ))}
                                </div>

                                <p className="text-center text-[#B0AEAA] text-xs mt-4">
                                    Introduza o PIN de 4 dígitos do membro
                                </p>
                            </>
                        )}

                        {result === "success" && lastCheckin && (
                            <div className="text-center py-8 animate-scale-in">
                                <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={40} className="text-[#22C55E]" />
                                </div>
                                <h3 className="text-[#22C55E] font-semibold text-xl mb-1">
                                    {lastCheckin.type === "entrada" ? "Entrada Confirmada!" : "Saída Confirmada!"}
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-[#F2F2F2] text-lg font-medium">{lastCheckin.name}</p>
                                    <p className="text-[#B0AEAA] text-sm">{lastCheckin.area}</p>
                                    <p className="text-[#B0AEAA] text-xs">{lastCheckin.time}</p>
                                </div>
                            </div>
                        )}

                        {result === "error" && (
                            <div className="text-center py-8 animate-scale-in">
                                <div className="w-20 h-20 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center mx-auto mb-4">
                                    <XCircle size={40} className="text-[#EF4444]" />
                                </div>
                                <h3 className="text-[#EF4444] font-semibold text-xl mb-1">Check-in Inválido</h3>
                                <p className="text-[#B0AEAA] text-sm">{errorMessage}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CheckIn;
