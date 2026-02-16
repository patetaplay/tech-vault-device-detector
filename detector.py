from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass

try:
    import usb.core
except Exception:  # pyusb may be unavailable in some environments
    usb = None
else:
    usb = usb.core


@dataclass
class DetectionResult:
    transport: str = "USB"
    mode: str = "unknown"
    identifier: str | None = None
    brand: str | None = None
    model: str | None = None
    product: str | None = None
    vid: str | None = None
    pid: str | None = None
    details: str | None = None

    def as_dict(self) -> dict[str, str | None]:
        return {
            "transport": self.transport,
            "mode": self.mode,
            "identifier": self.identifier,
            "brand": self.brand,
            "model": self.model,
            "product": self.product,
            "vid": self.vid,
            "pid": self.pid,
            "details": self.details,
        }


USB_MODE_HINTS: dict[tuple[str, str], dict[str, str]] = {
    ("18D1", "4EE0"): {"mode": "fastboot", "brand": "Google", "details": "Android Bootloader Interface"},
    ("04E8", "685D"): {"mode": "download-mode", "brand": "Samsung", "details": "Samsung Download Mode"},
    ("05C6", "9008"): {"mode": "edl-9008", "brand": "Qualcomm", "details": "HS-USB QDLoader 9008"},
    ("2717", "FF68"): {"mode": "fastboot", "brand": "Xiaomi", "details": "Xiaomi Fastboot"},
    ("22B8", "2E80"): {"mode": "fastboot", "brand": "Motorola", "details": "Motorola Fastboot"},
}


def detect_fastboot_devices(timeout: int = 8) -> list[DetectionResult]:
    """Detects devices available via fastboot and enriches with getvar product/model."""
    results: list[DetectionResult] = []

    try:
        cmd = ["fastboot", "devices"]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
    except FileNotFoundError:
        return []
    except subprocess.SubprocessError:
        return []

    for line in proc.stdout.splitlines():
        if not line.strip():
            continue
        serial = line.split()[0]

        product = _get_fastboot_var(serial, "product", timeout)
        model = _get_fastboot_var(serial, "model", timeout)

        result = DetectionResult(
            mode="fastboot",
            identifier=serial,
            product=product,
            model=model,
            details="Detectado via fastboot devices/getvar",
        )
        results.append(result)

    return results


def _get_fastboot_var(serial: str, var_name: str, timeout: int) -> str | None:
    try:
        proc = subprocess.run(
            ["fastboot", "-s", serial, "getvar", var_name],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except (subprocess.SubprocessError, FileNotFoundError):
        return None

    combined = f"{proc.stdout}\n{proc.stderr}"
    pattern = re.compile(rf"{re.escape(var_name)}\s*:\s*(.+)", flags=re.IGNORECASE)
    match = pattern.search(combined)
    if match:
        return match.group(1).strip()
    return None


def detect_usb_modes() -> list[DetectionResult]:
    """Enumerates USB VID/PID and maps known hints for Download/EDL/Fastboot."""
    if usb is None:
        return []

    devices = usb.find(find_all=True)
    detections: list[DetectionResult] = []

    for dev in devices:
        vid = f"{dev.idVendor:04X}"
        pid = f"{dev.idProduct:04X}"
        hint = USB_MODE_HINTS.get((vid, pid))
        if not hint:
            continue

        detections.append(
            DetectionResult(
                mode=hint["mode"],
                brand=hint.get("brand"),
                vid=vid,
                pid=pid,
                details=hint.get("details"),
            )
        )

    return detections
