import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import { PUBLIC_PB_URL } from '$app/env/public';
import { browser } from '$app/env';

export const pb = new PocketBase(PUBLIC_PB_URL);

export const currentUser = writable(pb.authStore.record);

pb.authStore.onChange((_, record) => {
	currentUser.set(record);
	if (browser) {
		document.cookie = pb.authStore.exportToCookie({
			httpOnly: false,
			secure: window.location.protocol === 'https:',
			sameSite: 'lax',
			path: '/'
		});
	}
});
