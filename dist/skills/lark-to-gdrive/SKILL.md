---
name: "lark-to-gdrive"
description: "把飞书/Lark 云文档批量迁移到 Google Drive，并转成原生 Google 格式（docx→Google Docs、sheet/bitable→Google Sheets、slides→Google Slides），保留表格边框等格式。用户说「把飞书文档搬到/传到 Google Drive」「Lark 转 Google Docs」「迁移云文档到谷歌」时使用。需要 lark-cli 已登录；Google 侧由使用者确认 OAuth 授权，使用 Drive API 转换；先试迁一篇，再按确认清单批量执行。"
---

# lark-to-gdrive：飞书云文档 → Google Drive（原生格式）

批量把用户名下的飞书文档导出并上传为**原生 Google Docs / Sheets / Slides**（不是 .docx 文件躺在 Drive 里），并修复飞书导出的表格边框丢失问题。

这是基于团队提供版本整理的公开副本。原始版本记录的验证环境为 macOS arm64（2026-10）；本次网页收录未执行真实迁移，使用前需先试迁一篇，并核对当前 CLI 参数与权限。

先让用户确认文档清单、目标公司账号和目标文件夹。默认保留飞书原文与已有 Drive 文件；删除、覆盖、扩大共享范围前必须单独确认。不要把令牌、配置文件、内部文档链接或 ID 提交到公开仓库、终端输出或聊天记录。

## 前置条件

```bash
command -v lark-cli          # 必须有
lark-cli auth status         # user 身份 ready / needs_refresh 均可（会自动刷新）
command -v python3           # macOS 自带
```

此方案不依赖 Google Drive 桌面版。由 **rclone 完成本机 OAuth 授权**，再使用 Drive REST API 转换格式。凭据只保存在本机，不上传到教学网页。

## 第 0 步：Google Drive 授权（一次性）

1. 从 [rclone 官方安装说明](https://rclone.org/install/) 安装适合本机的版本。
2. 按 [创建自己的 OAuth client_id](https://rclone.org/drive/#making-your-own-client-id) 配置经公司允许的 Google 应用。rclone 的共享 client_id 正在停用，不以跳过确认的方式依赖它。
3. 运行 `rclone config`，创建名为 `gdrive`、类型为 `drive` 的 remote。由使用者核对公司账号、OAuth 应用和所需权限，并亲自完成浏览器授权。
4. 验证：`rclone lsd gdrive:`。不要展示或上传 `rclone.conf`，其中包含访问令牌和刷新令牌。

如果应用未验证、被管理员阻止、账号不符或授权失败，先停止并联系公司 IT 确认，不自动点击绕过提示。若需要新建 OAuth 应用或扩大权限，应先得到用户确认。

令牌过期时，运行正常的 rclone 查询以尝试刷新；必要时由使用者重新授权。读取令牌时不要打印其值。

## 第 1 步：选出要迁移的文档

```bash
# 我名下(owner)的文档，按最近使用排序，一页 15 个
lark-cli drive +search --mine --format json
```

- 要更多：用返回里的 `page_token` 翻页，或加 `--edited-since` / `--doc-types` 等 flag
- 用户给具体 URL/token 时直接跳过搜索
- 结果里 `entity_type` 为 `WIKI` 的不用特殊处理，`+export` 传 wiki URL 会自动解包

## 第 2 步：导出到本地

```bash
mkdir -p ~/Desktop/lark-export && cd ~/Desktop/lark-export

# ⚠️ --output-dir 只接受相对路径，绝对路径会报 unsafe output path
lark-cli drive +export --url '<doc_url>' --file-extension docx \
  --file-name '<title>.docx' --output-dir . --overwrite
```

**导出格式映射**（选 Google 能转原生格式的中间格式）：

| 飞书类型 | export 格式 | → Google 格式 |
|---|---|---|
| docx / doc / wiki(底层docx) | docx | Google Docs |
| sheet / bitable | xlsx | Google Sheets |
| slides | pptx | Google Slides |
| file（普通文件）| 不导出，用 `drive +download` | 原样上传（不转格式） |

- 文件名先消毒：把 `/`、`:` 换成 `-`；重名（含 wiki 包装的同名文档）加后缀区分
- 轮询超时返回 `ready=false/ticket` 不算失败：用 `drive +task_result --scenario export` + `drive +export-download` 续跑

## 第 3 步：修复表格边框（关键，docx 专用）

飞书导出的表格边框是 `dee0e3` 浅灰或无颜色值，**Google 转换时会当成无边框丢掉**——用户看到的就是"表格变成散落的文字"。原始版本采用把 `w:tblBorders` 改成黑色 0.5pt 实线的方法修复。先试迁确认是否确有丢失；如需修改边框，告知外观变化并获同意，只处理导出的副本，不覆盖飞书原文。此方法不保证修复所有文档布局。

```python
#!/usr/bin/env python3
"""Rewrite docx table borders -> single black 0.5pt lines."""
import re, sys, zipfile, os

BORDER_TAGS = r'(?:top|left|bottom|right|insideH|insideV)'

def fix_borders_block(m):
    def fix_edge(em):
        return f'<w:{em.group(1)} w:val="single" w:sz="4" w:color="000000"/>'
    return re.sub(r'<w:(' + BORDER_TAGS + r')\b[^>]*/?>', fix_edge, m.group(0))

def fix(path):
    tmp = path + ".new"
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.namelist():
            data = zin.read(item)
            if item == "word/document.xml":
                x = data.decode("utf-8")
                x = re.sub(r'<w:tblBorders>.*?</w:tblBorders>', fix_borders_block, x)
                data = x.encode("utf-8")
            zout.writestr(item, data)
    os.replace(tmp, path)

for p in sys.argv[1:]:
    fix(p); print("fixed:", p)
```

存为 `/tmp/fix_borders.py`，在导出目录跑 `python3 /tmp/fix_borders.py *.docx`。

## 第 4 步：上传并转成 Google 原生格式

原始版本在 rclone v1.75.2 遇到 `--drive-import-formats` 未转换的情况。此方案直接指定 Google 目标 mimeType，并以返回值验收。下面的 multipart 示例适用于不超过 5 MB 的文件；更大文件按 [Google 官方上传说明](https://developers.google.com/workspace/drive/api/guides/manage-uploads?hl=zh-cn) 使用可恢复上传。

```bash
# 目标文件夹（不存在先建）：拿到 folder ID
~/.local/bin/rclone mkdir gdrive:lark-export 2>/dev/null
~/.local/bin/rclone lsjson gdrive: --dirs-only   # 取 lark-export 的 ID

TOKEN=$(python3 -c "import json,re; c=open('$HOME/.config/rclone/rclone.conf').read(); \
  print(json.loads(re.search(r'token = (\{.*\})', c).group(1))['access_token'])")

# mime 映射
#   docx -> application/vnd.google-apps.document
#   xlsx -> application/vnd.google-apps.spreadsheet
#   pptx -> application/vnd.google-apps.presentation
curl -sS -X POST "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'metadata={"name":"<名字不带扩展名>","mimeType":"application/vnd.google-apps.document","parents":["<FOLDER_ID>"]};type=application/json' \
  -F 'file=@<file>.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document'
```

**限流是常态**：rclone 共享 client_id 的 Drive API 配额是全项目共享的，403 `rateLimitExceeded` 频繁出现。所有 API 调用（含 DELETE）都要带重试：sleep 20-30s × 最多 8 次。DELETE 如果用 `-o /dev/null`，错误响应体看不到，要用 `-w "%{http_code}"` 判 204。

**传团队共享盘（Shared Drive）**：公司资料建议放共享盘而非个人 My Drive。API 参数加 `supportsAllDrives=true`，`parents` 填共享盘里的文件夹 ID；用 `rclone backend drives gdrive:` 列出有权访问的共享盘，再按官方 Shared drives 配置确认目标盘及文件夹；`--drive-shared-with-me` 是“与我共享”，不能代替共享盘列表。不得因上传失败擅自改成个人盘。

## 第 5 步：验证与去重

```bash
# 文件夹真实内容（API 直查，比 rclone lsjson 可靠）
curl -sS "https://www.googleapis.com/drive/v3/files?q=%27<FOLDER_ID>%27%20in%20parents%20and%20trashed%3Dfalse&fields=files(id,name,mimeType,createdTime)&pageSize=100" \
  -H "Authorization: Bearer $TOKEN"
```

验收标准：应转换的文档与目标 `application/vnd.google-apps.*` 类型相符；普通附件按原格式保存。检查内容、表格、图片、嵌入块和目标访问权限，不能只凭上传成功判断迁移完成。

- Drive API 新建文件可能产生同名副本。同名不等于重复；先列出文件名、创建时间和迁移结果，由用户确认后才删除或覆盖。默认保留所有原件。
- 抽查格式：把某个转换后的 Google Doc 再导回 docx（`/files/<id>/export?mimeType=...docx`），`unzip -p` 查 `w:tbl`/`w:tblBorders` 存在
- 请用户打开一篇表格多的文档肉眼确认

## 坑与排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `unsafe output path` | `--output-dir` 传了绝对路径 | cd 进目录后用 `--output-dir .` |
| export `ready=false` | 轮询窗口内未完成 | `+task_result` → `+export-download` 续跑 |
| OAuth 应用或权限被拦截 | 公司策略或应用配置不符 | 停止并请使用者/IT 确认，不自动绕过 |
| `--drive-import-formats` 后 mime 仍是 docx | v1.75.2 静默不转换 | 改用 Drive API multipart + 目标 mimeType |
| 403 `rateLimitExceeded` | 请求限流 | 有界重试；其他 403 需检查权限，不盲目重试 |
| 文件夹里出现同名双份 | 重跑可能重复创建 | 列出副本供用户确认，不自动删除 |
| 文档里的画板/内嵌 Base/妙记块丢失 | 飞书 export API 不支持该 block | 单独告知用户，别默默略过 |
| token 401 expired | access_token 过期 | 尝试正常刷新；必要时由使用者重新授权，勿输出令牌 |

## 参考

- 飞书侧命令细节：`lark-drive` skill（`+search`/`+export`/`+download`/`+inspect`）
- Google 上传与格式转换：<https://developers.google.com/workspace/drive/api/guides/manage-uploads?hl=zh-cn>
- rclone Google Drive：<https://rclone.org/drive/>
