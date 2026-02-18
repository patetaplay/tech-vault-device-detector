# Painel de Atendimento Técnico

Painel web para organizar o dia a dia de suporte remoto com atalhos, checklist, mensagens prontas, ordens de serviço e gestão de caixa.

## Funcionalidades
- Atalhos rápidos para ferramentas e sites com botão **Editar atalhos** para adicionar e remover links.
- Cadastro de apps locais (.exe) na aba Ferramentas para abrir direto no app desktop (Electron).
- Checklist personalizável para padronizar o atendimento.
- Mensagens prontas com botão de cópia.
- Ordem de serviço com data, cliente, serviço, valor, forma de pagamento e status (Pago/Em aberto).
- Histórico completo das OS salvo no `localStorage`.
- Gestão de caixa com entradas e saídas.
- Fechamento automático diário, semanal e mensal (ganhos, gastos e resultado), considerando OS pagas e destacando OS em aberto.

## Rodar no navegador (modo web)
1. Abra `index.html` no navegador.
2. Opcionalmente rode um servidor local:
   ```bash
   python3 -m http.server 4173
   ```
3. Acesse `http://localhost:4173`.

## Rodar como app desktop
1. Instale dependências:
   ```bash
   npm install
   ```
2. Abra o app desktop:
   ```bash
   npm start
   ```

## Automação no Windows (duplo clique)
### 1) Abrir o app mais fácil
- Dê duplo clique em `abrir-painel.bat`.
- Se faltar dependência, ele instala e já abre o app.

### 2) Gerar instalador `.exe`
- Dê duplo clique em `build.bat`.
- O script faz tudo automaticamente:
  - valida Node.js e npm
  - instala dependências (`npm install`)
  - gera o instalador (`npm run dist:win`)
  - abre a pasta `dist/` no final

## Gerar `.exe` manualmente (alternativa)
> Recomendado executar em máquina Windows.

```bash
npm install
npm run dist:win
```

## Observações
- O painel é local e não envia dados para servidor.
- A versão desktop usa Electron para facilitar a abertura como programa no Windows.
