#!/usr/bin/env python3
"""图片体积优化脚本（一次性执行，产物已提交到仓库）。

用途
----
把 public/images 下体积过大的 PNG 转成 WebP，并顺带按“实际显示尺寸”缩放到
合理的像素，避免浏览器为 24px 高的 logo 解码 5000px 宽的位图。

依赖
----
    pip install Pillow

用法
----
    python scripts/optimize-images.py            # 生成/覆盖 WebP 产物
    python scripts/optimize-images.py --dry-run  # 只打印预估结果，不写文件

规则说明
--------
每条规则 = (源文件, 目标文件, 最大宽, 最大高, 模式)
  * 最大宽/高为 0 表示保持原始尺寸（只换编码格式）。
  * 模式 "photo"   → 有损 q=82 method=6：适合照片/地形图这类连续色调。
  * 模式 "graphic" → 在「无损」与「有损 q=90」之间自动取体积更小的那个：
                     纯色/线条为主的 logo 通常无损更小且不会有边缘噪点。

新增图片时，按上面的尺寸规则补一条 RULES 再执行本脚本即可。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("缺少 Pillow，请先执行：pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "public" / "images"

# (源, 目标, 最大宽, 最大高, 模式)
RULES: list[tuple[str, str, int, int, str]] = [
    # —— 地图页轮播大图：页面上以 16:7 容器 cover 显示且带 blur(4px)，1600px 足够 ——
    ("map/1.png", "map/satellite.webp", 1600, 0, "photo"),
    ("map/2.png", "map/railway.webp", 1600, 0, "photo"),
    # ——— 活动页整屏背景（与 map/1 同源同图，复用 satellite.webp，不再单独产物）———
    ("events/2027/background.png", "events/2027/background.webp", 0, 0, "photo"),
    # —— 品牌图形：最大显示高度只有 24~32px，按 4x 屏留足余量 ——
    ("logo.png", "logo.webp", 1200, 0, "graphic"),
    ("logo2.png", "logo2.webp", 1200, 0, "graphic"),
    ("events/4years/4yearslogo.png", "events/4years/4yearslogo.webp", 480, 0, "graphic"),
    # 2027 页 logo：CSS 宽 min(100%, 580px)，2x 屏 → 1160
    ("events/2027/logo.png", "events/2027/logo.webp", 1160, 0, "graphic"),
    # 合作方 logo：卡片框 192x96，2x 屏 → 384
    ("us/1.png", "us/1.webp", 384, 384, "graphic"),
    ("us/2.png", "us/2.webp", 384, 384, "graphic"),
    ("us/3.png", "us/3.webp", 384, 384, "graphic"),
    ("us/4.png", "us/4.webp", 384, 384, "graphic"),
    ("us/5.png", "us/5.webp", 384, 384, "graphic"),
    ("us/6.png", "us/6.webp", 384, 384, "graphic"),
    ("us/7.png", "us/7.webp", 384, 384, "graphic"),
    ("us/8.png", "us/8.webp", 384, 384, "graphic"),
    # 技术栈图标：显示高度 32px
    ("join/cf.png", "join/cf.webp", 128, 128, "graphic"),
]

# 站点图标需要保留 PNG（favicon 兼容性），只做尺寸缩放
FAVICON = ("icon.png", 512)


def kb(path: Path) -> float:
    return path.stat().st_size / 1024


def encode(src_img: Image.Image, mode: str, dst: Path) -> int:
    """按模式编码，返回写入后的字节数。"""
    if mode == "photo":
        src_img.save(dst, "WEBP", quality=82, method=6)
        return dst.stat().st_size

    # graphic：无损 / 有损各出一份，取小者
    lossless = dst.with_suffix(".lossless.webp")
    lossy = dst.with_suffix(".lossy.webp")
    src_img.save(lossless, "WEBP", lossless=True, method=6)
    src_img.save(lossy, "WEBP", quality=90, alpha_quality=100, method=6)
    keep = lossless if lossless.stat().st_size <= lossy.stat().st_size else lossy
    keep.replace(dst)
    (lossy if keep is lossless else lossless).unlink()
    return dst.stat().st_size


def resize_if_needed(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    if not max_w and not max_h:
        return img
    w, h = img.size
    scale = 1.0
    if max_w and w > max_w:
        scale = min(scale, max_w / w)
    if max_h and h > max_h:
        scale = min(scale, max_h / h)
    if scale >= 1.0:
        return img
    return img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="只打印，不写文件")
    args = parser.parse_args()

    if not IMAGES.is_dir():
        sys.exit(f"找不到图片目录：{IMAGES}")

    total_before = total_after = 0
    print(f"{'源文件':52s} {'原始':>9s} {'产物':>9s} {'节省':>7s}  尺寸")
    print("-" * 100)

    for src_rel, dst_rel, max_w, max_h, mode in RULES:
        src = IMAGES / src_rel
        dst = IMAGES / dst_rel
        if not src.exists():
            print(f"{src_rel:52s} 跳过（源文件不存在）")
            continue

        with Image.open(src) as im:
            im.load()
            out = resize_if_needed(im, max_w, max_h)
            before = kb(src)
            if args.dry_run:
                after = 0
            else:
                dst.parent.mkdir(parents=True, exist_ok=True)
                after = encode(out, mode, dst) / 1024
            total_before += before
            total_after += after
            saved = 0 if args.dry_run else (1 - after / before) * 100
            print(
                f"{src_rel:52s} {before:8.1f}K {after:8.1f}K {saved:6.1f}%  "
                f"{im.size[0]}x{im.size[1]} → {out.size[0]}x{out.size[1]}"
            )

    if not args.dry_run:
        print("-" * 100)
        print(
            f"合计 {total_before / 1024:.2f} MB → {total_after / 1024:.2f} MB "
            f"(节省 {(1 - total_after / total_before) * 100:.1f}%)"
        )

    # favicon 只缩放、保持 PNG
    icon = IMAGES / FAVICON[0]
    if icon.exists():
        with Image.open(icon) as im:
            im.load()
            out = resize_if_needed(im, FAVICON[1], FAVICON[1])
            if not args.dry_run and out.size != im.size:
                before = kb(icon)
                out.save(icon, "PNG", optimize=True)
                print(f"{FAVICON[0]:52s} {before:8.1f}K {kb(icon):8.1f}K       -  {im.size[0]}x{im.size[1]} → {out.size[0]}x{out.size[1]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
