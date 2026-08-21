# OWL 选手之路：运行时架构

更新时间：2026-08-21

## 1. 范围与现状

这是一个按固定 `<script>` 顺序加载的单页游戏。`dev-public/dev/index.html` 负责装配核心 bundle、历史年份 patch 和 Alpha1 patch；它不是模块打包器，因此脚本之间通过全局函数、`seasonState`、`careerState` 和少量 `window.__OWL_*` API 协作。基础 bundle 加载完成后，`094-shared.runtime.js` 先于历史 patch 加载，后续 patch 都可以直接复用它。

本次重构的目标是收敛跨年份重复的流程控制，不改变年份规则、比赛数值、阶段赛结算或 UI 文案。年份差异仍由各自 Adapter 保留。

## 2. 模块边界

| 层 | 主要实现 | 责任 | 不应负责 |
| --- | --- | --- | --- |
| Core | `src/bundle/systems/regular_season.js`、`season_events.js` | 单场/快速模拟、事件内容、基础渲染 | 判断某个历史年份的赛制 |
| Era Adapter | `src/patches/049-inline.js`、`053-inline.js`、`054-inline.js`、`065-inline.js`、`091-inline.js`、`src/bundle/systems/v71_owl2_competitive_layer.js`、`v74_dynamic_hero_mastery.js` | 年份规则、阶段节点、地图池、队伍与赛事差异 | 自己重新实现公共暂停/恢复协议 |
| Shared Runtime | `src/modules/094-shared.runtime.js` | 渲染 hook、版本元信息、模拟生命周期、事件恢复 | 比赛胜负、阶段资格、奖项数值 |
| Feature Patch | `src/patches/090-inline.js`、`091-inline.js`、`092-inline.js`、`094-inline.js` | 单一 UI 修正或功能后处理 | 复制一套 `renderX` 包装生命周期 |
| Persistence / Modal | `src/patches/044-inline.js`、`094-inline.js` | 存档主档/可重建副本、恢复降级、游戏内确认框 | 直接调用浏览器原生 `alert / confirm / prompt` |

### Shared Runtime 接口

`window.__OWL_RUNTIME` 是唯一公共入口：

```js
window.__OWL_RUNTIME.render.register(name, key, hook)
window.__OWL_RUNTIME.render.syncReleaseMeta()

window.__OWL_RUNTIME.simulation.pauseWhole()
window.__OWL_RUNTIME.simulation.stopWhole(message)
window.__OWL_RUNTIME.simulation.resumeWhole(delay)
window.__OWL_RUNTIME.simulation.pauseFast()
window.__OWL_RUNTIME.simulation.resumeAfterEvent(options)
window.__OWL_RUNTIME.simulation.clearTimer()
```

`render.register` 对同一个渲染函数只安装一个 wrapper，再通过 keyed hook 运行多个后处理。`key` 用来保证重复加载或重复注册不会产生重复副作用。当前已迁移的历史后处理包括 RC18 的英雄专项/整季按钮文案、RC10/RC11 的页面文案清理、RC12 的 Stage 结算提示、RC22 的报价/术语/赛事卡片后处理，以及 Alpha1 的报价标签位置修正。

### Alpha1 Batch 3 的公共约束

- OWL2（2024–2026）常规赛完成后的榜单以 `syntheticFinalStandings()` 为最终来源；进行中的榜单使用 `v741LiveStandings()`。两者都必须返回 `wins`、`losses` 和 `lp`，赛季页、联盟榜单和季后赛资格不能各自重新推算 LP。
- 整季模拟在 Stage 2 结算后若存在 `v71AllStarPending`，必须先暂停并交给既有全明星 runtime；玩家处理全明星后再通过公共恢复协议继续，不能在批处理器内直接清掉 pending 标记。
- 年度奖项页和赛季总结页的“进入季后赛”都允许从旧存档重建 `playoffState`，恢复入口集中在 `095-inline.js` 的 `openRecoveredPlayoffs()`，不在两个按钮上复制初始化逻辑。
- 2027+ 的 `v34PostseasonTeams` / `v34Postseason` 是赛季级缓存，只有缓存年份等于当前 `seasonYear` 才能复用；旧档跨年恢复时必须重新计算，不能只用“缓存有 8 队”判断有效。
- 世界杯 2026+ 的晋级路线由 `vwcRoute()` 统一决定：上届冠亚军直通小组赛，其他国家按 2026 的邀请赛 / Conference Cup / 突破路线分流；跨届结果持久化在 `worldChampion` 和 `worldRunnerUp`，旧存档缺字段时由迁移逻辑补齐。
- MVP 连续获奖的衰减记录在 `seasonState.awards.mvpFatigue`，由年度奖项生成阶段一次性应用；庆祝动效只在奖项页首次打开时触发，不参与数值结算。

## 3. 渲染协议

功能 patch 只提供后处理函数，由 Shared Runtime 注册：

```js
window.__OWL_RUNTIME.render.register(
  'renderSeason',
  'b2-season-copy',
  owl92UpdateSeasonCopy
);
```

渲染 hook 必须满足：

1. 只读取当前 DOM / 状态并做幂等修正。
2. 不替换基础 renderer 的返回值。
3. 不在 hook 内启动新的模拟循环。
4. 如果功能属于某个年份，只在该 hook 自己内部判断年份。

版本元信息由 `syncReleaseMeta` 统一写入页面标题、封面版本、设置页版本和公开 API 元数据。旧 RC patch 中保留的 `syncVersion` 仅作为兼容 Adapter，函数体只委托给 Shared Runtime；历史 patch 不再自己写标题或版本字段。需要 RC29 更新日志入口的 patch 只保留自己的入口装饰，不再重复同步公共版本。

## 4. 模拟生命周期协议

### Whole simulation

历史年份仍各自选择比赛 Adapter（例如 `v32SilentRegularGame`、`b2FastRegularGame` 或未来赛制实现），但公共状态转换必须遵循：

```text
start Adapter
  -> active whole flag = true
  -> seasonState.simulating = true
  -> play one/batch of regular matches
  -> encounter trade / World Cup / season event / stage break
  -> simulation.pauseWhole()
  -> set the appropriate resume intent
  -> user resolves the node
  -> simulation.resumeWhole(delay)
  -> current v35SimulateWholeSeason dispatcher selects the era Adapter
```

`pauseWhole()` 会清理所有历史 whole flag、`seasonState.simulating`、计时器和快速批处理标记。这样交易弹窗不会留下旧的 `b2WholeActive` / `v34WholeActive`，导致恢复入口被自己的 guard 拦截。

`stopWhole(message)` 是终止而非暂停：它清除生命周期状态、刷新提示并重新渲染赛季页。

### Persistence fallback

`044-inline.js` 以槽位主档为权威数据，备份和紧急恢复点都是可重建副本。写入遇到 `QuotaExceededError` 时，先清理所有槽位的备份/恢复点，再重试主档；主档成功后，即使恢复点因剩余空间不足而跳过，也不能把这次保存标记为失败。导出 JSON 是存储紧张时的显式兜底路径。确认类交互统一通过 `window.__OWL_CONFIRM` 转发到游戏内 modal，业务模块不再直接依赖浏览器原生对话框。

存档的持久化边界由 `compactSavePayload()` 统一收口，当前格式标记为 `saveFormat: compact-v1`：

- `stageTables`、各年份最终榜单缓存和 `v34StageTables` 是由当前赛季状态可重建的缓存，不进入新存档。
- 队伍对象在存档中只保留 `short` 短代号；恢复阶段由 `resolveTeam()` / `reviveRefs()` 重新绑定到当前运行时队伍对象，避免重复写入 logo、颜色和展示元数据。
- `fantasyWorld`、英雄熟练度、队友关系、赛季历史和季后赛资格结果仍然保留；它们影响后续模拟，不能按缓存处理。
- `migrateSave()` 对旧的完整 JSON 先做同一套压缩，因此旧档可以直接导入；加载后 `restore-clean` 会把本地槽位升级为紧凑格式。导出仍是明文 JSON，但使用紧凑序列化，不依赖 gzip 或私有二进制格式。

开发版 `dev-public/dev/src/patches/044-inline.js` 的 `SLOT_COUNT=10` 仅用于 QA 门禁，方便并行构造多年份、多状态档案；生产构建不得继承该开发版配置。存档 UI、槽位选择、清理、导入导出和恢复扫描都必须复用同一个 `SLOT_COUNT`，禁止再出现局部硬编码槽位数量。

### Fast simulation

普通快速模拟只使用 `resumeFastAfterEvent`：

```text
fastSeasonStep
  -> simulation.pauseFast()
  -> openScheduledSeasonEvent()
  -> closeSeasonEvent()
  -> simulation.resumeAfterEvent()
  -> fastSeasonStep
```

`resumeAfterEvent()` 优先处理 `resumeWholeAfterEvent`，否则处理 `resumeFastAfterEvent`。因此同一个事件弹窗可以服务普通快速模拟和整季模拟，不再由多个关闭包装器分别重启。

## 5. 状态所有权

| 状态 | 写入方 | 读取/协作者 |
| --- | --- | --- |
| `seasonState.simulating` | Shared Runtime 与当前 Era Adapter | 所有赛季 UI 和模拟 guard |
| `v13WholeSimActive`、`v17WholeActive`、`v18WholeActive`、`b2WholeActive`、`v34WholeActive` | 对应 Adapter；跨 Adapter 暂停由 Shared Runtime 清理 | `simulation.pauseWhole()`、恢复 guard |
| `seasonState.resumeFastAfterEvent` | `simulation.pauseFast()` | `simulation.resumeAfterEvent()` |
| `seasonState.resumeWholeAfterEvent` | Era Adapter 在节点处暂停时设置 | `simulation.resumeAfterEvent()` |
| `seasonState.timer` | Shared Runtime 清理；当前快速模拟器设置下一次 tick | `simulation.clearTimer()` |
| `careerState.v800Trade.pending` | 交易 Feature Patch | Era Adapter 判断是否暂停 |

不允许新增第二套“暂停后自动恢复”布尔协议。若新增赛事节点，应该复用 `resumeWholeAfterEvent` 或增加明确的 Shared Runtime resume intent，而不是直接 `setTimeout(v35SimulateWholeSeason, ...)`。

## 6. 迁移与维护规则

- 新的渲染修正使用 `render.register`，不再写 `const base=renderX; renderX=function...`。
- 新的整季模拟只实现“本年份如何推进一场”和“本年份遇到什么节点”；暂停、终止、恢复统一调用 Shared Runtime。
- 新的事件类型复用 `season_events.js` 的弹窗生命周期；关闭弹窗只负责清理 UI，继续模拟交给 `resumeAfterEvent`。
- 不把 Shared Runtime 变成数值规则仓库。它的深度应保持小：只管理生命周期和跨模块协议。
- 存档写入不得让备份副本阻塞主档；新增持久化字段时必须考虑完整快照在浏览器 quota 下的降级行为，并保持导出 JSON 可用。
- 需要确认的业务动作统一走 `window.__OWL_CONFIRM` / `__OWL_V16_MODAL`，不得新增原生 `alert / confirm / prompt`。
- PC 端以 CSS Viewport 适配；低高度紧凑窗口的首页压缩规则只调整封面间距，不改变核心流程状态。PC P0 / P1 的核心内容区保持有限最大宽度，超宽屏额外空间交给背景与留白。
- 历史 patch 中只做公共版本同步的 wrapper 已删除；可证明幂等的渲染后处理已逐步迁移到 `render.register`，包含前置状态改写、年份流程判断或事件副作用的 wrapper 继续保留。以后新增公共渲染修正使用 `render.register`，若迁移旧 wrapper，必须先证明它不包含年份功能或流程副作用，再用 `node --check`、静态 hook 计数和线上 dev 回归验证。

## 7. 验证清单

每次修改公共 runtime 后至少验证：

1. 所有改动 JavaScript 通过 `node --check`。
2. `git diff --check` 无新增空白错误。
3. Shared Runtime 行为测试覆盖：标题稳定、whole 暂停清 flag、whole 恢复、普通事件恢复、render hook 只包装一次。
4. 线上 dev 页面检查：继续生涯、模拟全部常规赛、事件处理后继续、交易处理后继续，且浏览器页签标题不闪回旧 RC 版本。
5. 存档写入遇到 quota 时，验证主档仍可保存、重新读档和导出；确认界面只使用游戏内 modal。
6. 开发版存档管理器必须渲染 `SLOT 1`～`SLOT 10`；生产构建必须保持生产槽位策略，不得把开发版 10 槽配置带入。
7. 手机 P0 视口（360～430 宽）与平板 P1 视口必须无横向溢出；弹窗关闭按钮的可操作区域不得因 flex 压缩低于 40×40。
8. PC P0（1280×720～1920×1080）与 P1（2560×1440、3440×1440）必须检查首页高度、核心区最大宽度、弹窗边界和超宽屏拉伸；低高度窗口的主要操作不能被推出视口。
9. 存档压缩回归必须确认：旧完整 JSON 可导入、`saveFormat` 为 `compact-v1`、可重建榜单缓存不落盘、队伍短代号可恢复为运行时对象，且导出仍为可读 JSON。
