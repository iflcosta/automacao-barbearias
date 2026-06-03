import { google } from 'googleapis';
import { Tenant } from '../database/dbHelper.js';

/**
 * Retorna o cliente autenticado do Google Calendar para um tenant específico.
 */
function getCalendarClient(googleCredentialsStr: string) {
  try {
    const creds = JSON.parse(googleCredentialsStr);
    const auth = new google.auth.JWT(
      creds.client_email,
      undefined,
      creds.private_key.replace(/\\n/g, '\n'), // Corrige quebras de linha na chave privada
      ['https://www.googleapis.com/auth/calendar']
    );
    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error('Erro ao inicializar cliente Google Calendar:', error);
    throw new Error('Credenciais do Google Calendar inválidas.');
  }
}

/**
 * Retorna os slots de horários de 30 minutos disponíveis para uma determinada data.
 * Horário padrão da barbearia: 09:00 às 18:00.
 */
export async function getAvailableSlots(tenant: Tenant, dateStr: string): Promise<string[]> {
  // Se o tenant não tiver credenciais reais configuradas, retorna slots simulados para teste local
  if (!tenant.google_credentials || !tenant.google_calendar_id || tenant.google_credentials.includes('MOCK')) {
    console.log(`[Calendar Mock] Consultando disponibilidade para o tenant ${tenant.id} na data ${dateStr}`);
    return ['09:00', '10:30', '11:00', '14:00', '15:30', '16:00', '17:00'];
  }

  const calendar = getCalendarClient(tenant.google_credentials);
  const calendarId = tenant.google_calendar_id;

  // Define o período de busca daquele dia (09:00 às 18:00)
  const timeMin = new Date(`${dateStr}T09:00:00-03:00`).toISOString();
  const timeMax = new Date(`${dateStr}T18:00:00-03:00`).toISOString();

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    const busySlots = events.map((event) => {
      if (event.start?.dateTime) {
        const date = new Date(event.start.dateTime);
        // Retorna formato HH:MM local
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        });
      }
      return '';
    }).filter(Boolean);

    // Gera slots das 09:00 às 18:00 a cada 30 minutos
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30'
    ];

    // Filtra os slots ocupados
    const availableSlots = allSlots.filter((slot) => !busySlots.includes(slot));
    return availableSlots;
  } catch (error) {
    console.error(`Erro ao buscar eventos no Calendar para o tenant ${tenant.id}:`, error);
    // Em caso de falha de conexão de rede, retorna um array vazio para forçar retry ou aviso ao cliente
    return [];
  }
}

/**
 * Cria um agendamento na agenda do Google Calendar do tenant.
 */
export async function createEvent(
  tenant: Tenant,
  clientName: string,
  clientPhone: string,
  service: string,
  dateStr: string,
  timeStr: string
): Promise<boolean> {
  if (!tenant.google_credentials || !tenant.google_calendar_id || tenant.google_credentials.includes('MOCK')) {
    console.log(`[Calendar Mock] Agendando evento para ${clientName} (${clientPhone}) - ${service} em ${dateStr} às ${timeStr}`);
    return true;
  }

  const calendar = getCalendarClient(tenant.google_credentials);
  const calendarId = tenant.google_calendar_id;

  // Duração padrão: 30 minutos
  const startDateTime = new Date(`${dateStr}T${timeStr}:00-03:00`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);

  try {
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Corte: ${clientName} - ${service}`,
        description: `Agendamento automático via WhatsApp do cliente ${clientName} (${clientPhone}). Serviço: ${service}.`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      },
    });
    return true;
  } catch (error) {
    console.error(`Erro ao criar evento no Calendar para o tenant ${tenant.id}:`, error);
    return false;
  }
}
