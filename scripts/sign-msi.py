"""将 Windows 32 位和 64 位 MSI 打成 Tauri 更新包，并用本机密钥签名。"""

import json
import re
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile


def main():
    """检查两种架构的安装包，签名成功后写入发布目录。"""
    if len(sys.argv) != 2:
        raise SystemExit("用法：python3 scripts/sign-msi.py <两个 MSI 所在的目录>")

    project = Path(__file__).resolve().parents[1]
    config = json.loads((project / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8"))
    version = config["package"]["version"]
    release_dir = Path(sys.argv[1]).resolve(strict=True)
    key_dir = project / "keys"
    key_file = key_dir / "updater.key"
    if (key_dir / "updater.key.pub").read_text().strip() != config["tauri"]["updater"]["pubkey"]:
        raise SystemExit("本机签名公钥和发布配置不一致")
    password = (key_dir / "updater.password").read_text().strip()

    installers = []
    for arch in ("x86", "x64"):
        suffix = re.compile(rf"_{re.escape(version)}_{arch}(?:_[^.]+)?\.msi$")
        matches = [path for path in release_dir.glob("*.msi") if suffix.search(path.name)]
        if len(matches) != 1:
            raise SystemExit(f"需要一个 {version} {arch} MSI 安装包")
        with matches[0].open("rb") as installer:
            if installer.read(8) != bytes.fromhex("d0cf11e0a1b11ae1"):
                raise SystemExit(f"安装包格式错误：{matches[0].name}")
        for extension in (".zip", ".zip.sig"):
            if matches[0].with_name(matches[0].name + extension).exists():
                raise SystemExit(f"更新产物已存在：{matches[0].name}{extension}")
        installers.append(matches[0])

    with TemporaryDirectory(dir=release_dir, prefix=".sign-msi-") as temp:
        staging = Path(temp)
        for installer in installers:
            archive = staging / (installer.name + ".zip")
            with ZipFile(archive, "w", compression=ZIP_DEFLATED) as update:
                update.write(installer, arcname=installer.name)
            result = subprocess.run(
                ["pnpm", "exec", "tauri", "signer", "sign", "-f", str(key_file), "-p", password, str(archive)],
                cwd=project,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            signature = staging / (archive.name + ".sig")
            if result.returncode or not signature.is_file() or signature.stat().st_size == 0:
                raise SystemExit(f"签名失败：{installer.name}。请核对本机私钥和密码文件。")

        for artifact in sorted(staging.iterdir()):
            destination = release_dir / artifact.name
            artifact.rename(destination)
            print(destination)


if __name__ == "__main__":
    main()
