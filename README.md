# Painel de Atendimento Técnico

Painel web simples para organizar o dia a dia de suporte remoto com atalhos, checklist, mensagens prontas e ordem de serviço.

## Funcionalidades
- Atalhos rápidos para ferramentas e sites (com possibilidade de adicionar novos links).
- Checklist personalizável para padronizar o atendimento.
- Mensagens prontas com botão de cópia.
- Ordem de serviço com nome do cliente, serviço realizado e valor cobrado.
- Cálculo automático do total cobrado no dia.
- Persistência local no navegador via `localStorage`.

## Como usar
1. Abra `index.html` no navegador.
2. Opcionalmente rode um servidor local:
   ```bash
   python3 -m http.server 4173
   ```
3. Acesse `http://localhost:4173`.

## Observações
- O painel é local e não envia dados para servidor.
- Para abrir apps instalados no seu computador diretamente pelo painel, é recomendado criar uma versão desktop (Electron/Tauri) em uma etapa futura.
