# Alpha 数值验证产物

- `batch-45-groups.json`：3 类玩家 × 3 类队伍 × 5 种计划，共 45 组，每组 10,000 季。
- `long-career-100k.json`：从 18 岁开始的 12 季长期样本，共 100,000 条；初始队伍档位等量分配。
- 固定起始种子：`20260902`。

重新生成：

```powershell
node tests/alpha/generate-report.cjs
```

这些文件是验证当前 Alpha 公式的快照，不是正式版玩法配置，也不应作为正式游戏的平衡承诺。
