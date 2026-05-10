import fs from 'node:fs';

export async function generateSitemap(domain: string, staticPaths: string[], dbAdapter: any, destPath: string) {
  const today = new Date().toISOString().slice(0, 10);
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static paths
  for (const p of staticPaths) {
    const prio = p === '/' ? '1.0' : '0.8';
    const freq = p === '/' ? 'daily' : 'weekly';
    xml += `  <url>
    <loc>${domain}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>\n`;
  }

  // 2. Dynamic DB paths
  // Assume dbAdapter has a getRecentArticles that returns large limit (e.g. 1000)
  try {
    const articles = await dbAdapter.getRecentArticles(1000);
    for (const art of articles) {
      // In a real generic system, locale prefix mapping should be configurable
      const locPath = art.locale === 'zh-CN' ? `/zh/blog/${art.slug}` : `/en/blog/${art.slug}`;
      xml += `  <url>
    <loc>${domain}${locPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    }
  } catch (e) {
    console.warn('Failed to fetch DB articles for sitemap', e);
  }

  xml += `</urlset>\n`;
  
  fs.writeFileSync(destPath, xml, 'utf8');
  console.log(`Sitemap generated at ${destPath}`);
}
