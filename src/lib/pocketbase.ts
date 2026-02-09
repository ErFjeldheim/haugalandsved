import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

export const pb = new PocketBase(env.PUBLIC_PB_URL);

export const currentUser = writable(pb.authStore.record);

pb.authStore.onChange((_, record) => {
    currentUser.set(record);
    if (browser) {
        document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
    }
});
