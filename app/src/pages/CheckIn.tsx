import {useCallback, useState} from "react";
import {useApp} from "@/context/AppContext";
import {QRCodeSVG} from "qrcode.react";
import {Camera, CheckCircle, Hash, QrCode, XCircle} from "lucide-react";
import {formatDateTime} from "@/lib/utils";
import {toast} from "sonner";
import {gymAreas} from "@/data/mockData";

type CheckInMode = "qr" | "pin";
type CheckInResult = "idle" | "success" | "error";

export default function CheckIn() {
  const { members, addAttendance } = useApp();
  const [mode, setMode] = useState<CheckInMode>("qr");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>(gymAreas[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<CheckInResult>("idle");
  const [lastCheckin, setLastCheckin] = useState<{ name: string; area: string; time: string } | null>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedArea = gymAreas.find((a) => a.id === selectedAreaId);

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        setTimeout(() => processCheckIn(newPin), 300);
      }
    },
    [pin]
  );

  const processCheckIn = (enteredPin: string) => {
    const member = members.find((m) => m.pin === enteredPin);
    if (!member) {
      setResult("error");
      toast.error("PIN invalido! Membro nao encontrado.");
      setTimeout(() => {
        setPin("");
        setResult("idle");
      }, 2000);
      return;
    }

    if (member.status !== "active") {
      setResult("error");
      toast.error("Membro inativo! Nao e possivel fazer check-in.");
      setTimeout(() => {
        setPin("");
        setResult("idle");
      }, 2000);
      return;
    }

    addAttendance({
      memberId: member.id,
      areaId: selectedAreaId,
      timestamp: new Date().toISOString(),
      method: "pin",
    });

    setResult("success");
    setLastCheckin({
      name: member.name,
      area: selectedArea?.name ?? "",
      time: formatDateTime(new Date().toISOString()),
    });
    toast.success(`Check-in confirmado: ${member.name}`);
    setTimeout(() => {
      setPin("");
      setResult("idle");
    }, 3000);
  };

  const handleQrCheckIn = () => {
    if (!selectedMember) {
      toast.error("Selecione um membro primeiro");
      return;
    }
    if (selectedMember.status !== "active") {
      toast.error("Membro inativo!");
      return;
    }
    addAttendance({
      memberId: selectedMember.id,
      areaId: selectedAreaId,
      timestamp: new Date().toISOString(),
      method: "qr",
    });
    setResult("success");
    setLastCheckin({
      name: selectedMember.name,
      area: selectedArea?.name ?? "",
      time: formatDateTime(new Date().toISOString()),
    });
    toast.success(`Check-in confirmado: ${selectedMember.name}`);
    setTimeout(() => setResult("idle"), 3000);
  };

  const clearPin = () => setPin("");

  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Mode Toggle */}
        <div className="flex bg-[#353535] border border-[#4A4A4A] rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode("qr"); setPin(""); setResult("idle"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              mode === "qr" ? "bg-[#FF6B00] text-white" : "text-[#B0AEAA] hover:text-[#F2F2F2]"
            }`}
          >
            <QrCode size={18} />
            QR Code
          </button>
          <button
            onClick={() => { setMode("pin"); setResult("idle"); }}
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
          <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-2">Area de Acesso</label>
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
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#B0AEAA] uppercase mb-2">Selecionar Membro</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-[#2B2B2B] border border-[#4A4A4A] rounded-md px-3 py-2.5 text-sm text-[#F2F2F2] focus:outline-none focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="">-- Escolher membro --</option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {selectedMember && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-xl p-4">
                    <QRCodeSVG
                      value={`GYM-${selectedMember.id}-${Date.now()}`}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>
                <p className="text-center text-[#B0AEAA] text-sm mb-4">
                  Codigo QR para <span className="text-[#FF6B00] font-medium">{selectedMember.name}</span>
                </p>
                <button
                  onClick={handleQrCheckIn}
                  className="w-full py-3 gradient-orange rounded-md text-white font-semibold uppercase tracking-wide hover:brightness-110 transition-all cursor-pointer"
                >
                  Simular Check-in
                </button>
              </>
            )}

            {!selectedMember && (
              <div className="text-center py-12">
                <Camera size={48} className="mx-auto text-[#4A4A4A] mb-3" />
                <p className="text-[#B0AEAA] text-sm">Selecione um membro para gerar o QR code</p>
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
                      onClick={() => {
                        if (key === "C") clearPin();
                        else if (key === "<") setPin(pin.slice(0, -1));
                        else handlePinDigit(key);
                      }}
                      className={`h-14 rounded-xl text-lg font-semibold transition-all cursor-pointer ${
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
                  Introduza o PIN de 4 digitos do membro
                </p>
              </>
            )}

            {result === "success" && (
              <div className="text-center py-8 animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} className="text-[#22C55E]" />
                </div>
                <h3 className="text-[#22C55E] font-semibold text-xl mb-1">Check-in Confirmado!</h3>
                {lastCheckin && (
                  <div className="space-y-1">
                    <p className="text-[#F2F2F2] text-lg font-medium">{lastCheckin.name}</p>
                    <p className="text-[#B0AEAA] text-sm">{lastCheckin.area}</p>
                    <p className="text-[#B0AEAA] text-xs">{lastCheckin.time}</p>
                  </div>
                )}
              </div>
            )}

            {result === "error" && (
              <div className="text-center py-8 animate-scale-in">
                <div className="w-20 h-20 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center mx-auto mb-4">
                  <XCircle size={40} className="text-[#EF4444]" />
                </div>
                <h3 className="text-[#EF4444] font-semibold text-xl mb-1">Check-in Invalido</h3>
                <p className="text-[#B0AEAA] text-sm">PIN incorreto ou membro inativo</p>
              </div>
            )}
          </div>
        )}

        {/* Last Check-ins */}
        <div className="mt-6 bg-[#353535] border border-[#4A4A4A] rounded-xl p-5">
          <h3 className="text-[#F2F2F2] font-semibold mb-3">Ultimos Check-ins</h3>
          <div className="space-y-2">
            {activeMembers.slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-[#4A4A4A] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[4px] bg-[#FF6B00] flex items-center justify-center text-white font-semibold text-xs">
                    {m.name.charAt(0)}
                  </div>
                  <span className="text-[#F2F2F2] text-sm">{m.name}</span>
                </div>
                <span className="text-[#B0AEAA] text-xs">{10 + i}:30</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
