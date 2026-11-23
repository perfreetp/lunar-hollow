"""Build a compact CJK font subset used by the 3D troika labels.

Instantiates the variable Noto Sans SC at a fixed weight and keeps the
GB2312 level-1 + level-2 hanzi, ASCII, common punctuation and a handful of
symbols so arbitrary imported role names still render.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf")
OUT = ROOT / "public" / "assets" / "noto-sans-sc-subset.ttf"


def gb2312_chars() -> set[str]:
    chars: set[str] = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                continue
    return chars


def build() -> None:
    chars = gb2312_chars()
    chars |= set(chr(c) for c in range(0x20, 0x7F))
    chars |= set("，。、；：“”‘’（）《》【】！？—…·×÷±≥≤→←↑↓℃°№")
    # Symbols / latin accents that can appear in airline or equipment names.
    chars |= set("°′″№℃·•○●◆◇■□▲△▼▽★☆")
    chars |= set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
    chars |= set("航班号机位时间保障作业加油行李摆渡客舱清洁航食清水污水推出牵引")

    font = TTFont(SRC)
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": 480}, inplace=True, updateFontNames=False)

    opts = subset.Options()
    opts.name_IDs = ["*"]
    opts.name_legacy = True
    opts.name_languages = ["*"]
    opts.layout_features = ["*"]
    opts.hinting = True
    opts.desubroutinize = True
    opts.drop_tables += ["DSIG"]
    opts.notdef_outline = True
    opts.glyph_names = False

    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(text="".join(sorted(chars)))
    subsetter.subset(font)

    buf = io.BytesIO()
    font.flavor = None
    font.save(buf)
    data = buf.getvalue()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(data)
    print(f"glyphs={len(font.getGlyphOrder())} chars={len(chars)} bytes={len(data)} -> {OUT}")


if __name__ == "__main__":
    sys.exit(build())
