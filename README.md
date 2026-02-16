# Tech Vault Device Detector (Windows / Python)

Aplicativo desktop simples para Windows que detecta aparelhos Android em **fastboot** e em outros modos USB (via **VID/PID hints**), registra tudo em SQLite e recomenda procedimentos legítimos da base de conhecimento.

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

## Requisitos

- Windows 10/11
- Python 3.10+
- Android Platform Tools no PATH (para `fastboot`)
- Drivers USB adequados por fabricante

## Instalação

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Executar

```powershell
python app.py
```

Ao iniciar:
1. Clique em **Detectar dispositivos**.
2. Veja as detecções no painel superior.
3. Veja sugestões de artigos no painel inferior.
4. Opcionalmente use filtros (marca/modelo/tags) e clique em **Buscar base de conhecimento**.

## Build local com PyInstaller

Instale:

```powershell
pip install pyinstaller
```

Gere executável single-file com console oculto:

```powershell
pyinstaller --noconfirm --onefile --windowed --name "TechVaultDeviceDetector" app.py
```

Saída em:

- `dist/TechVaultDeviceDetector.exe`

## Build e distribuição via GitHub (mais fácil para acesso)

> Este app **não roda no navegador/GitHub Pages**, pois precisa acessar USB local (`fastboot`/VID/PID).  
> O caminho ideal no GitHub é gerar o `.exe` automaticamente e baixar pronto em **Artifacts** ou **Releases**.

Foi adicionado workflow em `.github/workflows/build-windows.yml` com dois modos:

1. **Manual (`workflow_dispatch`)**
   - Vá em **Actions** → **Build Windows Executable** → **Run workflow**.
   - Ao finalizar, baixe o executável em **Artifacts** (`TechVaultDeviceDetector-windows`).

2. **Por tag de versão (`v*`)**
   - Crie e envie uma tag, por exemplo:
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```
   - O workflow compila no Windows e publica `TechVaultDeviceDetector.exe` na **Release** da tag.

## Banco de dados

- Arquivo: `device_detector.db`
- Tabelas:
  - `detections`
  - `knowledge_articles`

A base de artigos é semeada automaticamente na primeira execução.

## Observações

- Se `fastboot` não estiver no PATH, a detecção fastboot não retornará resultados.
- VID/PID hints cobrem cenários comuns e podem ser estendidos no arquivo `detector.py`.
- O app não executa flash nem ações de risco — apenas detecção, registro e recomendação de procedimentos legítimos.
