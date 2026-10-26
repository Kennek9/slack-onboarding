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

- `dist/index.html`：网站完整源码，HTML、CSS、JavaScript 均在此文件。
- `.github/workflows/pages.yml`：检查 JavaScript 语法，并将 `dist` 自动发布到 GitHub Pages。
- `dist/skills/lark-to-gdrive/SKILL.md`：团队迁移 Skill 的公开版，可在“文档分工 → 搬旧文档”或“中文资料”查看用法并下载。网页不执行迁移；原始文件保持不变，公开版去掉内部环境信息，并要求本人授权、先试迁、删除与覆盖另行确认。
- `.openai/hosting.json`：现有 Sites 项目标识和静态目录；不是凭据。
- `scripts/check.mjs`：离线 JavaScript 语法检查。

当前没有后端、数据库或运行时外部依赖。工作区、消息、评论、Huddle 均为交互演示，不会发送真实 Slack 消息，也不会调用真实 Google、Typeless 或音视频设备。示例依据不同部门的飞书协作改写，所有可见人物均为部门或职责代称。

## 内容与操作

12 个主题按优先级分为沟通规则、日常协作、提效工具。包含频道与 DM、Thread、提及与邀请、可见范围、提醒与待办、文档与共享、Huddle、Calendar、搜索、Typeless、Slackbot。

- 左右方向键或底部按钮翻页；输入框内不抢占方向键。
- 空格在普通页面或下一页按钮上可翻页。
- 目录可直达主题，URL fragment 保留当前主题。
- 投屏模式隐藏辅助操作，Esc 退出。
- 文档卡片 → 文档评论 → 返回原频道 → 右侧 Thread。

## 验证重点

修改相关功能后，在真实浏览器验证：

1. 频道、DM、Apps 侧栏导航与目录顺序。
2. 文件卡片、文档评论、返回 Slack、右侧 Thread 及关闭。
3. 回复草稿、发送、勾选同步频道后仅同步新回复。
4. Huddle 留在当前频道，镜头和共享仅作本地示意。
5. Calendar 接入说明、中文官方链接、共享权限角色。
6. 目录、资料弹窗、键盘翻页、刷新定位与投屏退出。
7. 1920×1080 投屏和 1366×768 笔记本可用；390×844 手机、768×1024 平板无横向溢出。

## 发布到 GitHub Pages

本仓库已公开，正式网站由 GitHub Pages 托管。`main` 是生产分支。

修改流程：Devin 在分支修改 → 验证并提交 PR → 经用户授权合并 `main` → GitHub Actions 自动检查并发布 → 刷新正式网站查看。

每次推送到 `main` 都会触发 [Deploy GitHub Pages](https://github.com/Kennek9/slack-onboarding/actions/workflows/pages.yml)。只有工作流成功，才表示网页已经更新。失败时查看该次运行日志，线上保留上次成功版本。

工作流只发布 `dist`；PR 和其他分支不会发布生产站，当前没有配置 PR 预览。需要重新发布时，可在 Actions 中选择 `main` 手动运行同一工作流。

现有 Sites 旧站独立维护，不会随 `main` 自动更新。`.openai/hosting.json` 仅保留旧站身份，不触发 GitHub Pages 发布。

## 来源

官方中文教程链接保留在页面的“中文资料”中。Slack UI 参考官方产品演示 https://slackdemo.com/，本站并非 Slack 官方产品。

部分图标来自 lucide-static 0.468.0，许可证已保留在 HTML 源码中。不要移除。
