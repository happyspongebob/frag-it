# Git 操作指南（PowerShell + GitHub + Vercel）

> 本文整理本项目在 Windows PowerShell 环境下常用的 Git 操作流程（提交/推送/分支/PR/合并）以及与 Vercel 部署联动时的注意事项。

## 1. PowerShell 与命令分隔符
- **PowerShell 不支持** `&&` 作为语句分隔符。
- 推荐写法：
  - 分行执行（最稳）
  - 或使用 `;` 分隔（不会因为上一条失败而自动停止）

### 1.1 分行执行（推荐）
```powershell
git add .
git commit -m "<message>"
git push
```

### 1.2 单行执行（使用 `;`）
```powershell
git add .; git commit -m "<message>"; git push
```

### 1.3 单行执行（上一条成功才继续）
```powershell
git add .; if ($?) { git commit -m "<message>" }; if ($?) { git push }
```

## 2. 最常用：提交并推送
### 2.1 查看当前状态
```powershell
git status
```

### 2.2 添加、提交、推送
```powershell
git add .
git commit -m "feat: <summary>"
git push
```

### 2.3 第一次推送某个分支（设置 upstream）
如果 `git push` 提示没有 upstream：
```powershell
git push -u origin <branch>
```

## 3. 判断是否可以直接 `git push`
当你看到类似信息：
- `Your branch is ahead of 'origin/<branch>' by 1 commit.`
表示本地比远端多提交，**直接 `git push` 即可**。

辅助命令：
```powershell
git branch -vv
```

## 4. 分支命名不匹配内容：不改历史的安全方案（推荐）
场景：你把“新增功能”提交在了一个叫 `fix/xxx` 的分支上，但想用更合适的分支名。

### 4.1 基于当前提交创建新分支并推送
```powershell
git switch -c feat/history-calendar-export
git push -u origin feat/history-calendar-export
```

### 4.2 后续用新分支提 PR
在 GitHub：
- base：`main`
- compare：`feat/history-calendar-export`

> 这个方案不会改写历史，只是多了一个分支引用，最安全。

## 5. GitHub PR 与合并（Merge）
### 5.1 什么时候可以合并
满足以下条件一般就可以：
- checks 全部通过（All checks have passed）
- 没有冲突（No conflicts）
- Vercel 部署 Ready（如果你配置了 Vercel for GitHub）

### 5.2 合并方式选择
在 PR 的合并按钮旁边可以选：
- **Squash and merge**：推荐。把多个提交压成 1 个提交，`main` 更干净。
- **Create a merge commit**：保留完整分支提交历史。

## 6. Vercel 同步规则（Preview vs Production）
- **Preview**：通常由分支 push 或 PR 触发，对应分支/PR 的预览环境。
- **Production**：通常只在代码进入 `main`（合并 PR）后触发部署。

### 6.1 为什么你“看到 Vercel Ready 但生产没变”
可能原因：你看到的是 **分支 Preview**，而你访问的是 **Production 域名（main）**。

## 7. Vercel 刷新子路由 404（BrowserRouter 场景）
### 7.1 现象
- 站内点击跳转到 `/calendar` 正常
- 但在 `/calendar` 按 F5 刷新或直接访问 `https://<domain>/calendar` 出现 `404: NOT_FOUND`

### 7.2 解决方案（推荐）
在项目根目录新增 `vercel.json`，让 SPA 路由重写到 `/index.html`：
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

提交并推送：
```powershell
git add vercel.json
git commit -m "fix: add vercel SPA rewrite for browser router"
git push
```

### 7.3 验收
- 打开 `https://<domain>/calendar`
- F5 刷新
- 不应出现 404

## 8. 常见提示与处理
### 8.1 LF 将被替换为 CRLF 的 warning
示例：
- `LF will be replaced by CRLF the next time Git touches it`

说明：Windows 下常见换行符提示，**通常不影响提交与 push**。

### 8.2 没有可提交内容
如果 `git commit` 提示没有变更：
```powershell
git status
```

## 9. 删除远端分支（可选，谨慎）
确认分支不再需要且没有 PR 在用时：
```powershell
git push origin --delete <branch>
```

## 10. 一个推荐的“本次修复”提交模板
当你同时改了代码 + 文档（例如修复 Vercel 路由、修复历史记录误清空、防护与文档同步）时：
```powershell
git add vercel.json src/history.ts src/useHistory.ts 任务文档.md 进度文档.md 修复文档.md
git commit -m "fix: vercel SPA rewrite and prevent history wipe"
git push
```
