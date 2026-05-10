import { LLMAdapter } from '../adapters/llm/index.js';

export class TopicGenerator {
  constructor(private llm: LLMAdapter, private config: any) {}

  async generateTopic(recentTitles: string[], recentSlugs: string[]): Promise<any> {
    const categories = this.config.blog.categories.join(', ');
    const forbidden = this.config.blog.forbidden_keywords.join(', ');
    
    const systemPrompt = `You are a senior blog editor for ${this.config.project.name}. Please output valid JSON only.
Propose a NEW article topic that is distinctly different from existing titles and slugs.
Category slug MUST be one of: ${categories}

Forbidden keywords/topics:
${forbidden}

JSON fields:
- title_zh, title_en: Article title
- slug: kebab-case string (a-z0-9 and hyphens only)
- category_slug: one of the allowed categories
- tags: comma separated keywords
- excerpt_zh, excerpt_en: 1-2 sentence summary
- seo_title_zh, seo_description_zh, seo_title_en, seo_description_en: SEO metadata
- outline_zh: 4-6 bullet points for the article structure (in Chinese)`;

    const userPrompt = `Existing titles (DO NOT REPEAT):
${recentTitles.slice(0, 45).join('\n') || '(None)'}

Existing slugs (DO NOT REPEAT):
${recentSlugs.slice(0, 80).join(', ') || '(None)'}

Today's date: ${new Date().toISOString().slice(0, 10)}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const rawJson = await this.llm.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], { temperature: 0.6, jsonMode: true });
        
        let cleaned = rawJson.trim();
        const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(cleaned);
        if (fence) cleaned = fence[1].trim();

        const plan = JSON.parse(cleaned);
        if (!recentSlugs.includes(plan.slug)) {
          return plan;
        }
        console.warn(`Attempt ${attempt}: Slug ${plan.slug} already exists. Retrying...`);
      } catch (err) {
        console.warn(`Attempt ${attempt} failed to parse JSON or call LLM:`, err);
      }
    }
    throw new Error('Failed to generate a unique topic after 3 attempts.');
  }
}
