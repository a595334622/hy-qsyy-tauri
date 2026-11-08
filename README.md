# 洽思英语客户端

窗口里打开学生端，并向页面提供本机唯一编码。授权判断在学生端。

```bash
cd hy-qsyy-student && pnpm dev
cd hy-qsyy-tauri && pnpm install && pnpm dev
```

学生端开发地址是 `http://127.0.0.1:5174`。浏览器里直接开这个地址会提示非法访问。

## Windows 安装包

Mac 上打不出 Windows 包。推到 GitHub 后，在 Actions 里运行 **Build Windows**，或推送 `v*` 标签。装好的 MSI 和 NSIS 在 Artifacts 里下载。
