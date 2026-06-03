import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { Message } from '../database/dbHelper.js';

dotenv.config();

// Inicializa a Groq API.
// Caso a chave não esteja no .env para desenvolvimento, usamos um valor temporário para evitar crash de importação.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'MOCK_KEY',
});

export interface GroqResponse {
  reply: string;
  intent: 'BOOKING' | 'INQUIRY' | 'CANCEL' | 'RESCHEDULE' | 'OTHER';
  extractedData: {
    service: string | null;
    date: string | null; // Formato YYYY-MM-DD
    time: string | null; // Formato HH:MM
  };
}

/**
 * Envia o histórico e a mensagem atual para a Groq API, retornando dados estruturados.
 */
export async function queryGroq(
  systemPrompt: string,
  history: Message[],
  newMessage: string
): Promise<GroqResponse> {
  // Se a chave for Mock, retornamos uma resposta simulada para testes locais simples
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'MOCK_KEY') {
    return simulateGroqResponse(newMessage);
  }

  // Obtém a data/hora atual local
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Sao_Paulo',
  };
  const currentDateStr = now.toLocaleDateString('pt-BR', options);

  const fullSystemPrompt = `
${systemPrompt}

---
DIRETRIZES DE RETORNO (CRÍTICO):
Você deve responder estritamente no formato JSON abaixo. Não adicione nenhum texto antes ou depois do JSON. Não envolva em markdown \`\`\`json.
Estrutura do JSON:
{
  "reply": "Sua resposta amigável e simpática para o cliente no WhatsApp",
  "intent": "BOOKING" | "INQUIRY" | "CANCEL" | "RESCHEDULE" | "OTHER",
  "extractedData": {
    "service": "Cabelo" | "Barba" | "Cabelo e Barba" | null,
    "date": "YYYY-MM-DD" | null,
    "time": "HH:MM" | null
  }
}

INSTRUÇÕES DE DATA/HORA:
Hoje é: ${currentDateStr}.
Se o usuário usar termos relativos (ex: "amanhã", "sábado", "segunda-feira"), calcule a data correta baseando-se no dia de hoje e retorne no formato "YYYY-MM-DD" no campo "date".
Se ele não especificar um serviço ou data/hora, deixe os respectivos campos como null.
Apenas classifique como "BOOKING" se o cliente estiver tentando agendar ou marcando um horário.
`;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: fullSystemPrompt },
  ];

  // Adiciona histórico
  for (const msg of history) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // Adiciona a nova mensagem
  messages.push({ role: 'user', content: newMessage });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192', // Modelo recomendado: rápido e preciso
      temperature: 0.2, // Baixa temperatura para manter formato estruturado consistente
      response_format: { type: 'json_object' }, // Força retorno JSON
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Groq retornou conteúdo vazio.');
    }

    return JSON.parse(responseContent) as GroqResponse;
  } catch (error) {
    console.error('Erro na chamada da Groq:', error);
    throw error;
  }
}

/**
 * Função para simular respostas caso a chave da API não esteja configurada.
 */
function simulateGroqResponse(message: string): GroqResponse {
  const lowercase = message.toLowerCase();
  
  if (lowercase.includes('agendar') || lowercase.includes('marcar') || lowercase.includes('corte') || lowercase.includes('cabelo')) {
    // Tenta simular a data de amanhã
    const amanhã = new Date();
    amanhã.setDate(amanhã.getDate() + 1);
    const dateStr = amanhã.toISOString().split('T')[0];

    return {
      reply: 'Perfeito! Vamos agendar o seu serviço. Tenho horários livres para amanhã. Qual horário prefere?',
      intent: 'BOOKING',
      extractedData: {
        service: lowercase.includes('barba') ? 'Cabelo e Barba' : 'Cabelo',
        date: dateStr,
        time: lowercase.includes('15h') || lowercase.includes('15:00') ? '15:00' : null,
      },
    };
  }

  return {
    reply: 'Olá! Como posso te ajudar hoje? Trabalhamos com serviços de Cabelo e Barba.',
    intent: 'OTHER',
    extractedData: {
      service: null,
      date: null,
      time: null,
    },
  };
}
