import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);

    // Add Cache-Control header for static images and assets
    if (event.url.pathname.startsWith('/images/') ||
        event.url.pathname.endsWith('.png') ||
        event.url.pathname.endsWith('.jpg') ||
        event.url.pathname.endsWith('.jpeg') ||
        event.url.pathname.endsWith('.webp') ||
        event.url.pathname.endsWith('.ico')) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return response;
};
