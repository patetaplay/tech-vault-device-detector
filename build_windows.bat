@echo off
setlocal

if not exist .venv (
  py -m venv .venv
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

python scripts\generate_icon.py

pyinstaller --noconfirm --onefile --windowed --name "TechVaultDeviceDetector" --icon "assets/app_icon.ico" --version-file "windows_version_info.txt" --add-data "assets/app_icon.ico;assets" app.py

echo.
echo Build concluido.
echo EXE gerado em: dist\TechVaultDeviceDetector.exe
pause
