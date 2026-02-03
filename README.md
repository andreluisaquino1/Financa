# Finança em Casal 💰

Uma aplicação web moderna para gestão financeira de casais, focada em divisão justa de despesas, controle de metas e planejamento mensal.

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Ícones**: Lucide React
- **Validação**: Zod

## Funcionalidades Principais

- 📊 **Dashboard Completo**: Visão geral de gastos, rendas e metas.
- 💸 **Gestão de Despesas**: Lance gastos fixos, comuns, individuais ou parcelados.
- ⚖️ **Divisão Justa**: Cálculo automático de quem deve transferir para quem, baseada em salário ou divisão 50/50.
- 🎯 **Metas de Poupança**: Acompanhe o progresso de sonhos em conjunto.
- 🏖️ **Gestão de Viagens**: Módulo dedicado para controlar orçamentos de viagens.
- ♻️ **Lixeira**: Recuperação de itens excluídos acidentalmente.

## Configuração Local

### Pré-requisitos

- Node.js (v18 ou superior)
- Conta no [Supabase](https://supabase.com/)

### Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd "Finança em Casal"
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.example .env
     ```
   - Preencha o `.env` com suas credenciais do Supabase:
     ```env
     VITE_SUPABASE_URL=sua_url_do_supabase
     VITE_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
     ```

4. Configure o Banco de Dados:
   - Rode os scripts SQL localizados na pasta `database/` no seu painel do Supabase para criar as tabelas e políticas de segurança.

5. Rode o projeto:
   ```bash
   npm run dev
   ```

## Estrutura do Projeto

- `src/components`: Componentes React reutilizáveis.
- `src/hooks`: Hooks customizados (ex: `useAppData`).
- `src/services`: Camada de serviço para comunicação com Supabase.
- `src/domain`: Lógica de negócio pura e validações.
- `src/types.ts`: Definições de tipos TypeScript.

---

Desenvolvido com ❤️ para organização financeira a dois.