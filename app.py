from __future__ import annotations

import sys
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk

from database import init_db, save_detection, search_articles
from detector import DetectionResult, detect_adb_devices, detect_fastboot_devices, detect_usb_modes
from updater import check_for_updates, download_update, is_update_repo_configured

APP_VERSION = "1.0.1"
UPDATE_REPO = "SEU_USUARIO/tech-vault-device-detector"
BRAND_TABS = ["Samsung", "Motorola", "Xiaomi", "Realme"]


def resource_path(relative_path: str) -> Path:
    """Resolve resource path for normal run and PyInstaller bundle."""
    base_path = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return base_path / relative_path


def infer_tags_from_detection(result: DetectionResult) -> list[str]:
    tags: list[str] = []
    for value in [
        result.mode,
        result.brand,
        result.model,
        result.product,
        result.cpu,
        result.ram,
        result.storage,
        result.details,
    ]:
        if not value:
            continue
        tags.extend(segment.strip().lower() for segment in value.replace("_", "-").split() if segment.strip())

    if result.mode == "fastboot":
        tags.extend(["fastboot", "flash-oficial", "diagnostico"])
    if result.mode == "adb":
        tags.extend(["adb", "serial", "imei", "cpu", "ram", "storage", "diagnostico"])
    if "download" in (result.mode or ""):
        tags.extend(["download-mode", "driver"])
    if "9008" in (result.mode or ""):
        tags.extend(["edl", "9008", "unbrick"])

    return sorted(set(tags))


def suggest_articles(result: DetectionResult, tags: list[str]) -> list[dict]:
    strategies = [
        {"brand": result.brand or "", "model": result.model or "", "tags": tags},
        {"brand": result.brand or "", "model": "", "tags": tags},
        {"brand": "", "model": "", "tags": tags[:4]},
        {"brand": result.brand or "", "model": "", "tags": [result.mode]},
    ]

    seen_ids: set[int] = set()
    aggregated: list[dict] = []
    for strategy in strategies:
        rows = search_articles(
            brand=strategy["brand"],
            model=strategy["model"],
            tags=[tag for tag in strategy["tags"] if tag],
        )
        for row in rows:
            if row["id"] in seen_ids:
                continue
            seen_ids.add(row["id"])
            aggregated.append(row)
    return aggregated


def consolidate_results(raw_results: list[DetectionResult]) -> list[DetectionResult]:
    """Prefer richer ADB/Fastboot records over plain USB-hint duplicates."""
    consolidated: list[DetectionResult] = []

    for item in raw_results:
        is_usb_hint_only = bool(item.details and "USB hint" in item.details and not (item.model or item.product or item.serial_number or item.imei))
        replaced = False

        for idx, existing in enumerate(consolidated):
            same_serial = bool(item.identifier and existing.identifier and item.identifier == existing.identifier)
            same_vid_pid_mode = bool(
                item.mode == existing.mode
                and item.vid
                and item.pid
                and item.vid == existing.vid
                and item.pid == existing.pid
            )

            if not (same_serial or same_vid_pid_mode):
                continue

            existing_is_hint = bool(existing.details and "USB hint" in existing.details and not (existing.model or existing.product or existing.serial_number or existing.imei))

            if existing_is_hint and not is_usb_hint_only:
                consolidated[idx] = item
            replaced = True
            break

        if not replaced:
            consolidated.append(item)

    return consolidated



class DeviceDetectorApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title(f"Tech Vault Device Detector - Assistente (v{APP_VERSION})")
        self.geometry("1100x780")
        self.minsize(980, 700)

        icon_path = resource_path("assets/app_icon.ico")
        if icon_path.exists():
            try:
                self.iconbitmap(default=str(icon_path))
            except Exception:
                pass

        init_db()
        self._build_ui()
        self.after(1200, self.check_updates_on_startup)

    def _build_ui(self) -> None:
        header = ttk.Frame(self, padding=(10, 10, 10, 0))
        header.pack(fill=tk.X)
        ttk.Label(
            header,
            text="Detector Android (ADB/Fastboot/Download/EDL)",
            font=("Segoe UI", 12, "bold"),
        ).pack(side=tk.LEFT)

        controls = ttk.Frame(self, padding=10)
        controls.pack(fill=tk.X)

        self.detect_button = ttk.Button(controls, text="▶ Executar detecção", command=self.run_detection)
        self.detect_button.pack(side=tk.LEFT, padx=4)

        self.search_button = ttk.Button(controls, text="🔎 Executar busca", command=self.run_manual_search)
        self.search_button.pack(side=tk.LEFT, padx=4)

        self.update_button = ttk.Button(controls, text="⬆ Verificar atualização", command=self.check_updates_manual)
        self.update_button.pack(side=tk.LEFT, padx=4)

        self.brand_var = tk.StringVar()
        self.model_var = tk.StringVar()
        self.tags_var = tk.StringVar()
        self.status_var = tk.StringVar(
            value="Pronto para uso. Conecte o aparelho e clique em 'Executar detecção'."
        )

        ttk.Label(controls, text="Marca:").pack(side=tk.LEFT, padx=(18, 4))
        ttk.Entry(controls, textvariable=self.brand_var, width=16).pack(side=tk.LEFT)
        ttk.Label(controls, text="Modelo:").pack(side=tk.LEFT, padx=(12, 4))
        ttk.Entry(controls, textvariable=self.model_var, width=16).pack(side=tk.LEFT)
        ttk.Label(controls, text="Tags:").pack(side=tk.LEFT, padx=(12, 4))
        ttk.Entry(controls, textvariable=self.tags_var, width=24).pack(side=tk.LEFT)

        brand_reading_frame = ttk.Labelframe(self, text="Leitura por marca (abas)", padding=8)
        brand_reading_frame.pack(fill=tk.X, padx=10, pady=(0, 6))

        notebook = ttk.Notebook(brand_reading_frame)
        notebook.pack(fill=tk.X, expand=True)
        for brand in BRAND_TABS:
            tab = ttk.Frame(notebook, padding=8)
            notebook.add(tab, text=brand)
            ttk.Label(tab, text=f"Abrir artigos e procedimentos da marca {brand}.").pack(side=tk.LEFT)
            ttk.Button(
                tab,
                text=f"Ler {brand}",
                command=lambda brand_name=brand: self.run_brand_tab_search(brand_name),
            ).pack(side=tk.LEFT, padx=12)

        panes = ttk.PanedWindow(self, orient=tk.VERTICAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 6))

        detected_frame = ttk.Labelframe(panes, text="Detecções")
        self.detection_text = tk.Text(detected_frame, wrap=tk.WORD, height=14)
        self.detection_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        panes.add(detected_frame, weight=2)

        kb_frame = ttk.Labelframe(panes, text="Sugestões e artigos")
        self.kb_text = tk.Text(kb_frame, wrap=tk.WORD)
        self.kb_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        panes.add(kb_frame, weight=2)

        status = ttk.Frame(self, padding=(10, 0, 10, 10))
        status.pack(fill=tk.X)
        ttk.Label(status, textvariable=self.status_var).pack(side=tk.LEFT)

        self._append_detection("Clique em 'Executar detecção' para iniciar.")

    def _append_detection(self, line: str) -> None:
        self.detection_text.insert(tk.END, f"{line}\n")
        self.detection_text.see(tk.END)

    def _set_kb(self, content: str) -> None:
        self.kb_text.delete("1.0", tk.END)
        self.kb_text.insert(tk.END, content)

    def check_updates_on_startup(self) -> None:
        if not is_update_repo_configured(UPDATE_REPO):
            self.status_var.set("Update automático desativado (configure UPDATE_REPO no app.py).")
            return
        self._check_updates(interactive=False)

    def check_updates_manual(self) -> None:
        if not is_update_repo_configured(UPDATE_REPO):
            messagebox.showinfo(
                "Atualização",
                "Configuração pendente. Edite app.py e defina UPDATE_REPO = 'usuario/repositorio'.",
            )
            self.status_var.set("Update não configurado.")
            return
        self._check_updates(interactive=True)

    def _check_updates(self, interactive: bool) -> None:
        self.status_var.set("Verificando atualização...")
        self.update_idletasks()

        info = check_for_updates(UPDATE_REPO, APP_VERSION)

        if info.error:
            self.status_var.set("Falha ao verificar atualização.")
            if interactive:
                messagebox.showwarning("Atualização", info.error)
            return

        if not info.available:
            self.status_var.set(f"Você já está na versão mais recente ({APP_VERSION}).")
            if interactive:
                messagebox.showinfo("Atualização", "Você já está com a versão mais recente.")
            return

        ask = messagebox.askyesno(
            "Atualização disponível",
            (
                f"Nova versão encontrada: {info.latest_version}\n"
                f"Versão atual: {APP_VERSION}\n\n"
                f"Deseja baixar automaticamente agora?"
            ),
        )
        if not ask:
            self.status_var.set("Atualização disponível, download cancelado pelo usuário.")
            return

        if not info.download_url:
            messagebox.showwarning("Atualização", "Nova versão encontrada, mas sem arquivo para download.")
            self.status_var.set("Sem asset para download da atualização.")
            return

        try:
            output = download_update(
                info.download_url,
                destination_dir=Path.cwd() / "updates",
                filename=info.asset_name,
            )
        except Exception as err:
            messagebox.showerror("Atualização", f"Falha no download da atualização: {err}")
            self.status_var.set("Falha no download da atualização.")
            return

        messagebox.showinfo(
            "Atualização baixada",
            (
                f"Download concluído com sucesso!\n\n"
                f"Arquivo: {output.name}\n"
                f"Pasta: {output.parent}\n\n"
                f"Feche o programa atual e instale/extraia a nova versão."
            ),
        )
        self.status_var.set(f"Atualização baixada em: {output}")

    def run_detection(self) -> None:
        self.status_var.set("Detectando dispositivos...")
        self.update_idletasks()
        self.detection_text.delete("1.0", tk.END)

        raw_results: list[DetectionResult] = []
        raw_results.extend(detect_adb_devices())
        raw_results.extend(detect_fastboot_devices())
        raw_results.extend(detect_usb_modes())
        results = consolidate_results(raw_results)

        if not results:
            self._append_detection("Nenhum dispositivo compatível detectado no momento.")
            self._set_kb("Sem sugestões no momento. Conecte um aparelho em adb/fastboot/download mode.")
            self.status_var.set("Nenhum dispositivo detectado.")
            return

        suggestions: list[str] = []

        for idx, result in enumerate(results, start=1):
            save_detection(result.as_dict())
            self._append_detection(
                f"[{idx}] modo={result.mode} marca={result.brand or '-'} modelo={result.model or '-'} produto={result.product or '-'}"
            )

            details_line = (
                f"     serial={result.serial_number or result.identifier or '-'} imei={result.imei or '-'} "
                f"cpu={result.cpu or '-'} ram={result.ram or '-'} storage={result.storage or '-'} "
                f"vid={result.vid or '-'} pid={result.pid or '-'}"
            )
            self._append_detection(details_line)

            if result.mode == "fastboot" and not (result.serial_number or result.identifier):
                self._append_detection(
                    "     Obs: somente hint USB detectado. Instale driver fastboot Motorola e valide 'fastboot devices' para detalhes completos."
                )

            tags = infer_tags_from_detection(result)
            articles = suggest_articles(result, tags)

            if not articles:
                continue

            suggestions.append(f"=== Sugestões para detecção [{idx}] ({result.mode}) ===")
            for art in articles[:5]:
                suggestions.append(
                    f"• {art['title']}\n"
                    f"  Tags: {art['tags']}\n"
                    f"  Resumo: {art['summary']}\n"
                    f"  Passos:\n{art['steps']}\n"
                )

        if suggestions:
            self._set_kb("\n".join(suggestions))
        else:
            self._set_kb(
                "Detecção realizada. Ainda não houve match forte na base; tente 'Executar busca' com tags como: "
                "motorola, fastboot, adb, imei, cpu, ram, storage."
            )

        self.status_var.set(f"Detecção concluída. {len(results)} item(ns) encontrado(s).")

    def run_brand_tab_search(self, brand: str) -> None:
        self.brand_var.set(brand)
        self.model_var.set("")
        self.tags_var.set("")
        self.status_var.set(f"Leitura por aba: {brand}")
        self.run_manual_search()

    def run_manual_search(self) -> None:
        self.status_var.set("Buscando artigos na base de conhecimento...")
        self.update_idletasks()
        tags = [tag.strip() for tag in self.tags_var.get().split(",") if tag.strip()]
        rows = search_articles(
            brand=self.brand_var.get().strip(),
            model=self.model_var.get().strip(),
            tags=tags,
        )

        if not rows:
            self._set_kb("Nenhum artigo encontrado para os filtros informados.")
            self.status_var.set("Busca concluída sem resultados.")
            return

        content = []
        for art in rows:
            content.append(
                f"{art['title']}\n"
                f"Marca/Modelo: {art['brand'] or '*'} / {art['model'] or '*'}\n"
                f"Tags: {art['tags']}\n"
                f"Resumo: {art['summary']}\n"
                f"Passos:\n{art['steps']}\n"
                f"Fonte: {art['source'] or '-'}\n"
                + "-" * 72
            )

        self._set_kb("\n".join(content))
        self.status_var.set(f"Busca concluída. {len(rows)} artigo(s) encontrado(s).")


if __name__ == "__main__":
    app = DeviceDetectorApp()
    app.mainloop()
