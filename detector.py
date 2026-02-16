from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass

try:
    import usb.core
    import usb.util
except Exception:  # pyusb may be unavailable in some environments
    usb = None
    usb_util = None
else:
    usb = usb.core
    usb_util = usb.util

FASTBOOT_BINARIES = ["fastboot", "mfastboot"]


@dataclass
class DetectionResult:
    transport: str = "USB"
    mode: str = "unknown"
    identifier: str | None = None
    brand: str | None = None
    model: str | None = None
    product: str | None = None
    serial_number: str | None = None
    imei: str | None = None
    cpu: str | None = None
    ram: str | None = None
    storage: str | None = None
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
            "serial_number": self.serial_number,
            "imei": self.imei,
            "cpu": self.cpu,
            "ram": self.ram,
            "storage": self.storage,
            "vid": self.vid,
            "pid": self.pid,
            "details": self.details,
        }


USB_MODE_HINTS: dict[tuple[str, str], dict[str, str]] = {
    ("18D1", "4EE0"): {"mode": "fastboot", "brand": "Google", "details": "Android Bootloader Interface (USB hint)"},
    ("04E8", "685D"): {"mode": "download-mode", "brand": "Samsung", "details": "Samsung Download Mode"},
    ("05C6", "9008"): {"mode": "edl-9008", "brand": "Qualcomm", "details": "HS-USB QDLoader 9008"},
    ("2717", "FF68"): {"mode": "fastboot", "brand": "Xiaomi", "details": "Xiaomi Fastboot (USB hint)"},
    ("22B8", "2E80"): {"mode": "fastboot", "brand": "Motorola", "details": "Motorola Fastboot (USB hint)"},
}


BRAND_HINTS = {
    "moto": "Motorola",
    "motorola": "Motorola",
    "samsung": "Samsung",
    "xiaomi": "Xiaomi",
    "redmi": "Xiaomi",
    "poco": "Xiaomi",
    "google": "Google",
    "pixel": "Google",
    "oneplus": "OnePlus",
    "realme": "Realme",
}


def _run_command(cmd: list[str], timeout: int = 8) -> str:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)
    except (FileNotFoundError, subprocess.SubprocessError):
        return ""
    return f"{proc.stdout}\n{proc.stderr}"


def _run_fastboot_command(args: list[str], timeout: int = 8) -> tuple[str, str | None]:
    """Try fastboot then mfastboot; return output and binary used."""
    for binary in FASTBOOT_BINARIES:
        output = _run_command([binary, *args], timeout=timeout)
        if output.strip():
            return output, binary
    return "", None


def _parse_key_values(raw_output: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in raw_output.splitlines():
        cleaned = line.strip()
        cleaned = cleaned.replace("(bootloader)", "").strip()
        if ":" not in cleaned:
            continue
        key, value = cleaned.split(":", 1)
        key = key.strip().lower()
        if not key:
            continue
        values[key] = value.strip()
    return values


def _infer_brand(*candidates: str | None) -> str | None:
    combined = " ".join(value.lower() for value in candidates if value)
    for token, brand in BRAND_HINTS.items():
        if token in combined:
            return brand
    return None


def _extract_imei(*candidates: str | None) -> str | None:
    for value in candidates:
        if not value:
            continue
        match = re.search(r"\b\d{14,17}\b", value)
        if match:
            return match.group(0)
    return None


def _format_gb_from_kb(kb_value: str | None) -> str | None:
    if not kb_value:
        return None
    digits = re.sub(r"[^0-9]", "", kb_value)
    if not digits:
        return None
    kb = int(digits)
    gb = kb / (1024 * 1024)
    return f"{gb:.1f} GB"


def _parse_devices_output(raw_output: str) -> list[dict[str, str]]:
    devices: list[dict[str, str]] = []
    for line in raw_output.splitlines():
        cleaned = line.strip()
        if not cleaned or "\t" not in cleaned:
            continue

        parts = cleaned.split()
        if len(parts) < 2:
            continue

        serial = parts[0]
        info = {"serial": serial}

        for token in parts[2:]:
            if ":" in token:
                k, v = token.split(":", 1)
                info[k.lower()] = v
        devices.append(info)
    return devices


def _collect_fastboot_vars(serial: str, timeout: int = 8) -> tuple[dict[str, str], str | None]:
    vars_map: dict[str, str] = {}
    vars_raw, used_binary = _run_fastboot_command(["-s", serial, "getvar", "all"], timeout=timeout)
    vars_map.update(_parse_key_values(vars_raw))

    # Fallback for devices/toolchains where getvar all is limited.
    fallback_vars = [
        "product",
        "model",
        "serialno",
        "serial-number",
        "imei",
        "imei1",
        "meid",
        "cpu",
        "soc",
        "chipname",
        "ram",
        "memory",
        "storage",
        "ufs",
        "emmc",
    ]
    for var_name in fallback_vars:
        if var_name in vars_map and vars_map[var_name]:
            continue
        value_raw, _ = _run_fastboot_command(["-s", serial, "getvar", var_name], timeout=timeout)
        single = _parse_key_values(value_raw)
        if var_name in single and single[var_name]:
            vars_map[var_name] = single[var_name]

    return vars_map, used_binary


def detect_fastboot_devices(timeout: int = 8) -> list[DetectionResult]:
    """Detects devices available via fastboot/mfastboot and enriches details."""
    results: list[DetectionResult] = []
    raw_out, used_binary = _run_fastboot_command(["devices", "-l"], timeout=timeout)

    if not raw_out.strip():
        # Some builds do not support -l; retry plain devices.
        raw_out, used_binary = _run_fastboot_command(["devices"], timeout=timeout)

    for device_info in _parse_devices_output(raw_out):
        serial = device_info.get("serial")
        if not serial:
            continue

        vars_map, vars_binary = _collect_fastboot_vars(serial, timeout=timeout)

        model = vars_map.get("model") or vars_map.get("sku") or device_info.get("model")
        product = vars_map.get("product") or device_info.get("product")
        serial_number = vars_map.get("serialno") or vars_map.get("serial-number") or serial
        imei = _extract_imei(vars_map.get("imei"), vars_map.get("imei1"), vars_map.get("meid"))
        brand = _infer_brand(vars_map.get("brand"), model, product)

        active_binary = vars_binary or used_binary or "fastboot"

        result = DetectionResult(
            mode="fastboot",
            identifier=serial,
            brand=brand,
            model=model,
            product=product,
            serial_number=serial_number,
            imei=imei,
            cpu=vars_map.get("cpu") or vars_map.get("soc") or vars_map.get("chipname"),
            ram=vars_map.get("ram") or vars_map.get("memory"),
            storage=vars_map.get("storage") or vars_map.get("ufs") or vars_map.get("emmc"),
            details=f"Detectado via {active_binary} devices/getvar",
        )
        results.append(result)

    return results


def detect_adb_devices(timeout: int = 8) -> list[DetectionResult]:
    """Detects online ADB devices and collects rich hardware/software details when available."""
    results: list[DetectionResult] = []
    adb_out = _run_command(["adb", "devices", "-l"], timeout=timeout)

    for line in adb_out.splitlines():
        cleaned = line.strip()
        if not cleaned or cleaned.startswith("List of devices"):
            continue
        parts = cleaned.split()
        if len(parts) < 2 or parts[1] != "device":
            continue

        serial = parts[0]
        getprop_raw = _run_command(["adb", "-s", serial, "shell", "getprop"], timeout=timeout)
        props = _parse_getprop(getprop_raw)

        brand = props.get("ro.product.brand") or _infer_brand(props.get("ro.product.model"), props.get("ro.product.device"))
        model = props.get("ro.product.model")
        product = props.get("ro.product.device")
        serial_number = props.get("ro.serialno") or serial

        cpu = props.get("ro.soc.model") or props.get("ro.board.platform") or props.get("ro.hardware")
        ram = _detect_adb_ram(serial, timeout=timeout)
        storage = _detect_adb_storage(serial, timeout=timeout)
        imei = _extract_imei(
            props.get("persist.radio.imei"),
            props.get("persist.radio.imei1"),
            _run_command(["adb", "-s", serial, "shell", "service", "call", "iphonesubinfo", "1"], timeout=timeout),
        )

        results.append(
            DetectionResult(
                mode="adb",
                identifier=serial,
                brand=brand,
                model=model,
                product=product,
                serial_number=serial_number,
                imei=imei,
                cpu=cpu,
                ram=ram,
                storage=storage,
                details="Detectado via adb devices/getprop",
            )
        )

    return results


def _parse_getprop(raw_output: str) -> dict[str, str]:
    props: dict[str, str] = {}
    pattern = re.compile(r"^\[(.+?)\]\s*:\s*\[(.*)\]$")
    for line in raw_output.splitlines():
        match = pattern.match(line.strip())
        if not match:
            continue
        props[match.group(1)] = match.group(2)
    return props


def _detect_adb_ram(serial: str, timeout: int = 8) -> str | None:
    meminfo = _run_command(["adb", "-s", serial, "shell", "cat", "/proc/meminfo"], timeout=timeout)
    for line in meminfo.splitlines():
        if line.lower().startswith("memtotal"):
            _, value = line.split(":", 1)
            return _format_gb_from_kb(value)
    return None


def _detect_adb_storage(serial: str, timeout: int = 8) -> str | None:
    df_out = _run_command(["adb", "-s", serial, "shell", "df", "/data"], timeout=timeout)
    for line in df_out.splitlines():
        if "/data" not in line:
            continue
        parts = line.split()
        if len(parts) >= 2:
            size = parts[1]
            if size.lower().endswith("g"):
                return size.upper()
            if size.isdigit():
                kb = int(size)
                return f"{kb / (1024 * 1024):.1f} GB"
            return size
    return None


def _get_usb_serial(dev) -> str | None:
    if usb_util is None:
        return None
    try:
        if getattr(dev, "iSerialNumber", 0):
            return usb_util.get_string(dev, dev.iSerialNumber)
    except Exception:
        return None
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
                identifier=_get_usb_serial(dev),
                vid=vid,
                pid=pid,
                details=hint.get("details"),
            )
        )

    return detections
