# Auto Blog Pipeline

这是一个通用的、高度可配置的自动化内容工作流项目。它基于原 PokerJudge 的博客发布系统升级而来，解除了业务耦合，支持多语言、多平台、多模型和多渠道推送。

## 项目结构

```
auto-blog-pipeline/
├── _legacy_refs/           # 原项目参考代码 (blog-autopublish, sitemap, indexnow)
├── src/
│   ├── config/             # 通用配置读取与解析 (支持 yaml)
│   ├── adapters/           
│   │   ├── llm/            # LLM 适配器 (OpenAI, Claude, DeepSeek, Qwen)
│   │   ├── image/          # 图像适配器 (Wanx, DALL-E, Midjourney)
│   │   └── db/             # CMS 输出适配器 (Supabase, MySQL, SQLite, Markdown)
│   ├── engine/             # 核心引擎 (TopicGen, ContentWriter, Translator)
│   ├── seo/                # SEO 推送模块 (IndexNow, Sitemap, Google Indexing)
│   └── notification/       # 推送通知模块 (Telegram, Discord, Email)
├── config.example.yml      # 通用配置示例
├── package.json            # 依赖配置
└── tsconfig.json           # TypeScript 配置
```

## 配置示例 (`config.example.yml`)

您可以将此配置复制为 `config.yml`，然后根据您的新网站要求进行设置：

```yaml
project:
  name: "Your Blog Name"
  locale: "zh-CN"          # 系统主语言

blog:
  categories:
    - "tech"
    - "life"
    - "news"
  tone: "专业且客观"
  forbidden_keywords:
    - "禁忌词1"
    - "特定前缀-"

models:
  text:
    provider: "deepseek"   # 可选: openai, claude, deepseek, qwen
    api_key: "${DEEPSEEK_API_KEY}"
    model: "deepseek-chat"
  image:
    provider: "wanx"       # 可选: wanx, dall-e
    api_key: "${DASHSCOPE_API_KEY}"

output:
  type: "supabase"         # 可选: supabase, mysql, sqlite, markdown
  supabase_url: "${SUPABASE_URL}"
  supabase_key: "${SUPABASE_SERVICE_KEY}"

notifications:
  telegram:
    enabled: true
    bot_token: "${TG_BOT_TOKEN}"
    chat_id: "${TG_CHAT_ID}"
  discord:
    enabled: false
    webhook_url: "${DISCORD_WEBHOOK_URL}"
```

## 核心依赖 (package.json)

系统使用 Node.js 构建，包含以下核心依赖：

```json
{
  "dependencies": {
    "yaml": "^2.3.4",
    "zod": "^3.22.4",
    "axios": "^1.6.5",
    "commander": "^11.1.0",
    "dotenv": "^16.3.1",
    "@supabase/supabase-js": "^2.39.3",
    "mysql2": "^3.9.0",
    "sqlite3": "^5.1.7",
    "pg": "^8.11.3",
    "nodemailer": "^6.9.8",
    "telegraf": "^4.15.3"
  }
}
```

## 部署与运行

1. 克隆项目后执行 `npm install`。
2. 复制 `config.example.yml` 为 `config.yml` 并填入相应的 API Key。
3. 执行工作流：
   ```bash
   npm run start
   ```

*注意：目前由于您拒绝了切换至 Agent 执行模式，代码框架暂在 Markdown 中展示。如果您准备好正式生成项目的所有 `.ts` 与 `.json` 代码文件，请批准模式切换或告知我，我们将进入代码写入阶段。*
