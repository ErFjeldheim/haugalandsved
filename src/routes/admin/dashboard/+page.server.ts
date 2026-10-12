import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

const statuses = ['Betalt', 'Under handsaming', 'Levert', 'Avbrote'] as const;

function parsePocketBaseDate(value: string) {
	const normalized = value?.includes('T') ? value : value?.replace(' ', 'T');
	return new Date(normalized);
}

function isAdmin(locals: App.Locals) {
	return locals.pb.authStore.isValid && locals.pb.authStore.isSuperuser;
}

function orderDateValue(order: Record<string, any>) {
	return order.ordered_at || order.created || order.created_at;
}

function serializeOrder(order: Record<string, any>) {
	const rawCreated = orderDateValue(order);
	const timestamp = parsePocketBaseDate(rawCreated);
	return {
		id: order.id,
		created: rawCreated,
		timestamp: Number.isNaN(timestamp.getTime()) ? null : timestamp.getTime(),
		formattedDate: Number.isNaN(timestamp.getTime())
			? 'Ukjend dato'
			: new Intl.DateTimeFormat('nn-NO', { dateStyle: 'medium', timeStyle: 'short' }).format(
					timestamp
				),
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
		const records = await locals.pb.collection('orders').getFullList({ expand: 'user' });
		records.sort((a, b) => {
			const timeA = parsePocketBaseDate(orderDateValue(a)).getTime();
			const timeB = parsePocketBaseDate(orderDateValue(b)).getTime();
			const unknownA = Number.isNaN(timeA);
			const unknownB = Number.isNaN(timeB);
			if (unknownA && unknownB) return 0;
			if (unknownA) return 1;
			if (unknownB) return -1;
			return timeB - timeA;
		});
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
		if (!id || !statuses.includes(status as (typeof statuses)[number]))
			return fail(400, { error: 'Ugyldig ordrestatus.' });
		try {
			await locals.pb.collection('orders').update(id, { status });
			return { success: true };
		} catch (error) {
			console.error('Kunne ikkje oppdatere ordre:', error);
			return fail(500, { error: 'Kunne ikkje oppdatere ordren.' });
		}
	},
	deleteOrder: async ({ request, locals }) => {
		if (!isAdmin(locals)) throw redirect(303, '/admin/login');
		const id = String((await request.formData()).get('id') || '');
		if (!id) return fail(400, { error: 'Ugyldig ordre.' });
		try {
			await locals.pb.collection('orders').delete(id);
			return { success: true, deletedOrderId: id };
		} catch (error) {
			console.error('Kunne ikkje slette ordre:', error);
			return fail(500, { error: 'Kunne ikkje slette ordren.' });
		}
	}
};
