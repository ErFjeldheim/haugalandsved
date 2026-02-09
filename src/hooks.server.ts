import type { Handle } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { env as publicEnv } from '$env/dynamic/public';

export const handle: Handle = async ({ event, resolve }) => {
    // Create a per-request PocketBase instance and load auth from cookie
    event.locals.pb = new PocketBase(publicEnv.PUBLIC_PB_URL);
    event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

    try {
        // Refresh the auth token if valid (keeps session alive)
        if (event.locals.pb.authStore.isValid) {
            await event.locals.pb.collection('users').authRefresh();
        }
    } catch (_) {
        // Token refresh failed — clear stale auth
        event.locals.pb.authStore.clear();
    }

    event.locals.user = event.locals.pb.authStore.record;

    const response = await resolve(event);

    // Send back the updated pb_auth cookie to the browser
    response.headers.append(
        'set-cookie',
        event.locals.pb.authStore.exportToCookie({ httpOnly: false })
    );

    // Cache-Control for static images and assets
    if (
        event.url.pathname.startsWith('/images/') ||
        event.url.pathname.endsWith('.png') ||
        event.url.pathname.endsWith('.jpg') ||
        event.url.pathname.endsWith('.jpeg') ||
        event.url.pathname.endsWith('.webp') ||
        event.url.pathname.endsWith('.ico')
    ) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return response;
};
