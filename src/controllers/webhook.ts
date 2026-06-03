import { Request, Response } from 'express';
import { dbHelper } from '../database/dbHelper.js';
import { queryGroq } from '../services/groq.js';
import { getAvailableSlots, createEvent } from '../services/calendar.js';
import { sendWhatsAppMessage } from '../services/evolution.js';

/**
 * Utilitário para extrair o texto de mensagens vindas da Evolution API.
 */
function extractMessageText(data: any): string | null {
  if (!data.message) return null;
  if (data.message.conversation) return data.message.conversation;
  if (data.message.extendedTextMessage?.text) return data.message.extendedTextMessage.text;
  return null;
}

/**
 * Controller principal que recebe webhooks de mensagens enviadas à Evolution API.
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const payload = req.body;

  // Garante que é um evento de mensagem recebida
  if (payload.event !== 'messages.upsert') {
    res.status(200).send('Ignored event');
    return;
  }

  const data = payload.data;
  if (!data || !data.key) {
    res.status(400).send('Invalid data structure');
    return;
  }

  // Ignora mensagens enviadas pelo próprio bot
  if (data.key.fromMe) {
    res.status(200).send('Message from me ignored');
    return;
  }

  const tenantId = payload.instance; // O ID da instância na Evolution API equivale ao tenant_id
  const chatJid = data.key.remoteJid; // Identificador único do cliente
  const userName = data.pushName || 'Cliente';
  const textMessage = extractMessageText(data);

  if (!textMessage) {
    res.status(200).send('No text content in message');
    return;
  }

  try {
    // 1. Busca o tenant (barbearia) cadastrado
    const tenant = await dbHelper.getTenant(tenantId);
    if (!tenant) {
      console.warn(`[Webhook Warning] Tenant não encontrado para a instância: ${tenantId}`);
      res.status(404).send('Tenant not found');
      return;
    }

    // 2. Obtém ou inicia a sessão do cliente
    const session = await dbHelper.getSession(chatJid, tenantId);
    if (!session.user_name) {
      await dbHelper.updateSession(chatJid, { user_name: userName });
    }

    // 3. Recupera histórico recente de mensagens
    const history = await dbHelper.getMessages(chatJid, 10);

    // 4. Salva a mensagem recebida do usuário no banco
    await dbHelper.addMessage(chatJid, tenantId, 'user', textMessage);

    // 5. Consulta a Groq API
    const systemPrompt = tenant.system_prompt || 'Você é um assistente virtual de barbearia prestes a marcar agendamentos.';
    const aiResult = await queryGroq(systemPrompt, history, textMessage);

    console.log(`[Webhook LLM Result] Tenant: ${tenantId} | Intent: ${aiResult.intent} | Data:`, aiResult.extractedData);

    let finalReply = aiResult.reply;

    // 6. Lógica de decisão baseada na intenção identificada
    if (aiResult.intent === 'BOOKING') {
      const { service, date, time } = aiResult.extractedData;

      // Mescla os dados extraídos com os dados já salvos temporariamente na sessão
      const currentService = service || session.temp_service;
      const currentDate = date || session.temp_date;
      const currentTime = time || session.temp_time;

      // Salva os dados temporários atuais no banco
      await dbHelper.updateSession(chatJid, {
        temp_service: currentService || undefined,
        temp_date: currentDate || undefined,
        temp_time: currentTime || undefined,
      });

      if (currentService && currentDate && currentTime) {
        // Se temos todas as informações, tenta agendar no Google Calendar
        const scheduled = await createEvent(
          tenant,
          session.user_name || userName,
          chatJid,
          currentService,
          currentDate,
          currentTime
        );

        if (scheduled) {
          finalReply = `✨ *Agendamento Confirmado!*\n\n📅 *Data:* ${currentDate.split('-').reverse().join('/')}\n⏰ *Horário:* ${currentTime}\n💈 *Serviço:* ${currentService}\n\nTe aguardamos!`;
          await dbHelper.clearSession(chatJid);
        } else {
          // Se falhou (ex: horário acabou de ser ocupado), sugere alternativas
          const slots = await getAvailableSlots(tenant, currentDate);
          if (slots.length > 0) {
            finalReply = `Ops, o horário de *${currentTime}* não está mais disponível. Temos estas opções para o dia *${currentDate.split('-').reverse().join('/')}*:\n\n${slots.map(s => `🕒 ${s}`).join('\n')}\n\nQual deles prefere?`;
            await dbHelper.updateSession(chatJid, { temp_time: undefined });
          } else {
            finalReply = `Não possuímos mais horários disponíveis na data *${currentDate.split('-').reverse().join('/')}*. Poderia escolher outro dia?`;
            await dbHelper.updateSession(chatJid, { temp_date: undefined, temp_time: undefined });
          }
        }
      } else if (currentDate && !currentTime) {
        // Usuário escolheu a data mas não a hora -> consulta disponibilidade
        const slots = await getAvailableSlots(tenant, currentDate);
        if (slots.length > 0) {
          finalReply = `Perfeito! Tenho estes horários disponíveis para o dia *${currentDate.split('-').reverse().join('/')}*:\n\n${slots.map(s => `🕒 ${s}`).join('\n')}\n\nQual você prefere?`;
          await dbHelper.updateSession(chatJid, { current_state: 'AWAITING_TIME_SELECTION' });
        } else {
          finalReply = `Infelizmente não possuímos horários disponíveis para o dia *${currentDate.split('-').reverse().join('/')}*. Poderia escolher outra data?`;
          await dbHelper.updateSession(chatJid, { temp_date: undefined });
        }
      }
    } else if (aiResult.intent === 'CANCEL') {
      // Se solicitou cancelamento, limpamos os dados temporários de agendamento em andamento
      await dbHelper.clearSession(chatJid);
    }

    // 7. Envia a resposta de volta ao WhatsApp via Evolution API
    await sendWhatsAppMessage(tenantId, chatJid, finalReply);

    // 8. Salva a resposta da IA no banco de dados para manter o contexto
    await dbHelper.addMessage(chatJid, tenantId, 'assistant', finalReply);

    res.status(200).send('Success');
  } catch (error) {
    console.error('[Webhook Error] Ocorreu um erro no fluxo do webhook:', error);
    res.status(500).send('Internal Server Error');
  }
}
