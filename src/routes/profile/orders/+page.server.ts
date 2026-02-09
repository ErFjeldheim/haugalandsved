import type { ServerLoad } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

function formatDateNynorsk(dateStr: string): string {
    if (!dateStr) return 'Ukjent dato';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Ukjent dato';
    return new Intl.DateTimeFormat('nn-NO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatPriceNynorsk(price: number): string {
    return new Intl.NumberFormat('nn-NO').format(price) + ' kr';
}

export const load: ServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/auth/login');
    }

    try {
        const records = await locals.pb.collection('orders').getFullList({
            sort: '-created'
        });

        const orders = records.map((r) => ({
            id: r.id,
            status: r.status as string,
            quantity: r.quantity as number,
            delivery_method: r.delivery_method as string,
            total_price: r.total_price as number,
            formattedDate: formatDateNynorsk(r.created),
            formattedPrice: formatPriceNynorsk(r.total_price as number)
        }));

        return { orders };
    } catch {
        return {
            orders: [],
            error: 'Kunne ikkje laste inn ordre.'
        };
    }
};
