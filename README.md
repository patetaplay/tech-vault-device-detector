# Tech Vault Device Detector (Windows / Python)

Aplicativo desktop para Windows que detecta aparelhos Android em **fastboot** e em outros modos USB (via **VID/PID hints**), registra detecções em SQLite e recomenda procedimentos legítimos da base de conhecimento.

## O que o usuário final recebe

- Um arquivo **.zip** pronto para download no GitHub Actions/Release.
- Dentro do `.zip`:
  - `TechVaultDeviceDetector.exe`
  - `USO-RAPIDO.txt`

Ou seja: baixar, extrair e abrir o `.exe` (interface com botões na tela).

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

## Build local com Python (opcional)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## Build local com PyInstaller (opcional)

```powershell
pip install pyinstaller
pyinstaller --noconfirm --onefile --windowed --name "TechVaultDeviceDetector" app.py
```

Saída em:

- `dist/TechVaultDeviceDetector.exe`

## Build e distribuição via GitHub

> Este app **não roda no navegador/GitHub Pages**, pois precisa acessar USB local (`fastboot`/VID/PID).

Workflow em `.github/workflows/build-windows.yml`:

1. **Manual (`workflow_dispatch`)**
   - Acesse **Actions** → **Build Windows Executable** → **Run workflow**.
   - Ao terminar, baixe o artifact `TechVaultDeviceDetector-windows` (zip com exe + guia rápido).

2. **Por tag de versão (`v*`)**
   - Crie e envie tag:
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```
   - O workflow compila e publica o `.zip` na **Release** da tag.

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
