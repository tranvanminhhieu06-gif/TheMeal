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

// Load views and product data
const views = require('../src/views');
const { products } = require('../src/products');

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
writePage('index.html', views.home());
writePage('san-pham/index.html', views.productList());
writePage('san-pham.html', views.productList());

for (const p of products) {
  writePage(`san-pham/${p.slug}/index.html`, views.productPage(p));
  writePage(`san-pham/${p.slug}.html`, views.productPage(p));
}

writePage('gio-hang/index.html', views.cartPage());
writePage('gio-hang.html', views.cartPage());
writePage('thanh-toan/index.html', views.checkoutPage());
writePage('thanh-toan.html', views.checkoutPage());
writePage('dat-hang/thanh-cong/index.html', views.successPage(null));
writePage('dat-hang/thanh-cong.html', views.successPage(null));
writePage('lien-he/index.html', views.contactPage());
writePage('lien-he.html', views.contactPage());
writePage('hop-tac/index.html', views.partnerPage());
writePage('hop-tac.html', views.partnerPage());
writePage('tin-tuc/index.html', views.newsPage());
writePage('tin-tuc.html', views.newsPage());

for (const pol of views.POLICIES) {
  const page = views.policyPage(pol.slug);
  if (page) {
    writePage(`chinh-sach/${pol.slug}/index.html`, page);
    writePage(`chinh-sach/${pol.slug}.html`, page);
  }
}

writePage('admin/index.html', views.staticAdminPage());
writePage('admin.html', views.staticAdminPage());
writePage('404.html', views.notFound());

// 4. Sitemap (nộp trong Google Search Console: <SITE_URL><BASE_PATH>/sitemap.xml)
const sitemapPaths = ['/', '/san-pham', ...products.map(p => '/san-pham/' + p.slug), '/hop-tac', '/lien-he', '/tin-tuc', ...views.POLICIES.map(p => '/chinh-sach/' + p.slug)];
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
