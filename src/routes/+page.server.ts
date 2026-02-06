import { pb } from '$lib/pocketbase';

export const load = async () => {
    try {
        // Vi henter lagerbeholdningen fra PocketBase
        // Merk: Vi bruker ID-en '6svgilvrehzayhb' som vi opprettet tidligere
        const inventory = await pb.collection('inventory').getOne('6svgilvrehzayhb');

        return {
            inventory: {
                quantity: inventory.quantity_available,
                isInStock: inventory.isInStock
            }
        };
    } catch (e) {
        console.error('Kunne ikke laste lagerstatus:', e);
        // Ved feil antar vi at vi har lager for å unngå at siden går ned, 
        // men dette kan justeres etter behov.
        return {
            inventory: {
                quantity: 40,
                isInStock: true
            }
        };
    }
};
