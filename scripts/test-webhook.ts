import axios from 'axios';

async function sendMockWebhook() {
  const url = 'http://localhost:3000/webhook';
  
  const payload = {
    event: 'messages.upsert',
    instance: 'barbearia_central',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'MOCK_MSG_ID_' + Date.now(),
      },
      pushName: 'Rodrigo',
      message: {
        conversation: 'Olá! Gostaria de agendar um corte de cabelo para amanhã.',
      },
      messageType: 'conversation',
    },
  };

  console.log('Enviando webhook de teste...');
  try {
    const response = await axios.post(url, payload);
    console.log(`Resposta do Servidor: Código ${response.status} - ${response.data}`);
  } catch (error: any) {
    console.error('Erro ao enviar webhook:', error.message);
    if (error.response) {
      console.error('Dados da resposta do erro:', error.response.data);
    }
  }
}

sendMockWebhook();
