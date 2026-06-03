import express from 'express';
import dotenv from 'dotenv';
import { handleWebhook } from './controllers/webhook.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rota de Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor de Automação de Barbearias rodando com sucesso.',
  });
});

// Endpoint do Webhook
app.post('/webhook', handleWebhook);

app.listen(PORT, () => {
  console.log(`🚀 Servidor escutando na porta http://localhost:${PORT}`);
});
