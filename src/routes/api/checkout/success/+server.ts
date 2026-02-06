import { error, redirect } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

export const GET = async ({ url }) => {
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
        throw error(400, 'Mangler session_id');
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const { userId, quantity, deliveryMethod, totalPrice } = session.metadata || {};

            // Vi bruker en ny PB-instans for server-side operasjoner
            const pb = new PocketBase('https://db.haugalandsved.no');

            // Opprett ordren i PocketBase
            const order = await pb.collection('orders').create({
                user: userId,
                quantity: Number(quantity),
                delivery_method: deliveryMethod,
                total_price: Number(totalPrice),
                status: 'Betalt'
            });

            // Oppdater lagerbeholdning
            try {
                const inventoryId = '6svgilvrehzayhb';

                // Vi må logge inn som admin for å kunne oppdatere lageret fra serveren
                if (env.PB_ADMIN_EMAIL && env.PB_ADMIN_PASSWORD) {
                    await pb.admins.authWithPassword(env.PB_ADMIN_EMAIL, env.PB_ADMIN_PASSWORD);

                    const inventory = await pb.collection('inventory').getOne(inventoryId);
                    const newQuantity = Math.max(0, inventory.quantity_available - Number(quantity));

                    console.log(`Oppdaterer lager: ${inventory.quantity_available} -> ${newQuantity}`);

                    await pb.collection('inventory').update(inventoryId, {
                        quantity_available: newQuantity
                    });
                } else {
                    console.error('PB_ADMIN_EMAIL eller PB_ADMIN_PASSWORD mangler i .env');
                }
            } catch (invErr) {
                console.error('Kunne ikke oppdatere lagerbeholdning:', invErr);
            }

            // Send ordrebekreftelse på e-post
            try {
                const userEmail = session.customer_details?.email;

                if (userEmail) {
                    const { sendOrderConfirmation, sendAdminNotification } = await import('$lib/server/mail');

                    // Send til kunde
                    await sendOrderConfirmation(userEmail, {
                        id: order.id,
                        quantity: Number(quantity),
                        deliveryMethod: String(deliveryMethod),
                        totalPrice: Number(totalPrice)
                    });

                    // Send til produkteierne (Norleif og Erik)
                    await sendAdminNotification({
                        id: order.id,
                        quantity: Number(quantity),
                        deliveryMethod: String(deliveryMethod),
                        totalPrice: Number(totalPrice),
                        customerEmail: userEmail
                    });
                } else {
                    console.warn('Ingen e-postadresse funnet i Stripe-sesjonen for ordre:', order.id);
                }
            } catch (mailErr) {
                console.error('Kunne ikke sende ordrebekreftelse:', mailErr);
            }

            throw redirect(303, '/profile/orders');
        }

        throw error(400, 'Betalingen ble ikke fullført');
    } catch (err: any) {
        if (err.status === 303) throw err;
        console.error('Success handler error:', err);
        throw error(500, 'Kunne ikke bekrefte ordren');
    }
};
