# Glorify · Slack 协作宣讲

面向从 Lark 切换到 Slack、Google Workspace 的同事。用于办公室投屏，也支持会后自助查看。

- 正式网站：https://kennek9.github.io/slack-onboarding/
- Sites 旧版（独立维护）：https://glorify-workspace-onboarding.gezicheng1999.chatgpt.site
- 本仓库：https://github.com/Kennek9/slack-onboarding
- Devin 交接：[DEVIN_HANDOFF.md](DEVIN_HANDOFF.md)
- 修改约束：[AGENTS.md](AGENTS.md)

## 运行

无需安装前端依赖，无构建步骤。使用 Python 3：

```sh
python3 -m http.server 4173 --bind 0.0.0.0 --directory dist
```

打开 `http://localhost:4173/`。`dist/index.html` 也可直接在浏览器打开。

检查内嵌 JavaScript 语法，需要 Node.js 18 或更新版本：

```sh
node scripts/check.mjs
```

语法检查不代替浏览器交互验证。

## 文件

- `dist/index.html`：网站完整源码，HTML、CSS、JavaScript 均在此文件。页面内容在脚本里的 `slides` 数组，一页一项。
- `dist/assets/`：页面用的真实截图（已裁掉工作区、频道和文档 ID）。
- `.github/workflows/pages.yml`：检查 JavaScript 语法，并将 `dist` 自动发布到 GitHub Pages。
- `dist/skills/lark-to-gdrive/SKILL.md`：团队迁移 Skill 的公开版，可在“文档共享”页或“中文资料”页点“搬飞书旧文档”查看用法并下载。网页不执行迁移；原始文件保持不变，公开版去掉内部环境信息，并要求本人授权、先试迁、删除与覆盖另行确认。
- `.openai/hosting.json`：现有 Sites 项目标识和静态目录；不是凭据。
- `scripts/check.mjs`：离线 JavaScript 语法检查。

当前没有后端、数据库或运行时外部依赖。网页只展示截图和说明，不连接真实 Slack、Google 或 Typeless 账号。

## 内容与操作

按现场使用链路分段，关键操作在对应页面突出：

0. **会前准备**：安装并登录 Slack，检查常用应用。
1. **日常沟通**：频道、私信、公开与私密、提醒、Huddle、翻译和语音输入。
2. **日历与会议**：打开 Google 日历，设置时区和工作时间，再讲忙闲、建会、提醒、录制和 Tada Meet 试用。
3. **文档与文件**：Google 文档权限、Slack 中的 Drive 通知，最后按需迁移飞书文档。
4. **附录**：和飞书的差异、中文资料。

每页：一句标题、一张真实截图（对比页两张）、最多 3 行短句、一个写明内容的中文教程链接。红框每张图最多 1 个，只标要点击或特别关注的位置。缺截图的页面显示“待补截图”。

- 左右方向键、PageUp/PageDown 或底部按钮翻页；空格下一页；Home/End 跳到首尾。
- 目录按段落列出所有页面；URL fragment 保留当前页，刷新后停在原页。
- 旧网址的主题名（如 `#translate`、`#calendar`）会跳到对应的新页面。
- “中文资料”跳到附录的资料页。点击截图可放大；Esc 关闭截图或退出投屏模式。投屏模式隐藏辅助按钮。

## 验证重点

修改相关功能后，在真实浏览器验证：

1. 每页截图清楚，红框对准目标。
2. 目录跳转、键盘翻页、刷新定位、旧网址跳转、投屏模式和 Esc。
3. “搬飞书旧文档”弹窗可打开、复制指令。
4. 1920×1080 投屏和 1366×768 笔记本一屏放下；390×844 手机、768×1024 平板无横向溢出。

## 发布到 GitHub Pages

本仓库已公开，正式网站由 GitHub Pages 托管。`main` 是生产分支。

修改流程：Devin 在分支修改 → 验证并提交 PR → 经用户授权合并 `main` → GitHub Actions 自动检查并发布 → 刷新正式网站查看。

每次推送到 `main` 都会触发 [Deploy GitHub Pages](https://github.com/Kennek9/slack-onboarding/actions/workflows/pages.yml)。只有工作流成功，才表示网页已经更新。失败时查看该次运行日志，线上保留上次成功版本。

工作流只发布 `dist`；PR 和其他分支不会发布生产站，当前没有配置 PR 预览。需要重新发布时，可在 Actions 中选择 `main` 手动运行同一工作流。

现有 Sites 旧站独立维护，不会随 `main` 自动更新。`.openai/hosting.json` 仅保留旧站身份，不触发 GitHub Pages 发布。

## 来源

官方中文教程链接保留在附录的“中文资料”页。本站并非 Slack 官方产品。

部分图标来自 lucide-static 0.468.0，许可证已保留在 HTML 源码中。不要移除。
