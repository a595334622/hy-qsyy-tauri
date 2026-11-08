import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  path.resolve(root, "../hy-qsyy-student"),
  path.resolve(root, "hy-qsyy-student")
];
const student = candidates.find(dir => existsSync(path.join(dir, "package.json")));
if (!student) {
  console.error("找不到学生端。本地应在上一级 hy-qsyy-student，GitHub 打包使用仓库里的 hy-qsyy-student。");
  process.exit(1);
}

execSync("pnpm install", { cwd: student, stdio: "inherit" });
execSync("pnpm build", { cwd: student, stdio: "inherit" });

const dist = path.join(root, "dist");
rmSync(dist, { recursive: true, force: true });
cpSync(path.join(student, "dist"), dist, { recursive: true });
