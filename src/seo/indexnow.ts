import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export async function pushToIndexNow(domain: string, sitemapPath: string, keyFileDir: string) {
  console.log('Pushing to IndexNow...');
  
  if (!fs.existsSync(sitemapPath)) {
    throw new Error(`Sitemap not found at ${sitemapPath}`);
  }

  // Parse sitemap simple way (regex) since it's just extracting URLs
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const urls: string[] = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(sitemapXml)) !== null) {
    urls.push(match[1]);
  }

  console.log(`Found ${urls.length} URLs in sitemap`);

  let key = '';
  const keyFiles = fs.readdirSync(keyFileDir).filter(f => f.endsWith('.txt') && f.length > 20);
  if (keyFiles.length > 0) {
    key = keyFiles[0].replace('.txt', '');
  } else {
    key = crypto.randomUUID().replace(/-/g, '');
    fs.writeFileSync(path.join(keyFileDir, `${key}.txt`), key);
    console.log(`Generated new IndexNow key: ${key}`);
  }

  const BATCH_SIZE = 100;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const payload = {
      host: domain.replace(/^https?:\/\//, ''),
      key: key,
      keyLocation: `${domain}/${key}.txt`,
      urlList: batch
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    });

    console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} URLs -> HTTP ${res.status}`);
  }
  
  console.log('IndexNow push complete.');
}
