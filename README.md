# Glorify · Slack 协作宣讲

面向从 Lark 切换到 Slack、Google Workspace 的同事。用于办公室投屏，也支持会后自助查看。

- 线上演示：https://glorify-workspace-onboarding.gezicheng1999.chatgpt.site
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

## GitHub 与 Sites 的发布关系

**GitHub 更新目前不会自动更新现有 Sites 网址。** 本仓库没有 GitHub Actions 部署流水线，也没有绑定外部自动部署平台。

当前流程是：修改代码 → 验证 → 提交 GitHub → 在有 Sites 权限的环境中同步源码、保存版本并发布 → 核对线上结果。`.openai/hosting.json` 仅保留现有站点身份，不会触发自动上线。

如以后配置 Vercel 等 Git 自动部署平台，再单独更新发布说明。配置完成前，不要把“代码已推送”表述为“网页已更新”。

## 来源

官方中文教程链接保留在页面的“中文资料”中。Slack UI 参考官方产品演示 https://slackdemo.com/，本站并非 Slack 官方产品。

部分图标来自 lucide-static 0.468.0，许可证已保留在 HTML 源码中。不要移除。
