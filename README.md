# Auto Content SEO

> AI 驱动的全自动博客内容生产线 -- 从选题到发布再到搜索引擎收录，一条命令搞定。

本项目源自 [pokerjudge.com/blog](https://pokerjudge.com/blog) 的生产环境实践，经过完全解耦与通用化重构后开源。你可以用它为**任何网站**搭建一套 AI 自动写文章、生封面图、做 SEO、推搜索引擎的发布流水线。

---

## 它能做什么？

| 能力 | 说明 |
|---|---|
| **智能选题** | AI 根据你的分类和已发文章自动选题，杜绝重复 |
| **自动撰文** | 调用大模型生成结构化 Markdown 文章（含标题、摘要、FAQ） |
| **多语言翻译** | 自动生成中英双语版本（可扩展更多语言） |
| **AI 封面图** | 根据文章内容自动生成配图并压缩为 WebP |
| **SEO 内置** | 自动填充 `seo_title`、`seo_description`，生成结构化数据 |
| **多种存储** | 支持 Supabase / MySQL / SQLite / 纯 Markdown 文件输出 |
| **搜索引擎推送** | 发布后自动生成 Sitemap 并通过 IndexNow 通知 Bing/Yandex |
| **消息通知** | 发布结果推送到 Telegram / Discord / Email |

---

## 系统工作流程

下图展示了从「启动命令」到「文章上线」的完整流水线：

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Auto Content SEO Pipeline                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ 读取配置  │───>│ 查询历史  │───>│ AI 选题  │───>│ AI 撰文  │      │
│  │config.yml│    │ 防重复    │    │ 生成大纲  │    │ 中文正文  │      │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘      │
│                                                       │            │
│                                         ┌─────────────┼──────┐     │
│                                         ▼             ▼      │     │
│                                   ┌──────────┐  ┌──────────┐ │     │
│                                   │ AI 翻译   │  │ AI 生图  │ │     │
│                                   │ 英文版本   │  │ 封面配图  │ │     │
│                                   └─────┬────┘  └─────┬────┘ │     │
│                                         │             │      │     │
│                                         ▼             ▼      │     │
│                                   ┌─────────────────────┐    │     │
│                                   │    写入数据库/文件    │    │     │
│                                   │ Supabase│MySQL│MD   │    │     │
│                                   └─────────┬───────────┘    │     │
│                                             │                │     │
│                              ┌──────────────┼──────────────┐ │     │
│                              ▼              ▼              ▼ │     │
│                        ┌──────────┐  ┌──────────┐  ┌────────┐│     │
│                        │ Sitemap  │  │ IndexNow │  │ 通知    ││     │
│                        │ 生成     │  │ 推送     │  │ TG/DC  ││     │
│                        └──────────┘  └──────────┘  └────────┘│     │
│                                                              │     │
└──────────────────────────────────────────────────────────────┘     │
                                                                     │
                         ✅ 文章自动上线，搜索引擎已通知              │
─────────────────────────────────────────────────────────────────────┘
```

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/chainepic/auto-content-seo.git
cd auto-content-seo
npm install
```

### 2. 创建配置文件

```bash
cp config.example.yml config.yml
```

打开 `config.yml`，你只需要关注 **4 件事**：

| 你要填什么 | 在哪里 | 说明 |
|---|---|---|
| 你的站点名称和域名 | `project.name` / `project.domain` | 你的博客品牌名 |
| 你的文章分类 | `blog.categories` | 你希望 AI 写哪些方向的文章 |
| 大模型 API Key | `models.text.api_key` | DeepSeek / OpenAI / Claude 任选 |
| 文章存到哪 | `output.type` | `markdown`(最简单) / `supabase` / `mysql` |

### 3. 设置环境变量

在项目根目录创建 `.env` 文件（已在 `.gitignore` 中排除，不会泄露）：

```bash
# 必填：写作大模型
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 可选：AI 生图（不配则跳过封面生成）
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# 可选：如果用 Supabase 存储
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxxxx

# 可选：发布通知
TG_BOT_TOKEN=123456:ABC-xxxxx
TG_CHAT_ID=-100xxxxxxxxxx
```

### 4. 运行

```bash
# 正式运行（写入数据库/生成文件）
npm run start -- run

# 试运行（只看 AI 生成结果，不写入）
npm run start -- run --dry-run

# 使用自定义配置路径
npm run start -- run --config ./my-site.yml
```

### 5. 定时运行（可选）

用 crontab 实现每天自动发布：

```bash
# 每天早上 9 点自动发布一篇文章
0 9 * * * cd /path/to/auto-content-seo && node dist/index.js run >> logs/daily.log 2>&1
```

---

## 支持的大模型

### 文本生成（写文章 + 翻译）

| Provider | 模型示例 | 配置值 |
|---|---|---|
| DeepSeek | deepseek-chat, deepseek-v4-pro | `provider: "deepseek"` |
| OpenAI | gpt-4o, gpt-4o-mini | `provider: "openai"` |
| Claude | claude-3.5-sonnet | `provider: "claude"` (即将支持) |
| 通义千问 | qwen-plus, qwen-max | `provider: "qwen"` (即将支持) |

### 图像生成（封面配图）

| Provider | 模型 | 配置值 |
|---|---|---|
| 通义万相 (Wanx) | wanx2.1-t2i-turbo | `provider: "wanx"` |
| DALL-E | dall-e-3 | `provider: "dall-e"` (即将支持) |

> 不想生成封面图？设置环境变量 `SKIP_IMAGE=1` 或者不配置 `models.image` 即可。

---

## 支持的输出目标

| 类型 | 适用场景 | 配置值 |
|---|---|---|
| **Markdown** | Hexo / Hugo / Astro / Next.js 等静态博客 | `type: "markdown"` |
| **Supabase** | 全托管 PostgreSQL + 文件存储 | `type: "supabase"` |
| **MySQL** | 自建数据库 | `type: "mysql"` (即将支持) |
| **SQLite** | 本地轻量存储 | `type: "sqlite"` (即将支持) |

---

## 项目结构

```
auto-content-seo/
├── src/
│   ├── config/             # 配置读取与校验（Zod schema）
│   ├── adapters/
│   │   ├── llm/            # 大模型适配器（DeepSeek, OpenAI...）
│   │   ├── image/          # 图像生成适配器（Wanx, DALL-E...）
│   │   └── db/             # 输出适配器（Supabase, Markdown...）
│   ├── engine/
│   │   ├── TopicGenerator  # 智能选题引擎
│   │   └── ContentWriter   # 内容生成与翻译
│   ├── seo/
│   │   ├── sitemap         # Sitemap.xml 生成
│   │   └── indexnow        # IndexNow 搜索引擎推送
│   └── notification/       # 通知推送（Telegram, Discord）
├── config.example.yml      # 配置模板（复制后修改即用）
├── package.json
└── tsconfig.json
```

---

## 来自生产环境的验证

本系统脱胎于 [pokerjudge.com/blog](https://pokerjudge.com/blog) 的全自动化博客流水线。在该站点上，它每天自动：

- 选择一个与已有 120+ 篇文章不重复的新主题
- 用 DeepSeek 生成中英双语 Markdown 文章
- 用通义万相生成封面图并压缩为 WebP
- 写入 Supabase 数据库并立即上线
- 重新生成 Sitemap 并通过 IndexNow 推送给 Bing

经过通用化重构后，所有业务特定的逻辑（品牌名、分类规则、选题约束）都已抽离到 `config.yml` 中，可以直接复用到任何站点。

---

## Roadmap

- [x] 核心选题 + 写作 + 翻译引擎
- [x] DeepSeek / OpenAI 适配器
- [x] 通义万相 (Wanx) 图像生成
- [x] Supabase 数据库输出
- [x] Markdown 文件输出
- [x] Sitemap 自动生成
- [x] IndexNow 搜索引擎推送
- [x] Telegram / Discord 通知
- [ ] Claude / Qwen 适配器
- [ ] DALL-E 图像适配器
- [ ] MySQL / SQLite 适配器
- [ ] Google Indexing API
- [ ] GitHub Actions 一键部署模板
- [ ] Web UI 可视化配置面板

---

## License

MIT
