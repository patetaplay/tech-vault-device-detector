# Tech Vault Device Detector (Windows / Python)

Aplicativo desktop para Windows que detecta aparelhos Android em **ADB**, **fastboot** e outros modos USB (via **VID/PID hints**), registra detecções em SQLite e recomenda procedimentos legítimos da base de conhecimento.

## O que o usuário final recebe

- Um arquivo **.zip** pronto para download no GitHub Actions/Release.
- O arquivo **.exe** também fica disponível separadamente nos artifacts/releases.
- Dentro do `.zip`:
  - `TechVaultDeviceDetector.exe`
  - `USO-RAPIDO.txt`
  - `README.md`

## Funcionalidades

- Detecção via **ADB** (quando Android está ligado + depuração USB ativa).
- Detecção via **fastboot/mfastboot** (`fastboot devices -l` + `getvar all` + fallback por variáveis).
- Detecção de modos USB por VID/PID (Download/EDL/Fastboot).
- Coleta e exibição (quando disponível) de:
  - SN/serial
  - IMEI (best effort; pode vir vazio por política do Android)
  - Modelo
  - CPU/SoC
  - RAM
  - Armazenamento
- Persistência em SQLite das detecções.
- Base de conhecimento local com busca por marca/modelo/tags.
- Sugestão automática de artigos com fallback de matching (mais robusto).
- Leitura por marca com abas dedicadas: Samsung, Motorola, Xiaomi e Realme.

## Requisitos (para uso completo)

- Windows 10/11
- Android Platform Tools no PATH (`adb` e `fastboot`)
- Drivers USB adequados por fabricante

## Observação importante sobre IMEI

Dependendo do modo e da política do aparelho (Android mais novo, permissões, bloqueios OEM), o IMEI pode não ser legível por ADB/fastboot comuns. Nesses casos o app mantém o campo como vazio e segue com as outras informações.


## Atualização automática do programa

O app agora tem:
- botão **⬆ Verificar atualização**
- verificação automática ao iniciar
- download automático da nova versão para a pasta `updates/`

### Como configurar
No arquivo `app.py`, ajuste a constante:

```python
UPDATE_REPO = "seu-usuario/tech-vault-device-detector"
```

Troque para o seu repositório real no GitHub (formato `usuario/repositorio`).


### Erro 404 no update
Se aparecer **"Erro HTTP ao buscar update: 404"**, normalmente significa:
- `UPDATE_REPO` está com valor placeholder/incorreto, ou
- ainda não existe release publicada no repositório.

Comportamento novo do app:
- se `UPDATE_REPO` não estiver configurado, ele não tenta update automático no startup;
- no clique manual de update, ele mostra instrução de configuração em vez de erro técnico.

### Fluxo de update
1. O app consulta `releases/latest` da API do GitHub.
2. Se houver versão maior que a atual, pergunta se deseja atualizar.
3. Se confirmar, baixa automaticamente o asset (`.zip` ou `.exe`) para `updates/`.
4. Depois é só fechar o app antigo e abrir/instalar a nova versão baixada.

## Uso do .exe

1. Baixe `TechVaultDeviceDetector-windows.zip` na aba **Actions** (artifact) ou **Releases**.
2. Extraia o `.zip`.
3. Execute `TechVaultDeviceDetector.exe`.
4. Clique em **Executar detecção** para detectar dispositivo.
5. Use **Executar busca** para filtrar artigos por marca/modelo/tags.
6. Para leitura rápida, use as abas de marca (Samsung/Motorola/Xiaomi/Realme) e clique em **Ler [Marca]**.

## Build local (mais fácil)

No Windows, clique duas vezes em `build_windows.bat`.

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

> Este app **não roda no navegador/GitHub Pages**, pois precisa acessar USB local (`adb`/`fastboot`/VID/PID).

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

## Banco de dados

- Arquivo: `device_detector.db`
- Tabelas:
  - `detections`
  - `knowledge_articles`

A base de artigos é semeada automaticamente na primeira execução.


## Observação sobre fastboot com dados vazios

Quando aparecer algo como `modo=fastboot` com SN/IMEI/modelo vazios e apenas `vid/pid`, isso indica que o app pegou apenas o **hint USB** do bootloader.

Para detalhar (SN/modelo/produto):
- instale o driver fastboot correto (Motorola Device Manager/driver USB),
- valide no terminal: `fastboot devices`,
- depois execute a detecção novamente.



## Diagnóstico quando a leitura vem incompleta

Se aparecer apenas `vid/pid` e o texto de **USB hint**, significa que o Windows reconheceu a porta USB, mas o comando fastboot não conseguiu ler variáveis do aparelho.

Checklist:
- Instale/reinstale o driver fastboot da Motorola.
- Teste no terminal: `fastboot devices -l` e (se necessário) `mfastboot devices`.
- Se o aparelho estiver ligado no Android, ative depuração USB e tente modo ADB para coletar mais dados.
