from __future__ import annotations

import tkinter as tk
from tkinter import ttk

from database import init_db, save_detection, search_articles
from detector import DetectionResult, detect_fastboot_devices, detect_usb_modes


def infer_tags_from_detection(result: DetectionResult) -> list[str]:
    tags: list[str] = []
    for value in [result.mode, result.brand, result.model, result.product, result.details]:
        if not value:
            continue
        tags.extend(segment.strip().lower() for segment in value.replace("_", "-").split() if segment.strip())

    if result.mode == "fastboot":
        tags.extend(["fastboot", "flash-oficial", "diagnostico"])
    if "download" in (result.mode or ""):
        tags.extend(["download-mode", "driver"])
    if "9008" in (result.mode or ""):
        tags.extend(["edl", "9008", "unbrick"])

    return sorted(set(tags))


class DeviceDetectorApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Tech Vault Device Detector")
        self.geometry("1000x700")
        self.minsize(920, 640)

        init_db()
        self._build_ui()

    def _build_ui(self) -> None:
        header = ttk.Frame(self, padding=(10, 10, 10, 0))
        header.pack(fill=tk.X)
        ttk.Label(
            header,
            text="Detector Android (Fastboot/Download/EDL)",
            font=("Segoe UI", 12, "bold"),
        ).pack(side=tk.LEFT)

        controls = ttk.Frame(self, padding=10)
        controls.pack(fill=tk.X)

        self.detect_button = ttk.Button(
            controls,
            text="▶ Executar detecção",
            command=self.run_detection,
        )
        self.detect_button.pack(side=tk.LEFT, padx=4)

        self.search_button = ttk.Button(
            controls,
            text="🔎 Executar busca",
            command=self.run_manual_search,
        )
        self.search_button.pack(side=tk.LEFT, padx=4)

        self.brand_var = tk.StringVar()
        self.model_var = tk.StringVar()
        self.tags_var = tk.StringVar()
        self.status_var = tk.StringVar(value="Pronto para uso. Conecte o aparelho e clique em 'Executar detecção'.")

        ttk.Label(controls, text="Marca:").pack(side=tk.LEFT, padx=(18, 4))
        ttk.Entry(controls, textvariable=self.brand_var, width=16).pack(side=tk.LEFT)
        ttk.Label(controls, text="Modelo:").pack(side=tk.LEFT, padx=(12, 4))
        ttk.Entry(controls, textvariable=self.model_var, width=16).pack(side=tk.LEFT)
        ttk.Label(controls, text="Tags:").pack(side=tk.LEFT, padx=(12, 4))
        ttk.Entry(controls, textvariable=self.tags_var, width=24).pack(side=tk.LEFT)

        panes = ttk.PanedWindow(self, orient=tk.VERTICAL)
        panes.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 6))

        detected_frame = ttk.Labelframe(panes, text="Detecções")
        self.detection_text = tk.Text(detected_frame, wrap=tk.WORD, height=12)
        self.detection_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        panes.add(detected_frame, weight=1)

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

    def run_detection(self) -> None:
        self.status_var.set("Detectando dispositivos...")
        self.update_idletasks()
        self.detection_text.delete("1.0", tk.END)
        results: list[DetectionResult] = []

        fastboot_results = detect_fastboot_devices()
        usb_results = detect_usb_modes()
        results.extend(fastboot_results)
        results.extend(usb_results)

        if not results:
            self._append_detection("Nenhum dispositivo compatível detectado no momento.")
            self._set_kb("Sem sugestões no momento. Conecte um aparelho em fastboot/download mode.")
            self.status_var.set("Nenhum dispositivo detectado.")
            return

        suggestions: list[str] = []

        for idx, result in enumerate(results, start=1):
            save_detection(result.as_dict())
            self._append_detection(
                f"[{idx}] modo={result.mode} marca={result.brand or '-'} modelo={result.model or '-'} "
                f"produto={result.product or '-'} serial={result.identifier or '-'} vid={result.vid or '-'} pid={result.pid or '-'}"
            )

            tags = infer_tags_from_detection(result)
            articles = search_articles(
                brand=result.brand or "",
                model=result.model or "",
                tags=tags,
            )

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
            self._set_kb("Detecção realizada, mas sem artigos relacionados para os tags atuais.")

        self.status_var.set(f"Detecção concluída. {len(results)} item(ns) encontrado(s).")

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
