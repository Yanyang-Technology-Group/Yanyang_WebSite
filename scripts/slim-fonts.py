#!/usr/bin/env python3
"""精简 public/fonts/fonts.css（一次性执行，产物已提交到仓库）。

背景
----
Google Fonts 导出的 fonts.css 按「子集 × 字重」展开，本仓库的 Inter 与
Noto Sans SC 都是**可变字体**（同一 woff2 文件同时服务 300~800 六个字重，
已用 WOFF2 表目录确认含 fvar/gvar），因此原文件里存在大量重复的 @font-face：
446 条规则只对应 108 个字体文件。

做法
----
1. 逐条解析 @font-face（不依赖子集注释，原始文件里大部分规则没有注释）；
2. 按 (font-family, src, unicode-range) 归并字重，合并后写成可变字体区间
   `font-weight: 300 800`，渲染效果与逐字重声明等价；
3. 丢掉站点语言（zh-CN / en-US）命中不到的 Inter 子集：
   cyrillic-ext / cyrillic / greek-ext / greek / vietnamese。

用法
----
    python scripts/slim-fonts.py            # 重新生成 public/fonts/fonts.css
    python scripts/slim-fonts.py --dry-run

升级字体时：从 Google Fonts 取回原始 CSS 覆盖 public/fonts/fonts.source.css，
再运行本脚本即可。
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = ROOT / "public" / "fonts"
TARGET = FONTS_DIR / "fonts.css"
SOURCE = FONTS_DIR / "fonts.source.css"

# 站点只面向中文/英文，这些子集永远不会命中
DROP_SUBSETS = {"cyrillic-ext", "cyrillic", "greek-ext", "greek", "vietnamese"}

FACE_RE = re.compile(r"@font-face\s*\{(?P<body>[^}]*)\}", re.S)


def prop(body: str, name: str) -> str | None:
    m = re.search(rf"(?:^|;)\s*{re.escape(name)}\s*:\s*([^;]+)", body)
    return m.group(1).strip() if m else None


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
        return value[1:-1]
    return value


def subset_of(body: str, src: str, all_ranges: dict[str, set[str]]) -> str:
    """用注释里的子集名做友好标注（没有注释就留空）。"""
    unicode_range = prop(body, "unicode-range")
    names = sorted(n for n, r in all_ranges.items() if r == unicode_range)
    return names[0] if names else ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    src_file = SOURCE if SOURCE.exists() else TARGET
    if not src_file.exists():
        raise SystemExit(f"找不到 {src_file}")
    css = src_file.read_text(encoding="utf-8")

    faces = []
    for m in FACE_RE.finditer(css):
        body = m.group("body")
        family = prop(body, "font-family")
        src = prop(body, "src")
        unicode_range = prop(body, "unicode-range")
        weight = prop(body, "font-weight")
        if not (family and src and unicode_range and weight):
            continue  # 结构异常，原样忽略
        # 紧邻的前置注释用来识别子集名
        prefix = css[max(0, m.start() - 120):m.start()]
        note = re.findall(r"/\*\s*([^*]+?)\s*\*/", prefix)
        faces.append({
            "family": unquote(family),
            "src": src,
            "range": unicode_range,
            "weight": weight,
            "subset": note[-1].strip() if note else "",
            "style": prop(body, "font-style") or "normal",
            "display": prop(body, "font-display") or "swap",
        })

    total_faces = len(faces)

    merged: dict[tuple[str, str, str], dict] = {}
    for f in faces:
        if f["subset"] in DROP_SUBSETS:
            continue
        key = (f["family"], f["src"], f["range"])
        entry = merged.setdefault(key, {
            "weights": set(), "subsets": set(), "style": f["style"], "display": f["display"],
        })
        entry["weights"].add(int(f["weight"]))
        if f["subset"]:
            entry["subsets"].add(f["subset"])

    out: list[str] = [
        "/* 由 scripts/slim-fonts.py 生成：可变字体按 font-weight 区间归并，已移除站点用不到的子集。",
        "   如需更新字形，请把 Google Fonts 原始 CSS 放到 fonts.source.css 后重新运行脚本。 */",
        "",
    ]
    for (family, src, unicode_range), info in merged.items():
        weights = sorted(info["weights"])
        weight = f"{weights[0]} {weights[-1]}" if len(weights) > 1 else str(weights[0])
        note = ", ".join(sorted(info["subsets"])) or "subset"
        out.append(f"/* {family} — {note} */")
        out.append("@font-face {")
        out.append(f"  font-family: '{family}';")
        out.append(f"  font-style: {info['style']};")
        out.append(f"  font-weight: {weight};")
        out.append(f"  font-display: {info['display']};")
        out.append(f"  src: {src};")
        out.append(f"  unicode-range: {unicode_range};")
        out.append("}")
        out.append("")

    result = "\n".join(out)
    before = len(css.encode())
    after = len(result.encode())
    print(f"解析到 @font-face: {total_faces} 条")
    print(f"合并后: {len(merged)} 条（丢弃子集: {', '.join(sorted(DROP_SUBSETS))}）")
    print(f"体积: {before/1024:.1f} KB → {after/1024:.1f} KB (节省 {(1-after/before)*100:.1f}%)")

    if not args.dry_run:
        TARGET.write_text(result, encoding="utf-8")
        print(f"已写入 {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
