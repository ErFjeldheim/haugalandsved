import type { ServerLoad } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/auth/login');
    }

    try {
        const records = await locals.pb.collection('orders').getFullList({
            sort: '-created'
        });

        return {
            orders: structuredClone(records)
        };
    } catch {
        return {
            orders: [],
            error: 'Kunne ikkje laste inn ordre.'
        };
    }
};
