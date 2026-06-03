# Roadmap de Automação de Barbearias Multi-Tenant com IA

Este documento registra o estado atual do projeto, a arquitetura de software implementada e os próximos passos para continuar o desenvolvimento. O objetivo é permitir que você continue de onde parou ao abrir este projeto em sua máquina local em casa.

---

## 📌 Estado Atual do Projeto

O projeto foi planejado e estruturado para rodar de forma extremamente leve (consumindo < 100MB de RAM de backend), sendo perfeito para hospedar em uma VPS gratuita (como a Oracle Cloud Free Tier de 1GB de RAM), integrada com a **Groq API** e **Evolution API**.

### 🛠️ O que já foi implementado:
1. **Estrutura de Dependências & TypeScript (`package.json`, `tsconfig.json`)**: Configurado com as dependências essenciais (`express`, `sqlite3`, `groq-sdk`, `googleapis`, `axios`) e configurado para compilação direta via `tsx` (TypeScript Execute).
2. **Banco de Dados SQLite (`src/database/init.ts` e `dbHelper.ts`)**: 
   - Banco de dados inicializado com suporte a chaves estrangeiras (`PRAGMA foreign_keys = ON;`).
   - Tabelas criadas: `tenants` (dados e chaves de API/calendário de cada barbearia), `sessions` (estados da conversa ativa) e `messages` (histórico de chat).
   - CRUD encapsulado em Promises pronto para uso no backend (`dbHelper`).
3. **Integração Groq API (`src/services/groq.ts`)**:
   - Serviço construído para enviar o histórico da conversa e obter respostas estruturadas em JSON.
   - Possui detecção automática de intenções (`BOOKING`, `INQUIRY`, `CANCEL`, `RESCHEDULE`, `OTHER`) e extração automática de dados (serviço, data, hora).
   - Resolve termos relativos como "amanhã" e "sábado" baseando-se no fuso horário brasileiro.
4. **Integração Google Calendar (`src/services/calendar.ts`)**:
   - Conexão via JWT (Service Account) isolada por tenant (cada barbearia tem sua própria credencial salva em formato JSON no banco).
   - Algoritmo de verificação de horários disponíveis em slots de 30 minutos das 09h às 18h.
   - Função para criação de agendamento automático.
5. **Integração WhatsApp Evolution API (`src/services/evolution.ts`)**:
   - Serviço de emissão de mensagens de volta para a API do WhatsApp associada a cada barbearia (tenant).

> 💡 **Nota sobre Fallbacks:** Todos os serviços de API externa (Groq, Calendar, Evolution) possuem funções de fallback/mock integradas. Se as credenciais ou chaves de API estiverem ausentes no arquivo `.env` ou banco de dados, os serviços logarão as ações no console e retornarão dados simulados coerentes, permitindo testar toda a lógica do bot localmente sem nenhuma configuração complexa inicial.

---

## 📐 Estrutura de Pastas do Projeto
```text
automação-barbearia/
├── src/
│   ├── config/          # Configurações globais e variáveis de ambiente
│   ├── database/        # Inicialização do SQLite e helpers do banco
│   │   ├── init.ts      # Inicializador de tabelas
│   │   └── dbHelper.ts  # Operações de CRUD do banco de dados
│   ├── services/        # Clientes de APIs externas
│   │   ├── calendar.ts  # Google Calendar (Listar/Agendar)
│   │   ├── evolution.ts # WhatsApp API (Enviar mensagens)
│   │   └── groq.ts      # IA Groq (Extração e Resposta)
│   ├── controllers/     # Controladores HTTP (Express)
│   │   └── webhook.ts   # [A FAZER] Webhook da Evolution API e orquestração do bot
│   └── index.ts         # [A FAZER] Ponto de entrada do servidor Express
├── scripts/
│   └── create-tenant.ts # [A FAZER] Script auxiliar para cadastrar barbearias no banco
├── database.db          # Arquivo local do SQLite (gerado automaticamente)
├── tsconfig.json        # Configuração do TypeScript
├── package.json         # Dependências do NodeJS
└── ROADMAP.md           # Este arquivo de controle
```

---

## 🚀 Próximos Passos (Para Fazer em Casa)

Para finalizar a primeira versão funcional e colocar o sistema para rodar em desenvolvimento:

### 1. Criar o Controlador de Webhook (`src/controllers/webhook.ts`)
Este controlador receberá a mensagem vinda do webhook da Evolution API e executará a lógica principal:
1. Identificar o ID da instância do webhook (que corresponde ao `tenant_id`).
2. Buscar os dados do tenant no banco (para obter o `system_prompt` e dados do calendário).
3. Obter ou criar a sessão ativa do cliente (`chat_id`).
4. Recuperar o histórico de mensagens e anexar a nova mensagem recebida.
5. Enviar os dados para a `Groq API` que responderá com a intenção e os dados extraídos.
6. **Lógica de decisão baseada na intenção:**
   - **Se intenção for `BOOKING`:**
     - Se o usuário não definiu serviço/data/hora: enviar resposta da Groq solicitando os dados faltantes.
     - Se definiu a data mas não a hora: buscar os horários disponíveis no `Calendar` e oferecer na mensagem.
     - Se definiu serviço, data e hora: criar o evento no `Calendar` e confirmar o agendamento.
   - **Se intenção for `INQUIRY` ou `OTHER`:**
     - Enviar a resposta textual gerada pela Groq diretamente para o WhatsApp do cliente.
7. Atualizar a sessão e salvar a mensagem do usuário e da IA no banco de dados para a memória da conversa.

### 2. Criar o Ponto de Entrada Express (`src/index.ts`)
Criar o servidor Express básico, habilitar JSON, e definir a rota:
*   `POST /webhook` -> aponta para o controlador acima.
*   Porta padrão: `3000`.

### 3. Criar Script de Registro de Tenants (`scripts/create-tenant.ts`)
Um script CLI rápido para inserir barbearias de teste na tabela `tenants`. Exemplo:
```typescript
import { dbHelper } from '../src/database/dbHelper.js';
dbHelper.upsertTenant({
  id: "barbearia_central",
  name: "Barbearia Central",
  system_prompt: "Você é o assistente virtual da Barbearia Central..."
});
```

### 4. Configurar `.env` e Iniciar o Servidor
1. Crie o arquivo `.env` na raiz com:
   ```env
   PORT=3000
   GROQ_API_KEY=sua_chave_groq_aqui
   EVOLUTION_API_URL=http://localhost:8080
   EVOLUTION_API_APIKEY=sua_chave_evolution_aqui
   ```
2. Inicie o servidor em modo desenvolvimento:
   ```bash
   npm run dev
   ```
3. Teste o fluxo enviando requisições POST para `http://localhost:3000/webhook` com payloads de simulação da Evolution API (o Antigravity em casa poderá ajudar a construir esses payloads de teste).
