// scripts/build-static.js — Export static HTML & assets for GitHub Pages
const fs = require('fs');
const path = require('path');

// GitHub Pages với domain riêng: https://phinfit.com/ (file CNAME ở thư mục gốc).
// Domain riêng phục vụ từ gốc nên BASE_PATH rỗng. Quay lại github.io: BASE_PATH=/TheMeal SITE_URL=https://tranvanminhhieu06-gif.github.io
const CUSTOM_DOMAIN = 'phinfit.com';
process.env.BASE_PATH = process.env.BASE_PATH ?? '';
process.env.SITE_URL = process.env.SITE_URL || 'https://' + CUSTOM_DOMAIN;
process.env.NODE_ENV = 'production';

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

// Load views and the published content (same as the live server)
const views = require('../src/views');
const store = require('../src/store');
const content = store.published();
const { products } = content;

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function writePage(relPath, htmlContent) {
  const fullPath = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, htmlContent, 'utf8');
  console.log('✓ Generated:', relPath);
}

console.log('Building static site with BASE_PATH =', process.env.BASE_PATH);

// 1. Copy public assets to root for GitHub Pages
const assetFolders = ['css', 'fonts', 'img', 'js'];
for (const folder of assetFolders) {
  const src = path.join(PUBLIC_DIR, folder);
  const dest = path.join(ROOT, folder);
  if (fs.existsSync(src)) {
    copyDirSync(src, dest);
    console.log('✓ Copied assets:', folder);
  }
}
if (fs.existsSync(path.join(PUBLIC_DIR, 'favicon.svg'))) {
  fs.copyFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), path.join(ROOT, 'favicon.svg'));
  console.log('✓ Copied favicon.svg');
}

// 2. Create .nojekyll + CNAME (domain riêng; chỉ ghi khi build cho domain đó)
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '', 'utf8');
console.log('✓ Created .nojekyll');
if (process.env.SITE_URL === 'https://' + CUSTOM_DOMAIN) {
  fs.writeFileSync(path.join(ROOT, 'CNAME'), CUSTOM_DOMAIN + '\n', 'utf8');
  console.log('✓ Created CNAME:', CUSTOM_DOMAIN);
}

// 3. Generate pages
const both = (p, html) => { if (p === '/') return writePage('index.html', html); const rel = p.slice(1); writePage(rel + '/index.html', html); writePage(rel + '.html', html); };
for (const pg of content.pages) both(pg.path, views.page(content, pg));
for (const p of products) both('/san-pham/' + p.slug, views.productPage(content, p));
both('/gio-hang', views.cartPage(content));
both('/thanh-toan', views.checkoutPage(content));
both('/dat-hang/thanh-cong', views.successPage(content, null));
both('/admin', views.staticAdminPage(content));
writePage('404.html', views.notFound(content));
if (fs.existsSync(path.join(store.DATA, 'uploads'))) { copyDirSync(path.join(store.DATA, 'uploads'), path.join(ROOT, 'uploads')); console.log('✓ Copied uploads'); }

// 4. Sitemap (nộp trong Google Search Console: <SITE_URL><BASE_PATH>/sitemap.xml)
const sitemapPaths = [...content.pages.filter(p => !p.noindex).map(p => p.path), ...products.map(p => '/san-pham/' + p.slug)];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapPaths.map(u => `  <url><loc>${views.abs(u)}</loc></url>`),
  '</urlset>', ''
].join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log('✓ Generated: sitemap.xml');
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nDisallow: ${views.u('/admin')}\nDisallow: ${views.u('/gio-hang')}\nDisallow: ${views.u('/thanh-toan')}\nSitemap: ${views.abs('/sitemap.xml')}\n`, 'utf8');
console.log('✓ Generated: robots.txt');

console.log('Static build completed successfully!');
