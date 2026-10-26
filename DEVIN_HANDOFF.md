# 可直接发送给 Devin 的交接 Prompt

你接手这个项目，后续我会和你一起迭代。

仓库：https://github.com/Kennek9/slack-onboarding
当前线上版：https://glorify-workspace-onboarding.gezicheng1999.chatgpt.site

先阅读 AGENTS.md、README.md 和 dist/index.html。源码是无依赖的静态网站，HTML/CSS/JS 都在 dist/index.html；不要一开始迁移框架或全面重写。

启动：
python3 -m http.server 4173 --bind 0.0.0.0 --directory dist

语法检查：
node scripts/check.mjs

这是给同事从 Lark 切换到 Slack、Google Workspace 的办公室宣讲页面，也包含 Typeless 和 Slackbot。设计要求是字少、成年人正常协作的语气、投屏可读。保留三段优先级、逐页讲解、目录、键盘翻页、刷新定位和投屏模式。

内层要像实际 Slack：从侧栏进频道或 DM，点文件卡片进入文档，回到原消息的右侧 Thread；Huddle 从当前频道开启，Calendar 从 Apps 进入。不要退回抽象的功能卡片，也不要做“点三步就学会了”的闯关教学。所有可见人物均使用部门/职责代称，示例覆盖不同部门；官方教程有中文就引用中文。

网站是本地交互演示，不连接真实 Slack/Google/Typeless 账号，不发送真实消息，不伪造 AI 回答。不要编造公司已经确定的频道、规则、套餐或业务结论。

本轮先启动网站、核对仓库与线上基线，简短说明你理解的结构和可运行状态，然后等我给具体修改要求。收到要求后，按本次范围实施并验证：文件→文档评论→回原 Thread、回复/同步、Huddle、目录与键盘、1920×1080 投屏和 1366×768 笔记本，以及受影响的手机布局。

改动用分支提交 PR，报告改了什么、实际验证了什么、还有什么没验证。不要自行合并或部署。

特别注意：当前 GitHub 和 Sites 没有自动部署绑定。推送或合并代码不会自动刷新现有 Sites 网站。不要修改 .openai/hosting.json 的 project_id，不要添加部署凭据；需要更新线上版时单独说明发布步骤。
