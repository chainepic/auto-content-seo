# Auto Content SEO

**AI 驱动的全自动博客内容生产线** -- 从选题到发布再到搜索引擎收录，一条命令，零人工干预。

> 本项目源自 [pokerjudge.com/blog](https://pokerjudge.com/blog) 的真实生产环境，已稳定运行并自动发布 120+ 篇双语文章。经过完全解耦后开源，可直接复用到任何网站。

---

## 为什么需要它？

手动运营一个博客，你每天要做的事情是这样的：

| 手动流程 | 耗时 | 痛点 |
|---|:---:|---|
| 想选题、查有没有写过 | 30 min | 越写越难想，经常撞车 |
| 写一篇 1500 字的文章 | 2-3 h | 枯燥重复，质量波动大 |
| 翻译成英文版 | 1-2 h | 找翻译或自己改，术语不统一 |
| 做一张封面图 | 30 min | 找素材、调尺寸、压缩 |
| 填 SEO 标题和描述 | 15 min | 容易忘，经常不写 |
| 上传到 CMS 发布 | 10 min | 手动操作，容易出错 |
| 提交到搜索引擎 | 10 min | 大多数人根本不知道要做这步 |
| **合计** | **4-6 小时/篇** | **日更根本不可能** |

用了 Auto Content SEO 之后：

```
一条命令 → 3-5 分钟 → 文章自动上线 → 搜索引擎已通知 → 你的手机收到通知
```

**每天节省 4-6 小时。每月节省 120+ 小时。全年节省 1500+ 小时。**

---

## 它能做什么？

| 能力 | 说明 | 状态 |
|---|---|:---:|
| **智能选题** | AI 根据你的分类和已发文章自动选题，杜绝重复 | ✅ |
| **结构化撰文** | 生成含标题层级、FAQ、表格的 Markdown 文章 | ✅ |
| **SEO 自动优化** | 自动生成 seo_title / seo_description / 结构化摘要 | ✅ |
| **AIO 友好** | 文章结构适配 AI 搜索引擎摘录（Google AI Overview 等）| ✅ |
| **多语言翻译** | 自动生成中英双语版本（可扩展更多语言） | ✅ |
| **AI 封面图** | 根据文章内容自动生成配图并压缩为 WebP | ✅ |
| **多种存储** | Supabase / MySQL / SQLite / 纯 Markdown 文件 | ✅ |
| **Sitemap 生成** | 发布后自动重建 sitemap.xml | ✅ |
| **IndexNow 推送** | 主动通知 Bing / Yandex 等搜索引擎抓取新内容 | ✅ |
| **消息通知** | 发布结果推送到 Telegram / Discord | ✅ |
| **Google Indexing** | 通过 Google Indexing API 通知 Google 抓取 | 🔜 |
| **Email 通知** | SMTP 邮件推送发布结果 | 🔜 |

---

## 实际效果

以 [pokerjudge.com/blog](https://pokerjudge.com/blog) 为例，这套系统已经在生产环境中持续运行：

| 指标 | 数据 |
|---|---|
| 已自动发布文章 | 120+ 篇（中英双语 = 240+ 条记录） |
| 每篇生成耗时 | 3-5 分钟（含选题 + 写作 + 翻译 + 生图 + 入库） |
| 封面图自动生成 | 100%，全部压缩为 WebP < 150KB |
| 搜索引擎通知 | 每次发布后自动推送 IndexNow |
| 人工干预 | 0（crontab 定时，完全无人值守） |

---

## 系统工作流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Auto Content SEO Pipeline                       │
│                                                                     │
│  ╔══════════╗    ╔══════════╗    ╔══════════╗    ╔══════════╗      │
│  ║ 读取配置  ║───>║ 查询历史  ║───>║ AI 选题  ║───>║ AI 撰文  ║      │
│  ║config.yml║    ║ 防重复    ║    ║ 生成大纲  ║    ║ 结构化MD ║      │
│  ╚══════════╝    ╚══════════╝    ╚══════════╝    ╚════╤═════╝      │
│                                                       │            │
│                                         ┌─────────────┼──────┐     │
│                                         ▼             ▼      │     │
│                                   ╔══════════╗  ╔══════════╗ │     │
│                                   ║ AI 翻译   ║  ║ AI 生图  ║ │     │
│                                   ║ 多语言版本 ║  ║ 封面配图  ║ │     │
│                                   ╚═════╤════╝  ╚═════╤════╝ │     │
│                                         └──────┬──────┘      │     │
│                                                ▼             │     │
│                                   ╔═════════════════════╗    │     │
│                                   ║    写入数据库/文件    ║    │     │
│                                   ║ Supabase│MySQL│.md  ║    │     │
│                                   ╚════════╤════════════╝    │     │
│                                            │                 │     │
│                              ┌─────────────┼───────────┐     │     │
│                              ▼             ▼           ▼     │     │
│                        ╔══════════╗  ╔══════════╗ ╔════════╗ │     │
│                        ║ Sitemap  ║  ║ IndexNow ║ ║  通知   ║ │     │
│                        ║ 自动生成  ║  ║ 搜索推送  ║ ║ TG/DC  ║ │     │
│                        ╚══════════╝  ╚══════════╝ ╚════════╝ │     │
│                                                              │     │
│                   ✅ 文章自动上线，搜索引擎已通知               │     │
└──────────────────────────────────────────────────────────────┘     │
─────────────────────────────────────────────────────────────────────┘
```

---

## 快速开始（5 分钟上手）

### Step 1 — 克隆项目

```bash
git clone https://github.com/chainepic/auto-content-seo.git
cd auto-content-seo
npm install
npm run build
```

### Step 2 — 创建配置文件

```bash
cp config.example.yml config.yml
```

打开 `config.yml`，你只需要关注 **4 件事**：

| 序号 | 你要填什么 | 配置项 | 说明 |
|:---:|---|---|---|
| 1 | 站点名称和域名 | `project.name` / `project.domain` | AI 写文章时会自然引用你的品牌名 |
| 2 | 文章分类 | `blog.categories` | 你希望 AI 写哪些方向的文章 |
| 3 | 大模型 API Key | `models.text.api_key` | DeepSeek / OpenAI / Claude 任选一个 |
| 4 | 文章存到哪 | `output.type` | `markdown` 最简单，零配置即可用 |

> `config.example.yml` 中每个配置项都有详细的中文注释，照着填就行。

### Step 3 — 设置环境变量

在项目根目录创建 `.env` 文件（已在 `.gitignore` 中排除，不会泄露）：

```bash
# ── 必填 ──────────────────────────
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# ── 可选：AI 生图（不配则跳过封面生成）──
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# ── 可选：Supabase 存储 ──────────
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxxxx

# ── 可选：发布通知 ────────────────
TG_BOT_TOKEN=123456:ABC-xxxxx
TG_CHAT_ID=-100xxxxxxxxxx
```

### Step 4 — 运行

```bash
# 试运行（只看 AI 生成结果，不写入任何地方）
npm run start -- run --dry-run

# 正式运行（写入数据库或生成文件）
npm run start -- run

# 使用自定义配置路径
npm run start -- run --config ./my-site.yml
```

### Step 5 — 设置定时任务（可选）

```bash
# 每天早上 9 点自动发布一篇文章
crontab -e
# 添加下面这行：
0 9 * * * cd /path/to/auto-content-seo && node dist/index.js run >> logs/daily.log 2>&1
```

---

## 支持的大模型

### 文本生成（写文章 + 翻译）

| Provider | 模型示例 | 配置值 | 状态 |
|---|---|---|:---:|
| DeepSeek | deepseek-chat, deepseek-v4-pro | `provider: "deepseek"` | ✅ |
| OpenAI | gpt-4o, gpt-4o-mini | `provider: "openai"` | ✅ |
| Claude | claude-3.5-sonnet, claude-4 | `provider: "claude"` | 🔜 |
| 通义千问 | qwen-plus, qwen-max | `provider: "qwen"` | 🔜 |
| Ollama | llama3, mistral (本地运行) | `provider: "ollama"` | 🔜 |

### 图像生成（封面配图）

| Provider | 模型 | 配置值 | 状态 |
|---|---|---|:---:|
| 通义万相 | wanx2.1-t2i-turbo | `provider: "wanx"` | ✅ |
| DALL-E | dall-e-3 | `provider: "dall-e"` | 🔜 |
| Stable Diffusion | sd-xl (本地/API) | `provider: "sd"` | 🔜 |

> 不想生成封面图？设置环境变量 `SKIP_IMAGE=1` 或不配置 `models.image` 即可。

---

## 支持的输出目标

| 类型 | 适用场景 | 配置值 | 状态 |
|---|---|---|:---:|
| **Markdown 文件** | Hexo / Hugo / Astro / Next.js 等静态博客 | `type: "markdown"` | ✅ |
| **Supabase** | 全托管 PostgreSQL + 文件存储 | `type: "supabase"` | ✅ |
| **MySQL** | 自建数据库 | `type: "mysql"` | 🔜 |
| **SQLite** | 本地轻量存储 | `type: "sqlite"` | 🔜 |
| **WordPress** | WP REST API | `type: "wordpress"` | 🔜 |

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
│   │   ├── TopicGenerator  # 智能选题引擎（含防撞车逻辑）
│   │   └── ContentWriter   # 内容生成与多语言翻译
│   ├── seo/
│   │   ├── sitemap         # Sitemap.xml 动态生成
│   │   └── indexnow        # IndexNow 搜索引擎主动推送
│   └── notification/       # 通知推送（Telegram, Discord, Email）
├── config.example.yml      # 配置模板（有详细中文注释）
├── package.json
└── tsconfig.json
```

---

## 解决的核心痛点

| 痛点 | 传统方式 | 用了本系统之后 |
|---|---|---|
| **选题难** | 人工想主题，越写越枯竭 | AI 自动选题，基于历史文章防重复 |
| **写作慢** | 每篇 2-3 小时 | 每篇 3-5 分钟，质量稳定 |
| **翻译贵** | 找翻译或用翻译工具反复校对 | 同一大模型一次性输出双语版本 |
| **配图烦** | 找免费素材 → 调尺寸 → 压缩 → 上传 | AI 生图 → 自动压缩 WebP → 自动上传 |
| **SEO 没做** | 忘记写 meta 描述，不知道 IndexNow | 自动生成 SEO 元数据 + 主动推送搜索引擎 |
| **发布繁琐** | 登录后台 → 粘贴 → 排版 → 发布 | 一条命令，直接入库上线 |
| **不可持续** | 靠意志力日更，通常坚持不过一周 | crontab 定时跑，365 天无人值守 |

---

## Roadmap

- [x] 核心选题 + 写作 + 翻译引擎
- [x] DeepSeek / OpenAI LLM 适配器
- [x] 通义万相 (Wanx) 图像生成
- [x] Supabase 数据库输出
- [x] Markdown 文件输出
- [x] Sitemap 自动生成
- [x] IndexNow 搜索引擎推送
- [x] Telegram / Discord 通知
- [ ] Claude / Qwen / Ollama 适配器
- [ ] DALL-E / Stable Diffusion 图像适配器
- [ ] MySQL / SQLite / WordPress 适配器
- [ ] Google Indexing API
- [ ] GitHub Actions 一键部署模板
- [ ] Email (SMTP) 通知
- [ ] Web UI 可视化配置面板

---

## Contributing

欢迎提交 Issue 和 PR。如果这个项目对你有帮助，请给一个 Star ⭐

## License

MIT
