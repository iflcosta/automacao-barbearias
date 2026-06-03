import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const evolutionApiKey = process.env.EVOLUTION_API_APIKEY || 'MOCK_KEY';

/**
 * Envia uma mensagem de texto para o WhatsApp de um cliente através da Evolution API.
 */
export async function sendWhatsAppMessage(
  instanceId: string,
  toPhone: string,
  text: string
): Promise<boolean> {
  // Se estiver em modo mock (sem API real da Evolution no local), loga a mensagem no console
  if (evolutionApiKey === 'MOCK_KEY') {
    console.log(`[Evolution Mock - Instance: ${instanceId}] Enviando para ${toPhone}: "${text}"`);
    return true;
  }

  // A Evolution API geralmente formata números de telefone apenas com dígitos (ex: 5511999999999)
  const cleanPhone = toPhone.replace(/\D/g, '');

  try {
    const response = await axios.post(
      `${evolutionApiUrl}/message/sendText/${instanceId}`,
      {
        number: cleanPhone,
        text: text,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: evolutionApiKey,
        },
      }
    );

    return response.status === 200 || response.status === 201;
  } catch (error: any) {
    console.error(`Erro ao enviar mensagem via Evolution API (${instanceId}):`, error.message);
    return false;
  }
}
