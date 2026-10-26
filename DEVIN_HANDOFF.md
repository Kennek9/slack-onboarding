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

这是给同事从 Lark 切换到 Slack、Google Workspace 的办公室宣讲页面，也包含 Typeless 和 Slackbot。设计要求是字少、成年人正常协作的语气、投屏可读。保留三段优先级、逐页讲解、目录、键盘翻页、刷新定位和投屏模式。

内层要像实际 Slack：从侧栏进频道或 DM，点文件卡片进入文档，回到原消息的右侧 Thread；Huddle 从当前频道开启，Calendar 从 Apps 进入。不要退回抽象的功能卡片，也不要做“点三步就学会了”的闯关教学。所有可见人物均使用部门/职责代称，示例覆盖不同部门；官方教程有中文就引用中文。

网站是本地交互演示，不连接真实 Slack/Google/Typeless 账号，不发送真实消息，不伪造 AI 回答。不要编造公司已经确定的频道、规则、套餐或业务结论。

本轮先启动网站、核对仓库与线上基线，简短说明你理解的结构和可运行状态，然后等我给具体修改要求。收到要求后，按本次范围实施并验证：文件→文档评论→回原 Thread、回复/同步、Huddle、目录与键盘、1920×1080 投屏和 1366×768 笔记本，以及受影响的手机布局。

改动用分支提交 PR，报告改了什么、实际验证了什么、还有什么没验证。未经我明确授权，不要合并 main。

发布由 GitHub Pages 承担：合并或推送 main 会触发 .github/workflows/pages.yml，先检查 JavaScript 语法，再只发布 dist。Actions 成功后，正式网站才会更新。PR 和其他分支不发布生产站，当前也没有 PR 预览。请把“合并 main”视为生产发布，不要仅凭推送成功报告已上线。

仓库已公开，继续使用部门/职责代称，不提交真实内部聊天、群聊/话题/文档的定位链接或 ID，也不把 API 密钥、访问令牌写入前端。所有交互保持本地演示。旧 Sites 网址是独立快照，不会自动更新；保留 .openai/hosting.json 的 project_id。
