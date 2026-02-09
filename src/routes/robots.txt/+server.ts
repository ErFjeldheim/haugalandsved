export async function GET() {
    const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/
Disallow: /profile/
Disallow: /checkout/
Disallow: /api/

Sitemap: https://haugalandsved.no/sitemap.xml`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
}
