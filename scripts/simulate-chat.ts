import axios from 'axios';

const url = 'http://localhost:3000/webhook';
const chatId = '5511999999999@s.whatsapp.net';

// Utilitário para esperar alguns segundos
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendWebhookMessage(text: string) {
  const payload = {
    event: 'messages.upsert',
    instance: 'barbearia_central',
    data: {
      key: {
        remoteJid: chatId,
        fromMe: false,
        id: 'SIM_MSG_' + Date.now(),
      },
      pushName: 'Rodrigo',
      message: {
        conversation: text,
      },
      messageType: 'conversation',
    },
  };

  try {
    const response = await axios.post(url, payload);
    if (response.status !== 200) {
      console.error(`Erro no servidor: Código ${response.status}`);
    }
  } catch (error: any) {
    console.error('Erro ao conectar com o servidor webhook:', error.message);
  }
}

async function runSimulation() {
  console.log('🏁 INICIANDO SIMULAÇÃO DE FLUXO COMPLETO (MULTI-TURN)...');
  console.log('Certifique-se de que o servidor local está rodando em outro terminal ("npm run dev").\n');

  // Turno 1: Saudação e pedido de agendamento parcial
  console.log('👤 Rodrigo: "Olá! Gostaria de agendar um corte de cabelo para amanhã."');
  await sendWebhookMessage('Olá! Gostaria de agendar um corte de cabelo para amanhã.');
  await sleep(4000);

  // Turno 2: Seleção de horário
  console.log('\n👤 Rodrigo: "Prefiro o horário das 15:30."');
  await sendWebhookMessage('Prefiro o horário das 15:30.');
  await sleep(4000);

  // Turno 3: Cancelamento do compromisso recém-criado
  console.log('\n👤 Rodrigo: "Opa, acabei de ter um imprevisto. Gostaria de cancelar meu agendamento."');
  await sendWebhookMessage('Opa, acabei de ter um imprevisto. Gostaria de cancelar meu agendamento.');
  await sleep(2000);

  console.log('\n🏁 FIM DA SIMULAÇÃO.');
}

runSimulation();
