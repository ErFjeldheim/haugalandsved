import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

const statuses = ['Betalt', 'Under handsaming', 'Levert', 'Avbrote'] as const;

function isAdmin(locals: App.Locals) {
	return locals.pb.authStore.isValid && locals.pb.authStore.isSuperuser;
}

function serializeOrder(order: Record<string, any>) {
	return {
		id: order.id,
		created: order.created,
		formattedDate: new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.created)),
		status: order.status || 'Ukjend',
		quantity: Number(order.quantity || 0),
		delivery_method: order.delivery_method || '',
		total_price: Number(order.total_price || 0),
		customer_name: order.customer_name || '',
		email: order.guest_email || order.expand?.user?.email || '',
		phone: order.phone || '',
		address: order.address || '',
		zip: order.zip || '',
		city: order.city || ''
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!isAdmin(locals)) throw redirect(303, '/admin/login');
	try {
		const records = await locals.pb.collection('orders').getFullList({ sort: '-created', expand: 'user' });
		return { orders: records.map(serializeOrder), statuses };
	} catch (error) {
		console.error('Kunne ikkje laste ordrar:', error);
		return { orders: [], statuses, error: 'Kunne ikkje laste ordrar.' };
	}
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		if (!isAdmin(locals)) throw redirect(303, '/admin/login');
		const data = await request.formData();
		const id = String(data.get('id') || '');
		const status = String(data.get('status') || '');
		if (!id || !statuses.includes(status as (typeof statuses)[number])) return fail(400, { error: 'Ugyldig ordrestatus.' });
		try {
			await locals.pb.collection('orders').update(id, { status });
			return { success: true };
		} catch (error) {
			console.error('Kunne ikkje oppdatere ordre:', error);
			return fail(500, { error: 'Kunne ikkje oppdatere ordren.' });
		}
	}
};
