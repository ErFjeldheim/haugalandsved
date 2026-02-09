import { pb } from '$lib/pocketbase';

export const load = async () => {
    try {
        const inventory = await pb.collection('inventory').getOne('6svgilvrehzayhb');

        return {
            inventory: {
                quantity: inventory.quantity_available,
                isInStock: inventory.isInStock
            }
        };
    } catch (e) {
        console.error('Kunne ikkje laste lagerstatus:', e);
        return {
            inventory: {
                quantity: 0,
                isInStock: false
            }
        };
    }
};
