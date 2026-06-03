# Roadmap de Automação de Barbearias Multi-Tenant com IA

Este documento registra o estado atual do projeto, a arquitetura de software implementada e as instruções para rodar e validar o protótipo localmente.

---

## 📌 Estado Atual do Projeto

O protótipo foi **completamente desenvolvido e verificado**, integrando os fluxos de saudação, verificação de horários, agendamento no Google Calendar e cancelamento real.

### 🛠️ O que foi implementado:
1. **Estrutura de Dependências & TypeScript (`package.json`, `tsconfig.json`)**: Configurado e otimizado com TypeScript.
2. **Banco de Dados SQLite (`src/database/init.ts` e `dbHelper.ts`)**:
   - Chaves estrangeiras habilitadas.
   - Tabelas criadas: `tenants` (barbearias), `sessions` (sessões de conversa), `messages` (histórico) e a nova tabela `appointments` (guarda os agendamentos efetuados e os IDs reais do Google Calendar correspondentes).
   - Métodos CRUD completos encapsulados em Promises (`dbHelper.ts`).
3. **Integração Groq API (`src/services/groq.ts`)**:
   - IA estruturada para responder e detectar intenções (`BOOKING`, `CANCEL`, `INQUIRY`, etc.) em formato JSON.
4. **Integração Google Calendar (`src/services/calendar.ts`)**:
   - Funções para listar horários livres (`getAvailableSlots`), agendar (`createEvent` retornando o ID do evento) e cancelar agendamentos (`deleteEvent` via ID do evento).
   - Suporte a múltiplos inquilinos e modo de simulação (Mock) integrado para testes rápidos.
5. **Express Webhook Server (`src/index.ts` e `src/controllers/webhook.ts`)**:
   - Ponto de entrada Express escutando na porta 3000.
   - Controlador de webhook estruturado para receber payloads do WhatsApp, gerenciar a conversa, registrar os agendamentos no banco SQLite local e disparar respostas automáticas.
6. **Scripts de Teste e Simulação**:
   - `scripts/create-tenant.ts`: Registra uma barbearia com serviços e regras de prompt customizadas.
   - `scripts/simulate-chat.ts`: Simula uma conversa de 3 turnos (iniciar agendamento -> escolher horário -> cancelar) enviando webhooks sequenciais.
7. **Configuração (`.env.example` e `.gitignore`)**:
   - Template para preenchimento de variáveis de ambiente criado.

---

## 📐 Estrutura de Pastas do Projeto
```text
automação-barbearia/
├── src/
│   ├── config/          # Configurações globais e variáveis de ambiente
│   ├── database/        # Inicialização do SQLite e helpers do banco
│   │   ├── init.ts      # Inicializador de tabelas (agora inclui a tabela appointments)
│   │   └── dbHelper.ts  # Operações de CRUD completas (inclui agendamentos e cancelamento)
│   ├── services/        # Clientes de APIs externas
│   │   ├── calendar.ts  # Google Calendar (Listar/Agendar/Deletar)
│   │   ├── evolution.ts # WhatsApp API (Enviar mensagens)
│   │   └── groq.ts      # IA Groq (Extração e Resposta)
│   ├── controllers/     # Controladores HTTP (Express)
│   │   └── webhook.ts   # Webhook da Evolution API e orquestração do chatbot
│   └── index.ts         # Ponto de entrada do servidor Express
├── scripts/
│   ├── create-tenant.ts # Script auxiliar para cadastrar barbearias no banco
│   ├── test-webhook.ts  # Teste rápido de 1 webhook
│   └── simulate-chat.ts # Simulação interativa de fluxo completo (multi-turn)
├── database.db          # Arquivo do SQLite (gerado automaticamente)
├── tsconfig.json        # Configuração do TypeScript
├── package.json         # Dependências do NodeJS
├── .env.example         # Modelo de configuração das variáveis
└── ROADMAP.md           # Este arquivo de controle
```

---

## 🚀 Como testar e validar o protótipo na sua máquina

Para testar o fluxo de agendamento e cancelamento simulado:

1. **Instale as dependências:**
   ```bash
   npm install
   ```
2. **Inicialize o Banco de Dados:**
   ```bash
   npm run init-db
   ```
3. **Cadastre a barbearia de teste:**
   ```bash
   npx tsx scripts/create-tenant.ts
   ```
4. **Inicie o servidor local:**
   ```bash
   npm run dev
   ```
5. **(Em outro terminal) Rode a simulação de conversa completa:**
   ```bash
   npx tsx scripts/simulate-chat.ts
   ```
   *Você verá a conversa ocorrendo no console de simulação, enquanto o terminal do servidor mostrará a IA processando as intenções, fazendo a busca de horários, salvando a reserva no banco de dados e excluindo-a no final devido ao cancelamento.*

---

## 🏁 Próximos Passos (Transição para Produção)

Com o protótipo validado, os próximos passos ao implantar o sistema online são:
1. **Configurar a Nuvem:** Obter chaves reais do Google Calendar (Service Account) e da Groq.
2. **Dockerizar a Aplicação:** Criar um arquivo `Dockerfile` e um `docker-compose.yml` para rodar o backend Node.js junto com o contêiner da Evolution API na VPS.
3. **Liberar Portas:** Configurar Nginx / SSL para que a Evolution API possa expor o webhook da VPS de forma segura para o WhatsApp.
