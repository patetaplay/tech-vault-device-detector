from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Iterable

DB_PATH = Path("device_detector.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detected_at TEXT NOT NULL,
    transport TEXT NOT NULL,
    mode TEXT NOT NULL,
    identifier TEXT,
    brand TEXT,
    model TEXT,
    product TEXT,
    serial_number TEXT,
    imei TEXT,
    cpu TEXT,
    ram TEXT,
    storage TEXT,
    vid TEXT,
    pid TEXT,
    details TEXT
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    tags TEXT NOT NULL,
    summary TEXT NOT NULL,
    steps TEXT NOT NULL,
    source TEXT
);
"""

DETECTION_COLUMNS: dict[str, str] = {
    "serial_number": "TEXT",
    "imei": "TEXT",
    "cpu": "TEXT",
    "ram": "TEXT",
    "storage": "TEXT",
}

DEFAULT_ARTICLES: list[dict[str, str]] = [
    {
        "title": "Samsung: instalar driver USB oficial",
        "brand": "Samsung",
        "model": "",
        "tags": "samsung,driver,download-mode,usb",
        "summary": "Instalação limpa dos drivers USB da Samsung para Odin/Download Mode.",
        "steps": (
            "1. Remova drivers antigos no Gerenciador de Dispositivos.\n"
            "2. Instale Samsung USB Driver oficial.\n"
            "3. Reinicie o PC e reconecte o aparelho em Download Mode.\n"
            "4. Valide se o VID/PID corresponde ao esperado para Samsung."
        ),
        "source": "Suporte Samsung",
    },
    {
        "title": "Xiaomi: flash oficial com Mi Flash",
        "brand": "Xiaomi",
        "model": "",
        "tags": "xiaomi,fastboot,flash-oficial,mi-flash",
        "summary": "Procedimento legítimo para reinstalação de ROM Fastboot oficial em Xiaomi.",
        "steps": (
            "1. Baixe ROM Fastboot oficial para o modelo correto.\n"
            "2. Instale drivers Qualcomm/Xiaomi e Mi Flash.\n"
            "3. Entre em Fastboot e execute flash_all (sem lock, se necessário).\n"
            "4. Aguarde reboot completo e valide baseband/IMEI."
        ),
        "source": "Xiaomi Community/MIUI",
    },
    {
        "title": "Motorola: diagnóstico de erro de fastboot",
        "brand": "Motorola",
        "model": "",
        "tags": "motorola,fastboot,erro,diagnostico,moto",
        "summary": "Checklist de diagnóstico para falhas de comunicação em Fastboot.",
        "steps": (
            "1. Troque cabo e porta USB (preferir USB 2.0 traseira).\n"
            "2. Execute fastboot devices para validar serial.\n"
            "3. Atualize Platform Tools e drivers Motorola.\n"
            "4. Cheque se bootloader está desbloqueado para comandos de flash."
        ),
        "source": "Motorola Rescue and Smart Assistant",
    },
    {
        "title": "Motorola: coleta de informações por ADB",
        "brand": "Motorola",
        "model": "",
        "tags": "motorola,moto,adb,serial,imei,cpu,ram,storage",
        "summary": "Como coletar SN, IMEI, CPU, RAM e armazenamento em aparelhos Motorola com Android ligado.",
        "steps": (
            "1. Habilite Depuração USB nas Opções do Desenvolvedor.\n"
            "2. Conecte o aparelho e aceite a chave RSA no telefone.\n"
            "3. Execute detecção no app (modo ADB).\n"
            "4. Se IMEI vier vazio, verifique permissões/restrições do Android e use ferramenta oficial de serviço."
        ),
        "source": "Boas práticas Android Debug Bridge",
    },
    {
        "title": "Realme: drivers e diagnóstico em modo fastboot/adb",
        "brand": "Realme",
        "model": "",
        "tags": "realme,oppo,adb,fastboot,driver,diagnostico",
        "summary": "Fluxo básico para validar comunicação Realme/OPPO no PC e evitar falhas de detecção.",
        "steps": (
            "1. Instale os drivers USB oficiais Realme/OPPO.\n"
            "2. Ative depuração USB e valide com adb devices.\n"
            "3. Em fastboot, valide com fastboot devices.\n"
            "4. Use firmware oficial da região correta em qualquer procedimento de recuperação."
        ),
        "source": "Suporte Realme/OPPO",
    },
    {
        "title": "Qualcomm 9008: recuperação com pacote oficial",
        "brand": "",
        "model": "",
        "tags": "qualcomm,9008,edl,download-mode,unbrick",
        "summary": "Fluxo de recuperação em modo Qualcomm HS-USB QDLoader 9008 com firmware oficial.",
        "steps": (
            "1. Confirmar VID/PID e porta COM no Gerenciador de Dispositivos.\n"
            "2. Usar ferramenta oficial/OEM para o aparelho (QFIL, MSM, etc).\n"
            "3. Carregar pacote de firmware homologado para SKU correta.\n"
            "4. Após conclusão, reiniciar e validar partições críticas."
        ),
        "source": "Documentação OEM / Qualcomm",
    },
]


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        _ensure_detection_columns(conn)

        existing = conn.execute("SELECT COUNT(*) AS total FROM knowledge_articles").fetchone()["total"]
        if existing == 0:
            conn.executemany(
                """
                INSERT INTO knowledge_articles (title, brand, model, tags, summary, steps, source)
                VALUES (:title, :brand, :model, :tags, :summary, :steps, :source)
                """,
                DEFAULT_ARTICLES,
            )


def _ensure_detection_columns(conn: sqlite3.Connection) -> None:
    rows = conn.execute("PRAGMA table_info(detections)").fetchall()
    existing = {row[1] for row in rows}
    for col, col_type in DETECTION_COLUMNS.items():
        if col not in existing:
            conn.execute(f"ALTER TABLE detections ADD COLUMN {col} {col_type}")


def save_detection(record: dict[str, str | None]) -> None:
    payload = {
        "detected_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "transport": record.get("transport", "USB"),
        "mode": record.get("mode", "unknown"),
        "identifier": record.get("identifier"),
        "brand": record.get("brand"),
        "model": record.get("model"),
        "product": record.get("product"),
        "serial_number": record.get("serial_number"),
        "imei": record.get("imei"),
        "cpu": record.get("cpu"),
        "ram": record.get("ram"),
        "storage": record.get("storage"),
        "vid": record.get("vid"),
        "pid": record.get("pid"),
        "details": record.get("details"),
    }

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO detections (
                detected_at, transport, mode, identifier, brand, model, product,
                serial_number, imei, cpu, ram, storage, vid, pid, details
            ) VALUES (
                :detected_at, :transport, :mode, :identifier, :brand, :model, :product,
                :serial_number, :imei, :cpu, :ram, :storage, :vid, :pid, :details
            )
            """,
            payload,
        )


def search_articles(query: str = "", brand: str = "", model: str = "", tags: Iterable[str] | None = None) -> list[sqlite3.Row]:
    tags = [tag.strip().lower() for tag in (tags or []) if tag.strip()]
    clauses = ["1=1"]
    params: list[str] = []

    if query:
        clauses.append("(title LIKE ? OR summary LIKE ? OR steps LIKE ?)")
        like = f"%{query}%"
        params.extend([like, like, like])

    if brand:
        clauses.append("(brand = ? OR brand = '')")
        params.append(brand)

    if model:
        clauses.append("(model = ? OR model = '')")
        params.append(model)

    for tag in tags:
        clauses.append("LOWER(tags) LIKE ?")
        params.append(f"%{tag}%")

    sql = (
        "SELECT * FROM knowledge_articles "
        f"WHERE {' AND '.join(clauses)} "
        "ORDER BY CASE WHEN brand = '' THEN 1 ELSE 0 END, title ASC"
    )

    with get_connection() as conn:
        return list(conn.execute(sql, params).fetchall())
