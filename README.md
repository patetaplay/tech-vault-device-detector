# Painel de Atendimento Técnico

Painel web para organizar o dia a dia de suporte remoto com atalhos, checklist, mensagens prontas e ordem de serviço.

## Funcionalidades
- Atalhos rápidos para ferramentas e sites (com possibilidade de adicionar novos links).
- Checklist personalizável para padronizar o atendimento.
- Mensagens prontas com botão de cópia.
- Ordem de serviço com nome do cliente, serviço realizado e valor cobrado.
- Cálculo automático do total cobrado no dia.
- Persistência local no navegador via `localStorage`.

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

## Gerar `.exe` com duplo clique (Windows)
1. Abra a pasta do projeto no Windows.
2. Dê duplo clique em `build.bat`.
3. O script vai:
   - instalar dependências (`npm install`)
   - gerar o instalador (`npm run dist:win`)
   - mostrar o resultado na pasta `dist/`

## Gerar `.exe` para Windows
> Recomendado executar este passo em uma máquina Windows.

1. Instale dependências:
   ```bash
   npm install
   ```
2. Gere o instalador:
   ```bash
   npm run dist:win
   ```
3. O arquivo `.exe` será criado na pasta `dist/`.

## Observações
- O painel é local e não envia dados para servidor.
- A versão desktop usa Electron para facilitar a abertura como programa no Windows.
