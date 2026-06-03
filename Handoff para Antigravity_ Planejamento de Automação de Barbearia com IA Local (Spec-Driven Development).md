# Handoff para Antigravity: Planejamento de Automação de Barbearia com IA Local (Spec-Driven Development)

**Para:** Antigravity
**De:** [Seu Nome/Manus AI]
**Data:** 03 de Junho de 2026
**Assunto:** Planejamento Detalhado de Sistema de Automação de Barbearia com IA Local via Spec-Driven Development (SDD)

--- 

## 1. Contexto do Projeto

Estamos desenvolvendo um protótipo de automação para barbearias, focado em otimizar o processo de agendamento de cortes. O sistema visa atender clientes via WhatsApp utilizando Inteligência Artificial local, qualificar as solicitações e subir os agendamentos diretamente na agenda do barbeiro. O objetivo principal é reduzir a carga de trabalho manual e minimizar a perda de clientes devido à demora no atendimento.

## 2. Objetivo do Handoff (Spec-Driven Development)

Este handoff tem como objetivo iniciar uma fase de **Spec-Driven Development (SDD)** com o Antigravity. Espera-se que o Antigravity atue como um arquiteto de sistemas, ajudando a planejar e definir detalhadamente todos os requisitos funcionais e não funcionais, fluxos de usuário, especificações técnicas e casos de uso para o protótipo. O foco é garantir que todas as especificações sejam claras e abrangentes antes da fase de implementação.

## 3. Hardware Disponível

O sistema será executado no seguinte hardware, que deve ser considerado para otimização e seleção de tecnologias:

*   **CPU:** AMD Ryzen 5 9600X
*   **RAM:** 32GB
*   **GPU:** NVIDIA GeForce RTX 4060 com 8GB VRAM
*   **Armazenamento:** 1TB NVMe Gen5

## 4. Stack Tecnológica Sugerida (Sweet Spot)

Com base na pesquisa inicial e no hardware disponível, a seguinte stack tecnológica foi identificada como o "sweet spot" para o protótipo:

*   **IA Local:** Ollama, utilizando modelos como Llama 3.1 (8B) ou Qwen 2.5 (7B) em versões quantizadas (e.g., Q4_K_M), para rodar diretamente na GPU.
*   **Interface WhatsApp:** Evolution API (solução open-source para conexão via QR Code, evitando custos da API oficial da Meta).
*   **Orquestração/Automação:** n8n, self-hosted via Docker no PC local, para gerenciar os fluxos de trabalho.
*   **Agenda:** Integração com Google Calendar ou Cal.com para gerenciamento de agendamentos.

## 5. Requisitos Funcionais Iniciais

O sistema deve ser capaz de:

*   **Atendimento via WhatsApp:** Receber e responder mensagens de clientes no WhatsApp. [1]
*   **Qualificação de Clientes:** A IA deve ser capaz de entender a intenção do cliente (agendamento, reagendamento, cancelamento, informações sobre serviços/preços). [1]
*   **Consulta de Disponibilidade:** A IA deve consultar a agenda do barbeiro (Google Calendar/Cal.com) para verificar horários disponíveis. [1]
*   **Agendamento:** Confirmar e registrar agendamentos na agenda do barbeiro, enviando confirmação ao cliente. [1]
*   **Reagendamento/Cancelamento:** Processar solicitações de reagendamento ou cancelamento, atualizando a agenda e notificando o cliente. [1]
*   **Informações Gerais:** Fornecer informações sobre serviços, preços, localização e horário de funcionamento da barbearia. [1]

## 6. Requisitos Não Funcionais

*   **Performance:** Respostas da IA em tempo real (inferência rápida). [1]
*   **Confiabilidade:** Alta disponibilidade do serviço de automação (considerando que roda localmente). [1]
*   **Segurança:** Proteção dos dados do cliente e da agenda. [1]
*   **Manutenibilidade:** Facilidade de atualização e ajuste dos prompts da IA e dos fluxos do n8n. [1]

## 7. Fluxo de Interação (User Journey - Exemplo)

1.  **Cliente envia mensagem:** Cliente envia "Olá" ou "Quero agendar" para o WhatsApp da barbearia.
2.  **IA atende:** A IA responde, se apresenta e pergunta sobre a intenção do cliente.
3.  **Cliente informa serviço:** Cliente informa o serviço desejado (ex: "corte de cabelo e barba").
4.  **IA qualifica e consulta:** A IA qualifica o serviço, consulta a agenda e oferece horários disponíveis.
5.  **Cliente escolhe horário:** Cliente seleciona um horário.
6.  **IA confirma e agenda:** A IA confirma o agendamento, registra na agenda do barbeiro e envia uma confirmação ao cliente.

## 8. Expectativas do Antigravity

Esperamos que o Antigravity nos ajude a detalhar os seguintes pontos:

*   **Especificações Detalhadas:** Para cada requisito funcional, detalhar as entradas, saídas, condições e regras de negócio.
*   **Diagramas de Fluxo:** Criar diagramas de fluxo de processo (BPMN ou similar) para as interações entre cliente, WhatsApp, IA, n8n e agenda.
*   **Casos de Uso:** Desenvolver casos de uso para as principais funcionalidades, incluindo cenários de sucesso e falha.
*   **Estrutura de Dados:** Propor a estrutura de dados necessária para o n8n gerenciar informações de agendamento e clientes.
*   **Sugestões de Otimização:** Identificar pontos de otimização para a performance da IA local e a estabilidade do sistema.
*   **Plano de Testes (Básico):** Sugerir um plano de testes para validar as funcionalidades do protótipo.

## 9. Formato de Entrega

Todas as especificações e diagramas devem ser entregues em formato Markdown, com diagramas renderizados em PNG (utilizando D2 ou Mermaid, conforme apropriado) e anexados ao documento principal. A comunicação será iterativa, com revisões e ajustes conforme necessário.

--- 

**Referências:**

[1] Manus AI. (2026). *Pesquisa de Automação para Barbearia com IA Local*. [Documento Interno].
