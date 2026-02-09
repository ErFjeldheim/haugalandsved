import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import { env } from '$env/dynamic/public';

export const pb = new PocketBase(env.PUBLIC_PB_URL);

export const currentUser = writable(pb.authStore.record);

pb.authStore.onChange((auth) => {
    console.log('authStore changed', auth);
    currentUser.set(pb.authStore.record);
});
