# 安防 AI · 指挥决策台（dist/agent/）

在驾驶舱的三维底座上叠加的"AI 预警 + 院长决策 + 危化品台账"一页式演示，三维部分直接复用 `dist/` 下的 `campus-model.js`、`landscape.js`、`floor-browser.js`、`floor-interior.js`、`parking.js`、`transitions.js`，不另起炉灶。

## 打开

- 本地：`npm run dev` 后访问 http://localhost:5174/agent/ 。
- 也可以直接双击 `dist/agent/index.html`（三维已打成单文件 `campus3d.bundle.js`，`file://` 下可用）。
- 按 1920×1080 设计，其他分辨率等比缩放；右上 ⛶ 全屏。

## 四个视图

| 视图 | 内容 | 直达 |
|---|---|---|
| 安保指挥 | AI 预警流（多源合判、证据、一键派单、误报回流）；三维院区 + 预警钉 + 保安位置 + 处置闭环时间轴；六大场景、车位、安保力量与布控 | `#sec` |
| 院长决策 | 风险指数与因子、AI 晨报决策建议（可采纳下发）、流感 ILI 曲线对照、外部信号流 | `#dec` |
| 危化品台账 | 四类汇总、采购→领用→开柜→盘点电子化覆盖、科室 × 品类台账、开柜事件与柜前录像绑定 | `#hz` |

三维交互与驾驶舱一致：拖拽旋转、滚轮缩放、点楼栋编号或楼体展开楼层、点楼层或层号隔离单层、底部感知图层开关、点设备点位出详情（摄像头带三维模拟画面并列出该楼栋关联预警）、「地下车库 B1」进入地库浏览，Esc 或「全院」退出。`#floor-b5` 直接展开 5 号楼，`#parking` 直接进地库。右上「▶ 演示：医闹处置闭环」在三维上跑一遍 Ⅰ 级布控 → Ⅱ 级升级 → 派单 → 到场 → 闭环。

## 结构

```
dist/agent/
  index.html           页面本体（样式令牌取自 theme.css，布局独立）
  campus3d.bundle.js   由 src/campus3d.js 打包（IIFE，全局 Campus3D），已提交
  src/campus3d.js      三维装配层：场景装配、相机飞行、HTML 锚点投影（预警钉 / 保安 / 楼栋标签 / 设备点位）、
                       楼栋高亮、图层开关、设备详情截图、楼层 / 地库模块接线、Esc 退出
```

改了 `src/campus3d.js` 或上游模块后运行 `npm run build:agent` 重新打包（需要 Node，`npx` 自动拉取 esbuild 0.24）。`npm run check` 会一并做语法检查。

对上游的唯一改动：`parking.js` 的 `createParkingInventory` / `createParkingBrowser` 增加可选的 `occupancy(slot, index)` 参数，默认行为不变（386/700）；决策台用它把地库演示占用对齐到页面口径（普通区 482/500、机械下层 90/100、机械上层 20/100）。

## 数据边界

院区启用时间、流感季趋势来自公开报道；其余预警、台账、车位、人员、建议全部是演示值，非实时业务数据。三维模型沿用驾驶舱的参考图比例重建，非测绘 BIM；楼栋功能为示意，预警钉坐标在 `index.html` 的 `BLD` 表。
