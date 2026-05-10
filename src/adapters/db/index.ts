export interface DBAdapter {
  getRecentArticles(limit: number): Promise<{ title: string; slug: string }[]>;
  saveArticle(article: any): Promise<void>;
  uploadImage(localPath: string, destPath: string): Promise<string>;
}

export function createDBAdapter(config: any): DBAdapter {
  switch (config.type) {
    case 'supabase':
      return new SupabaseAdapter(config);
    case 'markdown':
      return new MarkdownAdapter(config);
    default:
      throw new Error(`Unsupported DB adapter: ${config.type}`);
  }
}

class SupabaseAdapter implements DBAdapter {
  private client: any;

  constructor(config: any) {
    const { createClient } = require('@supabase/supabase-js');
    this.client = createClient(config.supabase_url, config.supabase_key);
  }

  async getRecentArticles(limit: number): Promise<{ title: string; slug: string }[]> {
    const { data, error } = await this.client
      .from('blog_articles')
      .select('title, slug')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw new Error(`Supabase getRecentArticles: ${error.message}`);
    return data || [];
  }

  async saveArticle(article: any): Promise<void> {
    const { error } = await this.client.from('blog_articles').upsert(article, {
      onConflict: 'slug,locale',
    });
    if (error) throw new Error(`Supabase saveArticle: ${error.message}`);
  }

  async uploadImage(localPath: string, destPath: string): Promise<string> {
    const fs = require('fs');
    const buf = fs.readFileSync(localPath);
    const { error } = await this.client.storage
      .from('blog-covers')
      .upload(destPath, buf, {
        contentType: 'image/webp',
        upsert: true,
      });
    if (error) throw new Error(`Supabase uploadImage: ${error.message}`);
    
    const { data } = this.client.storage.from('blog-covers').getPublicUrl(destPath);
    return data.publicUrl;
  }
}

class MarkdownAdapter implements DBAdapter {
  private dir: string;

  constructor(config: any) {
    this.dir = config.markdown_dir || './output';
    const fs = require('fs');
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  async getRecentArticles(limit: number): Promise<{ title: string; slug: string }[]> {
    const fs = require('fs');
    if (!fs.existsSync(this.dir)) return [];
    const files = fs.readdirSync(this.dir).filter((f: string) => f.endsWith('.md'));
    return files.map((f: string) => ({ title: f, slug: f.replace('.md', '') })).slice(0, limit);
  }

  async saveArticle(article: any): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const dest = path.join(this.dir, `${article.slug}-${article.locale}.md`);
    fs.writeFileSync(dest, article.content);
  }

  async uploadImage(localPath: string, destPath: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const destDir = path.join(this.dir, 'images');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    
    const dest = path.join(destDir, path.basename(destPath));
    fs.copyFileSync(localPath, dest);
    return `/images/${path.basename(destPath)}`; // Return relative path for MD
  }
}
