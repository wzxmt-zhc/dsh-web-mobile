![dsh-web-mobile — 手机上也能好好用 DSH](assets/banner.png)

<p align="center">
  <strong>DSH Web UI 移动端适配：窄屏好用，宽屏适用</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT" /></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/topic-dsh--plugin-amber?style=flat-square" alt="dsh-plugin" /></a>
  <a href="https://awesome-dsh-plugin.com/p/mexiaosqwq/dsh-web-mobile/"><img src="https://awesome-dsh-plugin.com/badge.svg" alt="awesome · DSH plugin" /></a>
</p>

> 📦 **已内置于 [DSHA](https://github.com/qiannianhuanxiang/DSHA)** —— DeepSeek Harness 安卓启动器把本插件作为内置移动端适配，装 APK 开箱即用。感谢作者 [@qiannianhuanxiang](https://github.com/qiannianhuanxiang) 的集成与推广 🙏

---

**dsh-web-mobile** 是 DeepSeek Harness Web UI 的移动端适配插件——让 DSH 在手机竖屏下也能好好用：

- **侧栏变抽屉**：手机竖屏下侧栏收进 overlay 抽屉，会话区全宽，点会话行自动收起；屏幕左缘右滑呼出、抽屉内右滑收起
- **弹窗变浮层**：设置、文件树、预览改成底部 sheet，触屏好点
- **会话也能删**：会话行 ⋯ 菜单新增“删除会话”，把本地记录永久删除（使用过的会话也能删）
- **大响应自动压缩**：长会话历史等大 JSON 响应自动 gzip/brotli（17MB → ~1MB），手机加载更快更省流量
- **状态栏避让**：刘海安全区、深/浅主题、双击缩放都处理
- **输入区不打架**：权限胶囊、模型名、切换菜单在窄屏下不重叠
- **长会话不卡流量**：宿主返回的大 JSON（会话历史等）自动 gzip/brotli 压缩，手机端加载明显提速
- **平板也管**：768–1023px 触屏设备限宽居中；桌面端（鼠标指针）任何宽度都是完全 no-op，窄窗口/系统缩放也不会误启移动 UI
- **诊断方便**：`?mobile-nav-debug=1` 显示悬浮诊断条（视口 / 浮层状态 / JS 错误）

---

## 效果

| 会话主页 | 目录抽屉 | 设置界面 |
| --- | --- | --- |
| ![移动端会话主页](assets/hero.png) | ![目录抽屉](assets/drawer.png) | ![移动端设置界面](assets/settings.png) |

## 会话删除

DSH 本身只提供会话的**重命名 / 分叉 / 归档**，没有删除能力（`workspace.archiveSession` 只是隐藏行，记录还在）。本插件把删除并进了会话管理菜单：

- 目录抽屉里点会话行的 **⋯** 菜单，出现四项：**重命名 / 分叉会话 / 归档会话 / 删除会话**（红色，样式与其余各项一致）。
- 点 **删除会话** → 底部确认卡片（显示会话名，不可恢复提示）→ 确认后该会话的本地记录被永久删除，列表自动刷新；若删的是当前会话，会回到空状态并收起抽屉。
- 删除动作由插件的 node 半区提供：`POST /api/mobile-nav.session.delete` 移除 `$DSH_HOME/sessions` 下的会话日志（JSONL），并从所属工作区账目中摘除；会话查询索引会在下次对账时自行清理。
- **使用过的会话也能删**：host 会先以 `disposed` 取消该会话的 agent（`Agent.cancel` + `whenIdle`），冲刷持久化检查点（`SessionStore.flush`），再摘除活跃注册并删除日志——无需重启。仅当会话卡死无法停止时才提示稍后重试。

## 安装

> [DSHA](https://github.com/qiannianhuanxiang/DSHA) 用户无需单独安装：DSHA 已内置本插件，装 APK 即用。

从 npm 一行装：

```sh
dsh plugin --profile web add github:wzxmt-zhc/dsh-web-mobile
```

仓库自带构建产物，无 `allowBuilds` 拦截。装完重启 `dsh web`。

> 包名说明：2026-08-30 起 npm 包名由 `dsh-mobile-nav` 更名为 `dsh-web-mobile`（与 GitHub 仓库名统一，旧 npm 名已整包撤下）；更早的 `@dsh-external/dsh-mobile-nav` 亦不复存在。装过旧版的用户请**先移除再装新名**（patch 行 id 随包名一起换了，新旧并存会把同一插件注册两份）：
>
> ```sh
> dsh plugin --profile web rm dsh-mobile-nav      # 2.1.x 及更早的装法键名是 @dsh-external/dsh-mobile-nav，同样先 rm
> dsh plugin --profile web add dsh-web-mobile     # GitHub 直装：dsh plugin --profile web add github:mexiaosqwq/dsh-web-mobile
> ```
>
> 不迁移的后果分路线：npm 装法留下死依赖，profile 里后续任何插件安装/更新都会 404；GitHub 直装拉到新代码后，旧键名与包内新名失配，重启 `dsh web` 时该插件加载失败。两种路线都是 `rm` 旧键名即解。

本地开发：

```sh
dsh plugin --profile web add link:/path/to/dsh-web-mobile
```

## 更新内容

### v2.5.9

**新功能**

- **适配 dsh-file-viewer 插件，手机竖屏可用**：适配了 [dsh-file-viewer](https://github.com/liguobao/dsh-file-viewer) 插件（会话「文件查看器」标签页）。该插件未内置响应式 CSS，`min-width:0` 的 flex 面板在手机宽下横向溢出——路径被限额在 520px 挤着 5 键操作行、CSV/代码表头在内容滚动器里连成一列。现于移动分支下：面板自身不再横向滚动（横向滚动留给内容滚动器）、标题栏/状态栏压缩换行、触控目标放大到 34–44px、搜索/跳行/页码输入框字号提到 16px 规避 iOS 自动放大、`prefers-reduced-motion` 关闭动画
- **文件查看器手势豁免**：打开文件查看器时左缘横滑让位给 CSV 表格/代码行原生滚动，不再误触侧边栏抽屉手势（与任务面板/SSH 同档）

**优化**

- `test:core` 脚本补 `--experimental-strip-types`（Node v22 直接跑 `.ts` 测试所需）

### v2.5.8

**修复**

- **触屏下复制按钮 Tooltip 文字残留（“复制”字样不消失）**（2026-08-31）：DSH 消息操作栏的复制/反馈按钮由 Tooltip 包裹，标签文字（“复制/已复制”）以固定定位气泡 `.bubble` 在 hover/focus 时浮现。触屏 webview 点击后残留 sticky `:hover`/`:focus` 且无 `pointerleave`，气泡文字会一直挂在页面上。因按钮自身图标已翻转为对勾反馈，气泡文字在触屏上多余，现于 `@media (hover: none), (pointer: coarse)` 下隐藏消息操作栏内的 Tooltip 气泡，从根上消除此项与同类粘滞残留

### v2.5.7

**修复**

- **git 分支芯片在 DSH 0.1.2-alpha.1 下不再吸附进 composer 卡片**（2026-08-31）：`git-chip-reparent` 用 `querySelector('textarea')` 定位 composer 卡片，而 alpha.1 输入框已是 `<div contentEditable>`（`data-composer-input`），查不到 textarea 导致卡片为 null、芯片从不被挪进输入卡。现已改为 `[data-composer-input], textarea` 双代锚点
- **状态栏锚点排除与 debug 徽章同步适配 contentEditable**：`stats-line` 排除 composer 卡片输入区的守卫与 `?mobile-nav-debug=1` 徽章的 `composer` 状态均改为同时识别 `textarea` 与 `data-composer-input`

**其他**

- 与 v2.5.6 同套双代锚点，DSH v0.1.1-rc.2 与 v0.1.2-alpha.1 行为一致

### v2.5.6

**修复**

- **DSH 0.1.2-alpha.1 下 composer 底部工具栏错行**（2026-08-31）：官方在 0.1.2-alpha.1 把输入框从原生 `<textarea>` 重构为 Lexical 的 `<div contentEditable>`（`data-composer-input`），composer 卡片内不再存在 `<textarea>`，导致移动端全部 composer 布局规则（`layout.css.ts` 主战场、`misc.css.ts` hero 空态）依赖的 `:has(textarea)` 锚点整体静默失效，底部回退到官方桌面布局、窄屏下指令/权限与模型/用量/发送各自换行堆积。现已把 composer 卡片识别扩为 `:has(textarea, [data-composer-input])`（rc.2 与 alpha.1 两代 DOM 同时命中），并新增 alpha.1 的空态占位（`data-composer-placeholder`）单行塌缩规则，`flex-wrap: nowrap`、车道伸缩、固定按钮钉边与模型条右缘焊接全部恢复

**其他**

- 兼容 DSH v0.1.1-rc.2（原生 textarea）与 v0.1.2-alpha.1（contentEditable）两种 composer DOM，旧版行为不变

### v2.5.5

**修复**

- **桌面窄窗口不再激活移动 UI**（2026-08-30 PC 泄漏）：分屏窗口、未最大化窗口、系统显示缩放（如 1920 物理 @200% = 960 CSS px）此前都会掉进移动分支，整套移动 UI 泄漏到桌面（右上 Files 按钮、左上 toggle、底部 stats 行），点击 Files 还因桌面双击习惯触发开→关快速翻转「抽搐」。现在移动断点 = `(max-width: 1023px) AND (pointer: coarse)` 触屏守卫——带鼠标的窗口（含触屏笔电主指针 fine）在任意宽度都保持桌面布局，手机/平板/DSHA 照常
- misc.css 桌面隐藏块补齐漏列的 `preview-full-toggle`（10 个 `data-mobile-nav` 注入控件清单对账），并改为移动断点的精确补集，守不住补集的 slot 按钮不再在窄桌面露出

**其他**

- 按 awesome-dsh-plugin 新约定自声明截图（`screenshots.json`，3 张 assets 相对路径）
- 三个 CDP 探针补 `Emulation.setTouchEmulationEnabled`（headless 无 pointer 设备，移动分支需触摸模拟才激活）

### v2.5.4

**新功能**

- 侧边栏手势（#16，PR #37 by @wingsky-1）九轮重构：屏幕左侧 45% 区域右滑呼出侧边栏、内容区右滑收起（本轮改为提前/晚提交双架构——开：8px 轴锁定即 arm 并 inline 跟随；关：280ms 自播动画落地才翻宿主 marker，避免 React 异步换子树中途倒跳）

**优化**

- 流式输出时的每帧开销：状态栏 TPS 读出走锚点快路径（O(1) 判定）、市场已安装列表按帧合并且市场未打开时直接跳过，不再全树扫描
- 抽屉会话树屏外部分跳过渲染（`content-visibility: auto`），会话数多了以后抽屉依旧轻快

**修复**

- 手势打开侧边栏后点背板要点两次才关：消费标记误吞背板与悬浮按钮的点击，现已无条件放行；消费窗口 1000ms 收紧到 300ms 且每次新按下即清空门控
- 手势后短时间内真实点按（如点会话行）偶尔无响应
- 滑动开侧边栏偶尔没反应或开了又弹回：轴锁定标志前置，宿主捕获处理器先让位再写消费标记，杜绝抢跑与双翻抵消
- 真机（Android Chrome）贴左缘右滑呼出侧边栏会触发浏览器「返回上一页」：根元素 `overscroll-behavior-x: none` 抑制 Chrome 边缘历史导航手势
- 起指落在横向滚动容器（状态栏读出条、消息代码块）内时让位给原生滚动，不再误开侧边栏
- 系统开启「减弱动态效果」时侧边栏仍播放滑入滑出动画，现与设置面板一致直接禁用（prefers-reduced-motion）
- `?mobile-nav-debug=1` 诊断条在代码重组后没有接线，访问调试参数无任何显示：已重新接线
- 手机端点插件市场搜索框触发 iOS 强制放大且无法恢复：搜索框字号提到 16px（PR #35 by @BuvkB）
- 刘海屏上界面能被上滑抬起、输入框下方露白、最新消息被压住：frame 安全区 padding 改 `box-sizing: border-box`，恰好一屏不再撑高文档

**重构**

- 侧边栏手势的左缘识别区改为纯几何判定：按视口宽度 45% 现算（390px 手机约 176px），横竖屏与平板自动跟随，不再注入宿主 DOM 的隐形热区元素

**兼容**

- 适配 dsh 0.1.2-alpha.1：会话日志下载的 sessionId 类型改由实装宿主推导（0.1.1 为 string、0.1.2-alpha.1 为品牌类型），同一构建兼容两代宿主，不新增 peer 依赖；`dsh.client.inject` 元数据同步为两代宿主共有的包
- peer 依赖范围放宽到 0.1.2 预发布版（`@deepseek-ai/dsh-*` client-ui 系列），缺失的 UI peer 改为可选
- **npm 包名更名 `dsh-mobile-nav` → `dsh-web-mobile`**（与 GitHub 仓库名统一，旧 npm 名已整包撤下）；本仓库 GitHub 直装命令不变

### v2.5.3

**新功能**

- 侧边栏抽屉手势（#16，PR #37 by @wingsky-1）：屏幕左缘右滑呼出抽屉、抽屉内容区右滑收起（松手判定式，零 inline transform，动画交宿主 transition）

**修复**

- 手势打开抽屉后点背板「要点两次才关」：手势消费标记误吞背板与悬浮按钮的点击，现已无条件放行
- 手势后短时间内真实点按（如点会话行）偶尔无响应：手势消费窗口 1000ms 收紧到 300ms，且每次新按下即清空门控
- 滑动开抽屉偶尔没反应或开了又弹回：轴锁定标志前置，宿主捕获处理器先让位再写消费标记，杜绝抢跑与双翻抵消
- `?mobile-nav-debug=1` 诊断条在代码重组后没有接线，访问调试参数无任何显示：已重新接线
- 系统开启「减弱动态效果」时抽屉仍播放滑入滑出动画，现与设置面板一致直接禁用（prefers-reduced-motion）
- 手机端点插件市场搜索框触发 iOS 强制放大且无法恢复：搜索框字号提到 16px（PR #35 by @BuvkB）
- 刘海屏上界面能被上滑抬起、输入框下方露白、最新消息被压住：frame 安全区 padding 改 `box-sizing: border-box`，恰好一屏不再撑高文档

### v2.5.2

**修复**

- 手机上点抽屉里的历史会话「抽屉收起但对话不打开」的问题彻底修复：抽屉导航关闭改为**以导航事实为准**——触摸点选会话/搜索树行时先不关抽屉，改为观察 `aria-selected`，只有当另一行确实被选中（React 已完成会话切换）才收起；已选中行与其它导航目标保持 pointerup 直关。不再依赖浏览器是否合成 tap 的 click，iOS Safari / Opera iOS 等抑制兼容 click 的壳全部覆盖（上游 #32，取代此前的自愈式 click 补发方案）
- 子代理计数芯片在 onClick 代上游（`dsh-client-ui-subagent` 0.1.0-rc.6+，哈希 `h8S2Va_`）上的「点开一闪即退」竞态修复：一次 tap 不再触发两次开关切换

### v2.5.1

**修复**

- 顶部子代理 UI 弹出卡片点按不稳定，现可靠开合（触摸路径）
- 触摸点选会话后抽屉正常自动收起
- 输入区右侧模型条、上下文圈、发送键固定贴近右侧，不再漂移
- dsh-web-ui 设置页错误显示
- host 半区压缩模块的 ESM 导入改用 `.js` 扩展名（Node ESM 加载必需）

### v2.5.0

**新增**

- **大 JSON 响应自动压缩**：长会话的历史记录等大 JSON 响应在 host 端自动 gzip/brotli（客户端 `Accept-Encoding` 协商，brotli 优先、质量 6），实测 20MB JSON → ~230KB；≥4KB 的 JSON 才压缩，小 JSON 与其他类型（HTML/静态资源/ZIP/SSE 流）原样透传
- 压缩通过 host 半区对 `ServerResponse` 的透明包装实现，覆盖所有 `/api/*` 响应，浏览器 fetch 自动解压，无需客户端改动

### v2.4.0

**修复**

- 设置「模型分组」区在手机上卡片宽窄不一、首尾卡超出屏幕右缘（`_row` 复合族 `:not` 守卫）
- 子代理计数芯片手机端点击不稳定（上游 hover-only 缺陷），触摸路径修复
- 手机上打开插件市场后设置导航被隐藏、无路可退（dshmarket ≥1.20 反制）
- 市场 Tasks 弹卡贴边不居中；出现待更新按钮时标题行被压成逐词竖排
- 输入区发送、加号、上下文按钮窄屏下被挤压漂移，现固定尺寸钉位
- viewport meta 改写保留宿主 maximum-scale，页面缩放行为与官方一致
- 子代理计数与后台任务触发器共存时的计数不准确

**重构**

- 哈希类选择器全量改为子串匹配并补 `:not` 守卫，救活一批静默失效的规则（PR #27/#28 系列）

### v2.3.0

**变更**

- 优化插件 dsh-meme 移动端的表现
- Agent preset 模式选择菜单改为底部弹层，不再撑满竖屏
- 适配最新 dshmarket 移动端 UI（卡片画廊、已安装列表、标签头部）
- 完成 phase 2-4 代码重组（`components/`、`core/`、`i18n/` 目录迁移，effects 拆分），优化 !important 使用
- 修复移动端会话头部标题栏的布局异常，隐藏多余的路径分隔符

### v2.2.0

**变更**

- 删除会话移入会话行的 **⋯ 菜单**，与宿主菜单合并为四项：重命名 / 分叉会话 / 归档会话 / 删除会话（红色删除项，样式与其余各项一致）；移除抽屉底部的删除按钮
- **支持删除使用过的会话**：host 以 `disposed` 取消该会话的 agent（`Agent.cancel` + `whenIdle`）、冲刷持久化检查点（`SessionStore.flush`）后，摘除活跃注册并删除日志——无需重启
- 删除确认改为底部卡片，显示会话名与不可恢复提示

**修复**

- 修复删除后冷会话残留为「未分组」幽灵行（点击报 session-not-found）：删除后的列表刷新改为以方法形式调用，避免 `this` 丢失导致刷新静默失败
- 修复点击删除无反应：`ctx.workspaces` 未声明进 inject 列表导致 Cordis 抛异常
- 修复「无法确定要删除的会话」：宿主 ⋯ 按钮无 `aria-haspopup`，改按会话行内按钮捕获

### v2.1.0

**新增**

- 会话删除：抽屉底部“删除会话”（带二次确认），永久删除当前会话的本地记录并刷新列表；node 半区新增 `POST /api/mobile-nav.session.delete` 端点
- 删除动作在宽屏（≥1024px）完全隐藏，桌面无任何变化

**说明**

- 正在运行或本次启动后使用过的会话无法删除（host 无公开的 agent 拆除 API），会提示改用归档或重启后删除

### v2.0.0

**修复**

- iOS Safari 输入 `ask_user_question` 时不再自动放大
- 移动端会话头部稳定：文件按钮不跑出头部，模式徽标/按钮布局不乱
- 输入区在窄屏下一行排列，权限/模型下拉不被裁剪、不互相遮挡
- 点文件行打开预览不再被误判为关闭，预览能正常弹出
- `?mobile-nav-debug=1` 不再因自身写入触发页面冻结
- dshmarket 搜索框、已安装插件列表在移动端布局正常

**移除**

- 移除触觉反馈（HapticRow / haptic 设置项）

**兼容**

- 放宽 `@deepseek-ai/*` peer 依赖范围，支持 0.1.1 rc 版本

### v1.5.0

- 修复抽屉关闭回归：背板点击、Escape、导航点击收起、悬浮按钮恢复
- preview/explorer 互斥对称，预览浮层不再误开或残留
- dispose 还原完整，退出移动端布局后桌面无残留
- reconciler 重构：统一全树观察，减少无效刷新
- 新增 CDP 回归门禁 `smoke:cdp`

## 兼容插件

- [dsh-web-ui](https://www.npmjs.com/package/@linxin666/dsh-web-ui-all)——**0.1.20**
- [dshmarket](https://www.npmjs.com/package/dshmarket)——**v1.20.2**
- [dsh-usage-stats](https://github.com/Ychris12138/dsh-usage-stats)——**0.2.10**
- [dsh-genui](https://github.com/omdsh-dev/dsh-genui)——**0.9.1**
- [dsh-meme](https://github.com/mexiaosqwq/dsh-meme)——**v0.1.39**

## 构建

```sh
pnpm install
pnpm build
```

`lib/` 与源码同步入库，改动源码后重新构建再提交。

## License

[MIT](LICENSE)
