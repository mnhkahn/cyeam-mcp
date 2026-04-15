# Cyeam Wiki MCP

把个人 Wiki 知识库封装成一个 MCP Server，用 **Node.js / TypeScript** 实现，部署到云端，随时随地查询。

## 项目结构

```
.
├── wiki/                    # 生成的知识库（会随服务端一起部署）
│   ├── _index.md            # 文章索引
│   ├── _backlinks.json      # 反向链接数据
│   └── {people,projects,...}/
├── src/
│   ├── server.ts            # MCP Server (SSE 模式，Express)
│   ├── engine.ts            # Wiki 查询引擎（复现 skill query 逻辑）
│   └── prompts.ts           # MCP 对外查询提示词
├── static/
│   └── graph.png            # 知识关系图
├── data/                    # 原始数据（日记、笔记等）
├── scripts/
│   ├── ingest.py            # 原始数据 → raw entries（Python 辅助脚本）
│   └── build_graph.py       # 根据 backlinks 生成关系图（Python 辅助脚本）
├── Dockerfile
├── fly.toml                 # Fly.io 部署配置
├── render.yaml              # Render 部署配置
├── package.json
└── tsconfig.json
```

> **注意**：服务端核心完全使用 Node.js/TS。`scripts/` 下的 Python 脚本仅用于数据预处理（ingest / build_graph），不影响服务端运行。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

服务会启动在 `http://localhost:8000`

- MCP SSE 端点: `http://localhost:8000/sse`
- 健康检查: `http://localhost:8000/health`

### 3. 生成关系图

```bash
# 需要 Python 环境（仅辅助脚本）
python scripts/build_graph.py
```

会生成 `static/graph.png` 和 `static/graph.svg`。

## MCP Tools

| Tool | 说明 |
|------|------|
| `wiki_query` | 自然语言查询，自动匹配索引、反向链接、追踪 wikilinks 2-3 层，返回相关文章上下文 |
| `wiki_get_article` | 读取指定文章完整内容 |
| `wiki_search_index` | 按关键词搜索 `_index.md` |
| `wiki_get_graph` | 返回知识关系图（ImageContent） |

## MCP Resources

| URI | 说明 |
|-----|------|
| `wiki://index` | `_index.md` 全文 |
| `wiki://backlinks` | `_backlinks.json` 全文 |
| `wiki://article/{name}` | 单篇文章内容 |
| `wiki://graph` | 关系图二进制数据 |

## MCP Prompts

| Prompt | 说明 |
|--------|------|
| `wiki_query_system` | 指导调用方如何正确使用 wiki 查询工具的系统提示词 |

## 部署

### 方案 A: Fly.io（推荐，免费额度充足）

1. 安装 [flyctl](https://fly.io/docs/flyctl/install/)
2. 登录: `fly auth signup` 或 `fly auth login`
3. 部署:

```bash
fly launch --copy-config   # 会使用现有的 fly.toml
fly deploy
```

免费额度：
- 每月 $5 的免费额度（足够跑一个 shared-cpu-1x + 256MB）
- 按量计费，休眠时不收费（`auto_stop_machines = 'stop'`）

### 方案 B: Render（最简单）

1. Fork 或 Push 代码到 GitHub
2. 在 [Render Dashboard](https://dashboard.render.com/) 点击 "New Web Service"
3. 选择仓库，平台选 Docker
4. Render 会自动读取 `render.yaml` 配置

免费额度：
- Web Service 免费实例会在 15 分钟无请求后休眠
- 首次请求有 30 秒冷启动时间

### 方案 C: Railway（推荐，无强制休眠）

1. Fork 或 Push 代码到 GitHub
2. 登录 [Railway](https://railway.app/) Dashboard
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库，Railway 会自动读取 `railway.json` 和 `Dockerfile`
5. 部署完成后，在 Settings → Networking 里生成一个域名

免费额度（Hobby Plan）：
- 每月 $5 免费额度
- 按 CPU / 内存 / 流量计费
- **不会强制休眠**，服务可 24h 运行
- 一个 512MB 实例大约能跑整月

环境变量：
- `PORT` 由 Railway 自动注入，无需手动设置
- 如需调整，可在 Dashboard 的 Variables 里添加

## 接入 Claude Desktop / Cursor

如果你使用 SSE 模式的 MCP Server，客户端配置如下：

```json
{
  "mcpServers": {
    "cyeam-wiki": {
      "url": "https://your-app.fly.dev/sse"
    }
  }
}
```

> 注意：Claude Desktop 目前主要支持 `stdio` 和 `sse` 两种 transport。如果你的客户端只支持 stdio，可以用一个本地桥接工具（如 `mcp-proxy`）把远程 SSE 转成 stdio。

## 工作流程

1. **放入原始数据** → `data/`
2. **运行 ingest** → `python scripts/ingest.py --input data/xxx --output raw/entries`
3. **用 wiki skill 的 absorb 生成文章** → 更新 `wiki/` 目录
4. **生成关系图** → `python scripts/build_graph.py`
5. **提交代码** → `git push`
6. **自动部署** → Fly.io/Render 自动拉取最新 wiki

## 查询逻辑说明

`wiki_query` 的核心逻辑复现了 wiki skill 的 query 规范：

1. 解析 `_index.md`，利用标题、描述、别名匹配问题关键词
2. 查 `_backlinks.json`，补全高连接度的核心文章
3. 读取匹配到的文章正文
4. 从正文中提取 `[[wikilink]]`，再扩展 2-3 层关联文章
5. 限制返回 3-8 篇文章的精选内容（每篇最多 4000 字符）
6. 格式化为 markdown 返回给调用方综合

## License

MIT
