# Tech Vault Device Detector (Windows / Python)

Aplicativo desktop para Windows que detecta aparelhos Android em **fastboot** e em outros modos USB (via **VID/PID hints**), registra detecções em SQLite e recomenda procedimentos legítimos da base de conhecimento.

## O que o usuário final recebe

- Um arquivo **.zip** pronto para download no GitHub Actions/Release.
- O arquivo **.exe** também fica disponível separadamente nos artifacts/releases.
- Dentro do `.zip`:
  - `TechVaultDeviceDetector.exe`
  - `USO-RAPIDO.txt`
  - `README.md`

Ou seja: baixar, extrair e abrir o `.exe` (interface com botões na tela).

## Acabamento de produto final

- Janela com nome amigável: **Tech Vault Device Detector - Assistente**.
- Executável com ícone próprio (`assets/app_icon.ico`).
- Metadados de versão/descrição do `.exe` via `windows_version_info.txt`.

## Funcionalidades

- Detecção de fastboot usando:
  - `fastboot devices`
  - `fastboot getvar product`
  - `fastboot getvar model`
- Detecção de modos USB por VID/PID (ex.: Download Mode Samsung, Qualcomm 9008/EDL, Fastboot de alguns fabricantes).
- Persistência em SQLite das detecções.
- Base de conhecimento local com artigos de:
  - flash oficial
  - drivers
  - erros comuns
  - diagnósticos
- Busca por marca/modelo/tags.
- Sugestão automática de artigos/procedimentos baseada no modelo/mode detectado e match por tags.

## Requisitos (para uso completo)

- Windows 10/11
- Android Platform Tools no PATH (para `fastboot`)
- Drivers USB adequados por fabricante

## Uso do .exe

1. Baixe `TechVaultDeviceDetector-windows.zip` na aba **Actions** (artifact) ou **Releases**.
2. Extraia o `.zip`.
3. Execute `TechVaultDeviceDetector.exe`.
4. Clique em **Executar detecção** para detectar dispositivo.
5. Use **Executar busca** para filtrar artigos por marca/modelo/tags.

## Build local (mais fácil)

No Windows, clique duas vezes em `build_windows.bat`.

Ele:
- cria `.venv` se não existir,
- instala dependências,
- gera o ícone automaticamente (sem versionar binário),
- gera o executável.

Saída do executável:
- `dist\TechVaultDeviceDetector.exe`

## Build local com PyInstaller (opcional)

```powershell
python scripts/generate_icon.py
pip install pyinstaller
pyinstaller --noconfirm --onefile --windowed --name "TechVaultDeviceDetector" --icon "assets/app_icon.ico" --version-file "windows_version_info.txt" --add-data "assets/app_icon.ico;assets" app.py
```

Saída em:

- `dist/TechVaultDeviceDetector.exe`

## Build e distribuição via GitHub

> Este app **não roda no navegador/GitHub Pages**, pois precisa acessar USB local (`fastboot`/VID/PID).

Workflow em `.github/workflows/build-windows.yml`:

1. **Manual (`workflow_dispatch`)**
   - Acesse **Actions** → **Build Windows Executable** → **Run workflow**.
   - Ao terminar, baixe:
     - `TechVaultDeviceDetector-windows` (zip com exe + guias), ou
     - `TechVaultDeviceDetector-exe` (somente o `.exe`).

2. **Por tag de versão (`v*`)**
   - Crie e envie tag:
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```
   - O workflow compila e publica na **Release**:
     - `TechVaultDeviceDetector-windows.zip`
     - `TechVaultDeviceDetector.exe`

## Problema de atualização de branch com binários

Se aparecer erro de “arquivos binários não são compatíveis”, este projeto já está preparado para evitar isso:
- O ícone é gerado por script (`scripts/generate_icon.py`) durante o build.
- Assim você não depende de atualizar/mesclar binários manualmente no branch.

## Se o `.exe` “não está na pasta”

Isso normalmente acontece porque:
1. Você ainda **não rodou o build local** (`build_windows.bat`) — o `.exe` só aparece em `dist/` depois do build.
2. Você baixou o projeto do GitHub, mas não baixou os artifacts/releases.
3. Você baixou o `.zip` e ainda não extraiu.

## Banco de dados

- Arquivo: `device_detector.db`
- Tabelas:
  - `detections`
  - `knowledge_articles`

A base de artigos é semeada automaticamente na primeira execução.

## Observações

- Se `fastboot` não estiver no PATH, a detecção fastboot não retorna resultados.
- VID/PID hints cobrem cenários comuns e podem ser estendidos em `detector.py`.
- O app não executa flash automático — apenas detecção, registro e recomendação de procedimentos legítimos.
