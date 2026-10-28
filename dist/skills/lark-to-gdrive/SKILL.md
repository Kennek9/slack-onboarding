---
name: "lark-to-gdrive"
description: "把飞书/Lark 云文档批量迁移到 Google Drive，并转成原生 Google 格式（docx→Google Docs、sheet/bitable→Google Sheets、slides→Google Slides），保留表格边框、把 docx 内嵌电子表格转成真表格。用户说「把飞书文档搬到/传到 Google Drive」「Lark 转 Google Docs」「迁移云文档到谷歌」时使用。需要 lark-cli 已登录；Google 侧通过 rclone 一次性 OAuth 拿 token，上传直接用 Drive API multipart 转换（不要用 rclone --drive-import-formats，v1.75 静默不生效）。"
---

# lark-to-gdrive：飞书云文档 → Google Drive（原生格式）

批量把用户名下的飞书文档导出并上传为**原生 Google Docs / Sheets / Slides**（不是 .docx 文件躺在 Drive 里），并修复飞书导出的表格边框丢失问题。

整条链路已实测验证（macOS arm64, 2026-10）。按步骤执行即可，遇到报错先查文末「坑与排查」表。

## 前置条件

```bash
command -v lark-cli          # 必须有
lark-cli auth status         # user 身份 ready / needs_refresh 均可（会自动刷新）
command -v python3           # macOS 自带
```

Google Drive 侧没有 MCP，也不需要装 Google Drive 桌面版——用 **rclone 做一次浏览器 OAuth 拿 token**，之后全部走 Drive REST API。

## 第 0 步：Google Drive 授权（一次性）

```bash
# 安装单文件 rclone（无需 brew/sudo）
cd /tmp && curl -fsSL -o rclone.zip https://downloads.rclone.org/rclone-current-osx-arm64.zip \
  && unzip -o -q rclone.zip && cp rclone-*-osx-arm64/rclone ~/.local/bin/rclone

# 建 remote
~/.local/bin/rclone config create gdrive drive scope=drive --non-interactive

# rclone 会问"共享 client_id 即将停用，继续用吗"——写进配置跳过交互
cat >> ~/.config/rclone/rclone.conf <<'EOF'
config_shared_client_id = true
EOF

# 触发 OAuth：管道喂两个 y（共享 client 确认 + 自动浏览器授权）
printf 'y\ny\n' | ~/.local/bin/rclone config reconnect gdrive:
```

- **用目标 Workspace 账号授权**：Glorify 的 Google Workspace 主域是 **glorify-app.com**（2026-10 确认；glorify.global 并入该 Workspace）。授权前先确认浏览器当前的 Google 会话是这个账号，别授权到个人 Gmail
- 浏览器会自动打开 Google 授权页；若不弹，手动 `open -a "Google Chrome" "http://127.0.0.1:53682/auth?state=<日志里的state>"`
- 出现 "Google hasn't verified this app" → **Advanced → Go to rclone** → Allow
- 拿到 code 后进程可能还会问 "Configure as Shared Drive?" 并 EOF 退出——**token 已写入 rclone.conf，属正常，不用重跑**
- 验证：`rclone lsd gdrive:`（返回码 0 即通；空 Drive 无输出）
- 注意：共享 client_id 计划 2026 年内停用。若授权页报 invalid_client，需按 https://rclone.org/drive/#making-your-own-client-id 自建 client_id
- token 有效期约 1 小时；过期后跑任意 rclone 命令会自动刷新，再从 rclone.conf 重新读取

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

## 第 3 步：修复 docx（表格边框 + 内嵌电子表格）

### 3a. 表格边框

飞书导出的表格边框是 `dee0e3` 浅灰或无颜色值，**Google 转换时会当成无边框丢掉**——用户看到的就是"表格变成散落的文字"。先把 docx 里所有 `w:tblBorders` 改成黑色 0.5pt 实线，转换后边框完好保留（已实测验证）。

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

### 3b. 内嵌电子表格（sheet block）→ 真表格

docx 里内嵌的飞书电子表格导出后是 OLE 对象：一张预览图 + "Click the image to view the sheet." 占位文字，真实数据藏在 `word/embeddings/*.xlsx`。Google 转换后只剩图片，内容全丢。下面脚本把每个 OLE 对象换成从 xlsx 重建的 `<w:tbl>`（支持合并单元格，自带黑色边框；纯 stdlib，无需联网）。已在含 26 个内嵌表格和合并单元格的真实文档上验证。

```python
#!/usr/bin/env python3
"""Replace embedded Lark-sheet OLE objects in an exported .docx with real docx tables.

Lark exports an embedded sheet block as <w:object> + OLEObject + preview image +
optional 'Click the image to view the sheet.' caption. The real grid data is kept
in word/embeddings/*.xlsx. This script parses each embedded xlsx (stdlib only),
builds a <w:tbl>, and drops the image + caption paragraph.
"""
import re, sys, zipfile, os, shutil, tempfile
import xml.etree.ElementTree as ET

MAX_ROWS, MAX_COLS = 300, 40
SS_NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
PKG_R = '{http://schemas.openxmlformats.org/package/2006/relationships}'

def col_letters_to_idx(s):
    n = 0
    for ch in s: n = n * 26 + (ord(ch) - 64)
    return n

def cell_ref(rc):
    m = re.match(r'([A-Z]+)(\d+)', rc)
    return (int(m.group(2)), col_letters_to_idx(m.group(1)))  # (row, col) 1-based

def read_shared_strings(z):
    try: data = z.read('xl/sharedStrings.xml')
    except KeyError: return []
    root = ET.fromstring(data)
    out = []
    for si in root.findall(f'{SS_NS}si'):
        out.append(''.join(t.text or '' for t in si.iter(f'{SS_NS}t')))
    return out

def pick_worksheet(z):
    names = [n for n in z.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', n)]
    if len(names) == 1: return names[0]
    try:
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        for rel in rels.findall(f'{PKG_R}Relationship'):
            t = rel.get('Type','')
            if t.endswith('/worksheet'):
                return 'xl/' + rel.get('Target').lstrip('/')
    except KeyError: pass
    return sorted(names)[0] if names else None

def cell_text(c, shared):
    t = c.get('t')
    v = c.find(f'{SS_NS}v')
    if t == 's':
        return shared[int(v.text)] if v is not None and v.text else ''
    if t == 'inlineStr':
        is_el = c.find(f'{SS_NS}is')
        return ''.join(x.text or '' for x in is_el.iter(f'{SS_NS}t')) if is_el is not None else ''
    if t == 'b':
        return 'TRUE' if v is not None and v.text == '1' else 'FALSE'
    return v.text if v is not None and v.text else ''

def parse_xlsx(path):
    with zipfile.ZipFile(path) as z:
        shared = read_shared_strings(z)
        ws = pick_worksheet(z)
        if not ws: return [], []
        root = ET.fromstring(z.read(ws))
        cells, max_r, max_c = {}, 0, 0
        for c in root.iter(f'{SS_NS}c'):
            ref = c.get('r')
            if not ref: continue
            r, col = cell_ref(ref)
            if r <= MAX_ROWS and col <= MAX_COLS:
                cells[(r, col)] = cell_text(c, shared)
                max_r, max_c = max(max_r, r), max(max_c, col)
        merges = []
        for mc in root.iter(f'{SS_NS}mergeCell'):
            m = re.match(r'([A-Z]+\d+):([A-Z]+\d+)', mc.get('ref',''))
            if m:
                r1, c1 = cell_ref(m.group(1)); r2, c2 = cell_ref(m.group(2))
                merges.append((r1, c1, r2, c2))
        rows = [[cells.get((r, c), '') for c in range(1, max_c + 1)]
                for r in range(1, max_r + 1)]
        return rows, merges

def esc(s):
    return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def build_tbl(rows, merges):
    if not rows: return ''
    ncols = max(len(r) for r in rows)
    width = 9360 // max(ncols, 1)
    anchor, cont = {}, {}
    for r1, c1, r2, c2 in merges:
        span = c2 - c1 + 1
        anchor[(r1, c1)] = (span, r2 > r1)
        for rr in range(r1 + 1, r2 + 1):
            cont[(rr, c1)] = span
    def tc(text, span=None, vmerge=None):
        pr = f'<w:tcW w:w="{width * (span or 1)}" w:type="dxa"/>'
        if span and span > 1: pr += f'<w:gridSpan w:val="{span}"/>'
        if vmerge: pr += f'<w:vMerge w:val="{vmerge}"/>' if vmerge == 'restart' else '<w:vMerge/>'
        t = esc(text)
        return f'<w:tc><w:tcPr>{pr}</w:tcPr><w:p><w:r><w:t xml:space="preserve">{t}</w:t></w:r></w:p></w:tc>'
    trs = []
    for r, row in enumerate(rows, 1):
        tcs, c = [], 1
        while c <= ncols:
            if (r, c) in cont:
                tcs.append(tc('', span=cont[(r, c)], vmerge='continue'))
                c += cont[(r, c)]
            elif (r, c) in anchor:
                span, vert = anchor[(r, c)]
                tcs.append(tc(row[c-1] if c-1 < len(row) else '', span=span, vmerge='restart' if vert else None))
                c += span
            else:
                tcs.append(tc(row[c-1] if c-1 < len(row) else ''))
                c += 1
        trs.append('<w:tr>' + ''.join(tcs) + '</w:tr>')
    borders = ''.join(f'<w:{e} w:val="single" w:sz="4" w:color="000000"/>'
                      for e in ('top','left','bottom','right','insideH','insideV'))
    return (f'<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>'
            f'<w:tblBorders>{borders}</w:tblBorders><w:tblLayout w:type="autofit"/>'
            f'</w:tblPr><w:tblGrid>' + f'<w:gridCol w:w="{width}"/>' * ncols +
            f'</w:tblGrid>' + ''.join(trs) + '</w:tbl>')

CAPTION = r'(?:view the sheet|查看电子表格|查看表格)'
OBJ_P = re.compile(
    r'<w:p\b[^>]*>(?:(?!</w:p>).)*?<o:OLEObject[^>]*r:id="(rId\d+)"(?:(?!</w:p>).)*?</w:p>'
    r'(<w:p\b[^>]*>(?:(?!</w:p>).)*?' + CAPTION + r'(?:(?!</w:p>).)*?</w:p>)?', re.S)

def fix(path):
    with zipfile.ZipFile(path) as z:
        doc = z.read('word/document.xml').decode('utf-8')
        rels = ET.fromstring(z.read('word/_rels/document.xml.rels'))
        rid2target = {r.get('Id'): r.get('Target') for r in rels.findall(f'{PKG_R}Relationship')}
        tmpdir = tempfile.mkdtemp()
        n_ok = n_fail = 0
        def repl(m):
            nonlocal n_ok, n_fail
            rid = m.group(1)
            if 'ProgID="Excel' not in m.group(0):
                return m.group(0)
            target = rid2target.get(rid, '')
            if 'embeddings/' not in target:
                n_fail += 1; return m.group(0)
            xlsx = os.path.join(tmpdir, os.path.basename(target))
            try:
                xlsx_data = z.read('word/' + target)
            except KeyError:
                n_fail += 1; return m.group(0)
            with open(xlsx, 'wb') as f: f.write(xlsx_data)
            rows, merges = parse_xlsx(xlsx)
            tbl = build_tbl(rows, merges)
            if not tbl:
                n_fail += 1; return m.group(0)
            n_ok += 1
            return tbl + '<w:p/>'
        new_doc = OBJ_P.sub(repl, doc)
        if n_ok == 0 and n_fail == 0:
            return False
        tmp = path + '.new'
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in z.namelist():
                data = z.read(item)
                if item == 'word/document.xml': data = new_doc.encode('utf-8')
                zout.writestr(item, data)
        os.replace(tmp, path)
        shutil.rmtree(tmpdir, ignore_errors=True)
        print(f'fixed {n_ok} embedded sheet(s), failed {n_fail}: {path}')
        return True

for p in sys.argv[1:]:
    if not fix(p): print('no embedded sheets:', p)
```

存为 `/tmp/fix_embedded_sheets.py`，同样在导出目录跑 `python3 /tmp/fix_embedded_sheets.py *.docx`。输出 `fixed N embedded sheet(s)`；全为 0 说明没有内嵌表格，不用管。上限 300 行 × 40 列，超出截断——超大内嵌表格单独导出 sheet 处理。只想知道文档有没有内嵌表格、不导全文时，用 `lark-cli docs +script --command parse --doc <url>` 看 profile 里有没有 `sheet` 块。

## 第 4 步：上传并转成 Google 原生格式

**不要**用 `rclone copy --drive-import-formats docx`——v1.75.2 实测静默不转换（文件仍是 .docx mime）。直接用 Drive API multipart 上传 + 指定目标 mimeType：

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

**传团队共享盘（Shared Drive）**：公司资料建议放共享盘而非个人 My Drive。API 参数加 `supportsAllDrives=true`，`parents` 填共享盘里的文件夹 ID；rclone 侧目录用 `rclone lsd gdrive: --drive-shared-with-me` 之类确认（团队盘 ID 不是 root）。

## 第 5 步：验证与去重

```bash
# 文件夹真实内容（API 直查，比 rclone lsjson 可靠）
curl -sS "https://www.googleapis.com/drive/v3/files?q=%27<FOLDER_ID>%27%20in%20parents%20and%20trashed%3Dfalse&fields=files(id,name,mimeType,createdTime)&pageSize=100" \
  -H "Authorization: Bearer $TOKEN"
```

验收标准：全部 `application/vnd.google-apps.*`，无残留 .docx。

- Drive **允许同名文件共存**——重跑或删旧版失败后会有重复。按 name 分组、`createdTime` 降序，删旧的
- 抽查格式：把某个转换后的 Google Doc 再导回 docx（`/files/<id>/export?mimeType=...docx`），`unzip -p` 查 `w:tbl`/`w:tblBorders` 存在
- 请用户打开一篇表格多的文档肉眼确认

## 坑与排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `unsafe output path` | `--output-dir` 传了绝对路径 | cd 进目录后用 `--output-dir .` |
| export `ready=false` | 轮询窗口内未完成 | `+task_result` → `+export-download` 续跑 |
| reconnect 卡在 "Continue using shared client_id" EOF | 交互读不到输入 | `printf 'y\ny\n'` 喂答案；或配置写 `config_shared_client_id = true` |
| `--drive-import-formats` 后 mime 仍是 docx | v1.75.2 静默不转换 | 改用 Drive API multipart + 目标 mimeType |
| 403 `rateLimitExceeded` | 共享 client_id 全项目限流 | 重试 + sleep 20-30s；属正常，不是失败 |
| 文件夹里出现同名双份 | Drive 允许同名 / 删除被限流 | 按 createdTime 去重 |
| 迁移后内嵌表格变成图片 | 飞书把 sheet 块导出成 OLE 预览图 + 链接 | 第 3b 步 `fix_embedded_sheets.py` 转成真表格 |
| 文档里的画板/内嵌 Base/妙记块丢失 | 飞书 export API 不支持该 block | 单独告知用户，别默默略过 |
| token 401 expired | access_token 1 小时过期 | 跑一条 rclone 命令触发刷新，重读 rclone.conf |

## 参考

- 飞书侧命令细节：`lark-drive` skill（`+search`/`+export`/`+download`/`+inspect`）
- Drive API：<https://developers.google.com/drive/api/reference/rest/v3/files>
