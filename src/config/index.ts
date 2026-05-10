import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { z } from 'zod';

const configSchema = z.object({
  project: z.object({
    name: z.string(),
    domain: z.string().default('https://example.com'),
    locale: z.string().default('zh-CN'),
  }),
  blog: z.object({
    categories: z.array(z.string()),
    tone: z.string().default('professional'),
    forbidden_keywords: z.array(z.string()).default([]),
  }),
  models: z.object({
    text: z.object({
      provider: z.enum(['deepseek', 'openai', 'claude', 'qwen']),
      api_key: z.string().min(1, "API Key is required"),
      model: z.string(),
      base_url: z.string().optional(),
    }),
    image: z.object({
      provider: z.enum(['wanx', 'dall-e']).optional(),
      api_key: z.string().optional(),
    }).optional(),
  }),
  output: z.object({
    type: z.enum(['supabase', 'mysql', 'sqlite', 'markdown']),
    supabase_url: z.string().optional(),
    supabase_key: z.string().optional(),
    db_host: z.string().optional(),
    db_user: z.string().optional(),
    db_pass: z.string().optional(),
    db_name: z.string().optional(),
    markdown_dir: z.string().optional(),
  }),
  notifications: z.object({
    telegram: z.object({
      enabled: z.boolean().default(false),
      bot_token: z.string().optional(),
      chat_id: z.string().optional(),
    }).optional(),
    discord: z.object({
      enabled: z.boolean().default(false),
      webhook_url: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(configPath: string): Config {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }
  let fileContent = fs.readFileSync(configPath, 'utf8');
  
  // Replace env vars like ${ENV_VAR}
  fileContent = fileContent.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
    return process.env[envVar] || '';
  });

  const parsedYaml = yaml.parse(fileContent);
  return configSchema.parse(parsedYaml);
}
