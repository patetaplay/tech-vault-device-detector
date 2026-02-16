from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

API_URL_TEMPLATE = "https://api.github.com/repos/{repo}/releases/latest"


@dataclass
class UpdateInfo:
    available: bool
    current_version: str
    latest_version: str | None = None
    download_url: str | None = None
    asset_name: str | None = None
    release_url: str | None = None
    notes: str | None = None
    error: str | None = None


def _normalize_version(version: str) -> tuple[int, ...]:
    cleaned = version.strip().lower().removeprefix("v")
    parts = re.findall(r"\d+", cleaned)
    return tuple(int(p) for p in parts) if parts else (0,)


def _is_newer(current: str, latest: str) -> bool:
    return _normalize_version(latest) > _normalize_version(current)


def check_for_updates(repo_slug: str, current_version: str) -> UpdateInfo:
    if not repo_slug or "/" not in repo_slug:
        return UpdateInfo(
            available=False,
            current_version=current_version,
            error="Repositório de update não configurado. Use o formato usuario/repositorio.",
        )

    api_url = API_URL_TEMPLATE.format(repo=repo_slug)

    req = urllib.request.Request(
        api_url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "TechVaultDeviceDetector-Updater",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        return UpdateInfo(False, current_version, error=f"Erro HTTP ao buscar update: {err.code}")
    except urllib.error.URLError as err:
        return UpdateInfo(False, current_version, error=f"Sem conexão para update: {err.reason}")
    except Exception as err:
        return UpdateInfo(False, current_version, error=f"Erro ao buscar update: {err}")

    latest_tag = payload.get("tag_name", "").strip()
    release_url = payload.get("html_url")
    notes = payload.get("body")

    if not latest_tag:
        return UpdateInfo(False, current_version, error="Release sem tag_name.")

    if not _is_newer(current_version, latest_tag):
        return UpdateInfo(
            available=False,
            current_version=current_version,
            latest_version=latest_tag,
            release_url=release_url,
            notes=notes,
        )

    preferred_assets = [
        "TechVaultDeviceDetector-windows.zip",
        "TechVaultDeviceDetector.exe",
    ]

    assets = payload.get("assets", [])
    selected = None
    for preferred in preferred_assets:
        for asset in assets:
            if asset.get("name") == preferred and asset.get("browser_download_url"):
                selected = asset
                break
        if selected:
            break

    if not selected and assets:
        selected = next((a for a in assets if a.get("browser_download_url")), None)

    if not selected:
        return UpdateInfo(
            available=True,
            current_version=current_version,
            latest_version=latest_tag,
            release_url=release_url,
            notes=notes,
            error="Nova versão encontrada, mas sem asset para download.",
        )

    return UpdateInfo(
        available=True,
        current_version=current_version,
        latest_version=latest_tag,
        download_url=selected.get("browser_download_url"),
        asset_name=selected.get("name"),
        release_url=release_url,
        notes=notes,
    )


def download_update(download_url: str, destination_dir: Path, filename: str | None = None) -> Path:
    destination_dir.mkdir(parents=True, exist_ok=True)
    final_name = filename or Path(download_url).name or "TechVaultDeviceDetector-update.bin"
    target = destination_dir / final_name

    req = urllib.request.Request(
        download_url,
        headers={"User-Agent": "TechVaultDeviceDetector-Updater"},
    )

    with urllib.request.urlopen(req, timeout=60) as response:
        data = response.read()
    target.write_bytes(data)
    return target
