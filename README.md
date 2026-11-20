# 单词速记客户端

`pnpm dev` 启动的桌面壳和 `pnpm build` 生成的应用都直接加载正式学生端 `https://www.qiasieng.com`。

```bash
pnpm install
pnpm dev
```

## Windows 安装包

GitHub Actions 的 **Build Windows MSI** 生成 Windows 32 位和 64 位 MSI。推送 `v*` 标签或手动运行工作流后，从 Artifacts 下载并解压两个 MSI。缺少 WebView2 的电脑可由安装过程联网下载运行时，也可提前安装 WebView2。

Windows 打包固定使用 Rust 1.99.1，避免 Rust 1.100.0 与旧版 Windows 依赖组合时将同步函数错误链接到 `vertdll.dll`。升级编译器后需检查生成程序的 DLL 导入表。

## 内网更新

客户端启动时读取 `https://www.qiasieng.com/desktop-updates/latest.json`，发现新版后提示安装。已安装 `0.1.1` 的电脑需要手动覆盖安装 `0.1.2`，以后由客户端检查更新。

从 `0.1.5` 起，安装包会同时替换旧“洽思英语”和 `0.1.4`“单词速记”，清理旧桌面与开始菜单快捷方式，保留本机激活配置。Windows 构建会验证分别从两个版本升级及两个版本并存时的升级结果。`package.productName` 决定 MSI 的升级标识，不要直接改名；如需改名，必须先维护安装包升级关系并验证覆盖安装。

在本机给两个 MSI 生成 `.msi.zip` 和 `.msi.zip.sig`：

```bash
python3 scripts/sign-msi.py /path/to/msi-directory
```

签名使用本机 `keys/updater.key` 和 `keys/updater.password`。将私钥和密码分别安全备份，后续版本继续使用同一密钥。在服务器上传目录的 `desktop-updates/版本号/` 中放置 MSI 和对应的 ZIP。进入后台「系统管理 → 桌面端版本」，填入 MSI 相对路径及 `.sig` 文件内容，再发布版本。
