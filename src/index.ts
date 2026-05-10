import { Command } from 'commander';
import path from 'node:path';
import { loadConfig } from './config/index.js';
import { createLLMAdapter } from './adapters/llm/index.js';
import { createImageAdapter } from './adapters/image/index.js';
import { createDBAdapter } from './adapters/db/index.js';
import { TopicGenerator } from './engine/TopicGenerator.js';
import { ContentWriter } from './engine/ContentWriter.js';
import { generateSitemap } from './seo/sitemap.js';
import { pushToIndexNow } from './seo/indexnow.js';
import { createNotifier } from './notification/index.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const program = new Command();

program
  .name('auto-blog-pipeline')
  .description('Universal automated blog publishing pipeline')
  .version('1.0.0');

program.command('run')
  .description('Run the full publish pipeline')
  .option('-c, --config <path>', 'Path to config file', './config.yml')
  .option('--dry-run', 'Run without saving to DB')
  .action(async (options) => {
    try {
      console.log(`Loading config from ${options.config}...`);
      const config = loadConfig(path.resolve(process.cwd(), options.config));

      const llm = createLLMAdapter(config.models.text);
      const imgAdapter = createImageAdapter(config.models.image, config.models.text);
      const db = createDBAdapter(config.output);

      console.log('Fetching recent articles for collision prevention...');
      const recent = await db.getRecentArticles(100);
      const recentTitles = recent.map(r => r.title);
      const recentSlugs = recent.map(r => r.slug);

      const topicGen = new TopicGenerator(llm, config);
      console.log('Generating topic...');
      const plan = await topicGen.generateTopic(recentTitles, recentSlugs);
      console.log('Generated Topic:', plan.title_zh, `(${plan.slug})`);

      const writer = new ContentWriter(llm, config);
      const { contentZh, contentEn } = await writer.writeAndTranslate(plan);
      
      const notifier = createNotifier(config.notifications);

      let coverUrl = null;
      if (imgAdapter && !process.env.SKIP_IMAGE) {
        console.log('Generating cover image prompt...');
        try {
          const prompt = await imgAdapter.generatePrompt(plan.title_zh, contentZh);
          console.log('Generating image...');
          const url = await imgAdapter.generateImage(prompt);
          
          // Download and convert logic
          const tmpDir = path.resolve(process.cwd(), '.tmp');
          if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
          const pngPath = path.join(tmpDir, `${plan.slug}.png`);
          const webpPath = path.join(tmpDir, `${plan.slug}.webp`);
          
          const res = await fetch(url);
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(pngPath, buf);

          // Convert to WebP (assuming cwebp is installed)
          execSync(`cwebp -q 80 "${pngPath}" -o "${webpPath}" 2>/dev/null`, { stdio: 'ignore' });
          
          console.log('Uploading image to storage...');
          coverUrl = await db.uploadImage(webpPath, `covers/${plan.slug}.webp`);
          
          fs.unlinkSync(pngPath);
          fs.unlinkSync(webpPath);
        } catch (e: any) {
          console.warn('Image generation/upload failed, skipping cover:', e.message);
        }
      }

      const nowIso = new Date().toISOString();
      const locGroup = crypto.randomUUID();

      const articleZh = {
        title: plan.title_zh,
        slug: plan.slug,
        content: contentZh,
        excerpt: plan.excerpt_zh || null,
        cover_image_url: coverUrl,
        seo_title: plan.seo_title_zh || plan.title_zh,
        seo_description: plan.seo_description_zh || plan.excerpt_zh,
        tags: plan.tags,
        category_slug: plan.category_slug,
        locale: 'zh-CN',
        localization_group: locGroup,
        published_at: nowIso,
        updated_at: nowIso,
      };

      const articleEn = {
        title: plan.title_en,
        slug: plan.slug,
        content: contentEn,
        excerpt: plan.excerpt_en || null,
        cover_image_url: coverUrl,
        seo_title: plan.seo_title_en || plan.title_en,
        seo_description: plan.seo_description_en || plan.excerpt_en,
        tags: plan.tags,
        category_slug: plan.category_slug,
        locale: 'en',
        localization_group: locGroup,
        published_at: nowIso,
        updated_at: nowIso,
      };

      if (options.dryRun) {
        console.log('\n--- DRY RUN: Result preview ---');
        console.log('ZH:', articleZh.title, articleZh.content.substring(0, 150) + '...');
        console.log('EN:', articleEn.title, articleEn.content.substring(0, 150) + '...');
        return;
      }

      console.log('Saving to DB...');
      await db.saveArticle(articleZh);
      await db.saveArticle(articleEn);
      
      console.log('Running Post-Publish Actions (SEO)...');
      try {
        const domain = config.project.domain || 'https://example.com';
        const sitemapPath = path.resolve(process.cwd(), 'sitemap.xml');
        
        await generateSitemap(domain, ['/', '/blog'], db, sitemapPath);
        await pushToIndexNow(domain, sitemapPath, process.cwd());
      } catch (e: any) {
        console.warn('SEO post-publish steps failed:', e.message);
      }

      console.log('Sending Notifications...');
      const msg = `✅ <b>Auto-Blog Published</b>\n\n<b>Title:</b> ${plan.title_zh}\n<b>Slug:</b> ${plan.slug}\n<b>Cover:</b> ${coverUrl ? 'Yes' : 'No'}`;
      await notifier.send(msg);

      console.log('Pipeline finished successfully!');
      
    } catch (e: any) {
      console.error('Pipeline failed:', e.message);
      process.exit(1);
    }
  });

program.parse();
