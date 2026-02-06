export async function GET() {
    const site = 'https://haugalandsved.no';

    const pages = [
        { path: '/', priority: 1.0, changefreq: 'weekly' },
        { path: '/personvern', priority: 0.3, changefreq: 'yearly' },
        { path: '/salgsvilkar', priority: 0.3, changefreq: 'yearly' }
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8" ?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>
  ${pages
            .map(
                (page) => `
  <url>
    <loc>${site}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  `
            )
            .join('')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
}
