# OWL 选手之路：运行时架构

更新时间：2026-08-20

## 1. 范围与现状

这是一个按固定 `<script>` 顺序加载的单页游戏。`dev-public/dev/index.html` 负责装配核心 bundle、历史年份 patch 和 Alpha1 patch；它不是模块打包器，因此脚本之间通过全局函数、`seasonState`、`careerState` 和少量 `window.__OWL_*` API 协作。

本次重构的目标是收敛跨年份重复的流程控制，不改变年份规则、比赛数值、阶段赛结算或 UI 文案。年份差异仍由各自 Adapter 保留。

## 2. 模块边界

| 层 | 主要实现 | 责任 | 不应负责 |
| --- | --- | --- | --- |
| Core | `src/bundle/systems/regular_season.js`、`season_events.js` | 单场/快速模拟、事件内容、基础渲染 | 判断某个历史年份的赛制 |
| Era Adapter | `src/patches/049-inline.js`、`053-inline.js`、`054-inline.js`、`065-inline.js`、`091-inline.js`、`src/bundle/systems/v71_owl2_competitive_layer.js`、`v74_dynamic_hero_mastery.js` | 年份规则、阶段节点、地图池、队伍与赛事差异 | 自己重新实现公共暂停/恢复协议 |
| Shared Runtime | `src/modules/094-shared.runtime.js` | 渲染 hook、版本元信息、模拟生命周期、事件恢复 | 比赛胜负、阶段资格、奖项数值 |
| Feature Patch | `src/patches/090-inline.js`、`091-inline.js`、`092-inline.js`、`094-inline.js` | 单一 UI 修正或功能后处理 | 复制一套 `renderX` 包装生命周期 |

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

`render.register` 对同一个渲染函数只安装一个 wrapper，再通过 keyed hook 运行多个后处理。`key` 用来保证重复加载或重复注册不会产生重复副作用。

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

版本元信息由 `syncReleaseMeta` 统一写入页面标题、封面版本、设置页版本和公开 API 元数据。旧 RC patch 中保留的 `syncVersion` 仅作为历史兼容实现；页面装配完成后由 Shared Runtime 接管最终可见值。

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
- 历史 patch 的旧 wrapper 暂不大规模删除，除非能证明它只做公共生命周期而不包含年份功能。后续迁移应一次只移除一个 wrapper，并用 `node --check`、静态 hook 计数和线上 dev 回归验证。

## 7. 验证清单

每次修改公共 runtime 后至少验证：

1. 所有改动 JavaScript 通过 `node --check`。
2. `git diff --check` 无新增空白错误。
3. Shared Runtime 行为测试覆盖：标题稳定、whole 暂停清 flag、whole 恢复、普通事件恢复、render hook 只包装一次。
4. 线上 dev 页面检查：继续生涯、模拟全部常规赛、事件处理后继续、交易处理后继续，且浏览器页签标题不闪回旧 RC 版本。

