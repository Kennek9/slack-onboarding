# 可直接发送给 Devin 的交接 Prompt

你接手这个项目，后续我会和你一起迭代。

仓库：https://github.com/Kennek9/slack-onboarding
正式网站：https://kennek9.github.io/slack-onboarding/

仓库已做安全清理并重写历史。如果你已有本地副本，请重新克隆；从新的 main 开始，不要把清理前的旧分支合并回来。

先阅读 AGENTS.md、README.md 和 dist/index.html。源码是无依赖的静态网站，HTML/CSS/JS 都在 dist/index.html；不要一开始迁移框架或全面重写。

启动：
python3 -m http.server 4173 --bind 0.0.0.0 --directory dist

语法检查：
node scripts/check.mjs

这是给同事从 Lark 切换到 Slack、Google Workspace 的办公室宣讲页面。设计要求是字少、口语、投屏可读。

结构按使用链路分段：0 会前准备 → 1 日常沟通 → 2 日历与会议 → 3 文档与文件 → 附录。不要单独设置“停一下”页面，关键操作在对应内容页突出。每页一句标题、按需使用真实截图、最多 3 行短句、一个写明内容的中文教程链接。红框只标要点击或特别关注的位置，多个重点可分别标注。不要再做仿真 Slack 界面；Translate、Typeless 由讲师现场演示。页面内容在 dist/index.html 的 `slides` 数组，截图在 dist/assets。

网站不连接真实 Slack/Google/Typeless 账号。不要编造公司已经确定的频道、规则、套餐或业务结论。

本轮先启动网站、核对仓库与线上基线，简短说明你理解的结构和可运行状态，然后等我给具体修改要求。收到要求后，按本次范围实施并验证：截图和红框、目录与键盘、刷新定位、1920×1080 投屏和 1366×768 笔记本，以及受影响的手机布局。

改动用分支提交 PR，报告改了什么、实际验证了什么、还有什么没验证。未经我明确授权，不要合并 main。

发布由 GitHub Pages 承担：合并或推送 main 会触发 .github/workflows/pages.yml，先检查 JavaScript 语法，再只发布 dist。Actions 成功后，正式网站才会更新。PR 和其他分支不发布生产站，当前也没有 PR 预览。请把“合并 main”视为生产发布，不要仅凭推送成功报告已上线。

仓库已公开。截图可以用公司内部真实界面，但要裁掉工作区、频道、文档 ID 和定位链接；不写入群聊/话题/文档的定位链接，也不把 API 密钥、访问令牌写入前端。旧 Sites 网址是独立快照，不会自动更新；保留 .openai/hosting.json 的 project_id。
