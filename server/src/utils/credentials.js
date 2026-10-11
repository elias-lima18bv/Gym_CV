const crypto = require('crypto');

// PIN numérico de 4 dígitos, usado no check-in manual (coluna pin_checkin)
function gerarPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Identificador único para o QR code do membro (coluna qr_code)
function gerarQrCode() {
  return crypto.randomUUID();
}

// Senha temporária legível (ex: "K7XQ2R9F"), usada quando o admin cria
// o membro sem digitar senha — é hasheada antes de ir pro banco, e devolvida
// em texto puro só uma vez, na resposta da criação.
function gerarSenhaTemporaria() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

module.exports = { gerarPin, gerarQrCode, gerarSenhaTemporaria };
