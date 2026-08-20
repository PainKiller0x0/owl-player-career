# OWL Playwright E2E 接入说明

这套文件用于给 `dev` 分支增加第一批浏览器自动化门禁。

## 当前自动覆盖

1. 2019 新档：建角 → Roll → 揭晓 → 选队 → 赛季，年份必须保持 2019。
2. 2023 新档：同样完整链路，防止年份跳回 2019。
3. “模拟全部常规赛”一次点击必须连续推进至少 3 场，专门卡“每次只走 1 场”的历史回归。
4. 手动保存 → 页面刷新 → 槽位 1 读档，必须恢复到赛季。
5. 2023 连续推进到 2024 / 2025 / 2026，每年都必须是 3 Stage，禁止 Stage 4 复活。
6. 390×844：无横向溢出、存档管理器 10 槽齐全、关闭按钮至少 40×40。
7. 1280×720：首页主要开始按钮在首屏可见且无横向溢出。
8. 所有测试同时监听未捕获 JavaScript 异常与浏览器原生 dialog；出现即失败。

## CI

`.github/workflows/e2e.yml` 在以下情况运行：

- push 到 `dev`
- PR 指向 `dev`
- 手动 `workflow_dispatch`

失败时会上传 Playwright HTML report、trace、失败截图和保留的视频。

## 本地运行

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

本地服务器由 `tests/e2e/server.cjs` 自己启动；Playwright 产物和依赖目录已加入 `.gitignore`。
