from __future__ import annotations

import struct
from pathlib import Path


def generate_ico(path: Path, size: int = 32) -> None:
    w = h = size

    icon_dir = struct.pack("<HHH", 0, 1, 1)
    and_row_bytes = ((w + 31) // 32) * 4
    bytes_in_res = 40 + (w * h * 4) + (and_row_bytes * h)
    image_offset = 6 + 16
    entry = struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, bytes_in_res, image_offset)

    bih = struct.pack(
        "<IIIHHIIIIII",
        40,
        w,
        h * 2,
        1,
        32,
        0,
        w * h * 4,
        0,
        0,
        0,
        0,
    )

    pixels = bytearray()
    for y in range(h - 1, -1, -1):
        for x in range(w):
            if 8 <= x <= 23 and 8 <= y <= 23:
                r, g, b, a = 34, 197, 94, 255
            else:
                r, g, b, a = 37, 99, 235, 255
            pixels += bytes([b, g, r, a])

    and_mask = bytes(and_row_bytes * h)
    ico_data = icon_dir + entry + bih + pixels + and_mask

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(ico_data)


if __name__ == "__main__":
    target = Path("assets/app_icon.ico")
    generate_ico(target)
    print(f"Generated icon: {target}")
