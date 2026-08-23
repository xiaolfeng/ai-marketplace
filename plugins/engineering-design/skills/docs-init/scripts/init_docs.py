#!/usr/bin/env python3
"""初始化工程文档目录结构（幂等）。

在 docs/engineering/ 下创建 draft/research/rfc/design/adr 五段子目录，
已存在的目录与文件一律跳过，绝不覆盖。

用法：
    python3 init_docs.py [项目根目录]

不传参数时默认当前目录。退出码：0 成功，1 参数无效。
"""

import argparse
import sys
from pathlib import Path

SUBDIRS = ("draft", "research", "rfc", "design", "adr")


def init_docs(root: Path) -> tuple[list[str], list[str]]:
    """确保目录树就位，返回 (新建清单, 已存在跳过清单)。"""
    base = root / "docs" / "engineering"
    created: list[str] = []
    skipped: list[str] = []

    for name in SUBDIRS:
        target = base / name
        if target.is_dir():
            skipped.append(str(target))
            continue
        target.mkdir(parents=True, exist_ok=True)
        (target / ".gitkeep").touch()
        created.append(str(target))
    return created, skipped


def main() -> int:
    parser = argparse.ArgumentParser(description="初始化工程文档目录结构（幂等）")
    parser.add_argument("root", nargs="?", default=".", help="项目根目录，默认当前目录")
    args = parser.parse_args()

    root = Path(args.root)
    if not root.is_dir():
        print(f"错误：{root} 不是有效目录", file=sys.stderr)
        return 1

    created, _skipped = init_docs(root)

    if created:
        print("已创建：")
        for item in created:
            print(f"  + {item}")
    else:
        print("目录结构已就绪，无需创建")
    return 0


if __name__ == "__main__":
    sys.exit(main())
