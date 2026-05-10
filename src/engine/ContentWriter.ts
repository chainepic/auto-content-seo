import { LLMAdapter } from '../adapters/llm/index.js';

export class ContentWriter {
  constructor(private llm: LLMAdapter, private config: any) {}

  async writeAndTranslate(plan: any): Promise<{ contentZh: string, contentEn: string }> {
    const tone = this.config.blog.tone || 'professional';
    const projectName = this.config.project.name;

    const writeSystem = `You are a senior author for ${projectName}. Write the article body in Markdown format (NO YAML frontmatter).
Length: 1000-2000 words in Chinese.
Tone: ${tone}

Structure constraints:
- Start with a clear conclusion/overview
- Use ## and ### headings
- Include a short FAQ section at the end
- Mention ${projectName} naturally AT MOST ONCE in the text.

Output: Start with the H1 heading \`# ${plan.title_zh}\` and write the body.`;

    const writeUser = `Topic and Outline:
Title: ${plan.title_zh}
Category: ${plan.category_slug}
Outline:
${plan.outline_zh}

SEO Summary: ${plan.excerpt_zh}`;

    console.log('Generating Chinese content...');
    const bodyZh = await this.llm.chat([
      { role: 'system', content: writeSystem },
      { role: 'user', content: writeUser }
    ], { temperature: 0.45 });

    const translateSystem = `You are a professional translator. Translate the given Chinese Markdown into natural, fluent English Markdown.
Keep all headings and formatting intact.
Do NOT output YAML frontmatter.
Do NOT add extra mentions of ${projectName} beyond what is in the text.`;

    console.log('Translating to English...');
    const bodyEn = await this.llm.chat([
      { role: 'system', content: translateSystem },
      { role: 'user', content: bodyZh }
    ], { temperature: 0.35 });

    // Assemble Frontmatter
    const fmZh = [
      '---',
      `title: "${this.escapeYml(plan.title_zh)}"`,
      `title_en: "${this.escapeYml(plan.title_en)}"`,
      `excerpt: "${this.escapeYml(plan.excerpt_zh)}"`,
      `excerpt_en: "${this.escapeYml(plan.excerpt_en)}"`,
      `category: "${this.escapeYml(plan.category_slug)}"`,
      `tags: "${this.escapeYml(plan.tags)}"`,
      '---',
      ''
    ].join('\n');

    const fmEn = [
      '---',
      `title: "${this.escapeYml(plan.title_en)}"`,
      `title_zh: "${this.escapeYml(plan.title_zh)}"`,
      `excerpt: "${this.escapeYml(plan.excerpt_en)}"`,
      `excerpt_zh: "${this.escapeYml(plan.excerpt_zh)}"`,
      `category: "${this.escapeYml(plan.category_slug)}"`,
      `tags: "${this.escapeYml(plan.tags)}"`,
      '---',
      ''
    ].join('\n');

    return {
      contentZh: fmZh + bodyZh.trim(),
      contentEn: fmEn + bodyEn.trim(),
    };
  }

  private escapeYml(s: string) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}
