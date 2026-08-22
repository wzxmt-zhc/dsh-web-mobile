![dsh-web-mobile — 手机上也能好好用 DSH](assets/banner.png)

<p align="center">
  <strong>DSH Web UI 移动端适配：窄屏好用，宽屏适用</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT" /></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/topic-dsh--plugin-amber?style=flat-square" alt="dsh-plugin" /></a>
  <a href="https://awesome-dsh-plugin.com/p/mexiaosqwq/dsh-web-mobile/"><img src="https://awesome-dsh-plugin.com/badge.svg" alt="awesome · DSH plugin" /></a>
</p>

---

**dsh-web-mobile** 是 DeepSeek Harness Web UI 的移动端适配插件——让 DSH 在手机竖屏下也能好好用：

- **侧栏变抽屉**：手机竖屏下侧栏收进 overlay 抽屉，会话区全宽，点会话行自动收起
- **弹窗变浮层**：设置、文件树、预览改成底部 sheet，触屏好点
- **会话也能删**：会话行 ⋯ 菜单新增“删除会话”，把本地记录永久删除（使用过的会话也能删）
- **状态栏避让**：刘海安全区、深/浅主题、双击缩放都处理
- **输入区不打架**：权限胶囊、模型名、切换菜单在窄屏下不重叠
- **平板也管**：768–1023px 限宽居中；桌面 ≥1024px 完全 no-op
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

从 GitHub 一行装：

```sh
dsh plugin --profile web add github:wzxmt-zhc/dsh-web-mobile
```

仓库自带构建产物，无 `allowBuilds` 拦截。装完重启 `dsh web`。

本地开发：

```sh
dsh plugin --profile web add link:/path/to/dsh-web-mobile
```

## 更新内容

### v2.3.0

**变更**

- 优化插件 dsh-meme 移动端的表现
- Agent preset 模式选择菜单改为底部弹层，不再撑满竖屏
- 修复后台任务触发器存在时，正在运行的子代理计数不准确的问题
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

- [dsh-web-ui](https://www.npmjs.com/package/@linxin666/dsh-web-ui-all)——**0.1.14**
- [dshmarket](https://www.npmjs.com/package/dshmarket)——**v1.17.1**
- [dsh-usage-stats](https://github.com/Ychris12138/dsh-usage-stats)——**0.1.2**
- [dsh-genui](https://github.com/omdsh-dev/dsh-genui)——**0.8.3**
- [dsh-meme](https://github.com/mexiaosqwq/dsh-meme)——**v0.1.39**

## 构建

```sh
pnpm install
pnpm build
```

`lib/` 与源码同步入库，改动源码后重新构建再提交。

## License

[MIT](LICENSE)
