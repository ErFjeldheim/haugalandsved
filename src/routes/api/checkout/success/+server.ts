import { error, redirect } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

export const GET = async ({ url }) => {
    const sessionId = url.searchParams.get('session_id');
    const paymentIntentId = url.searchParams.get('payment_intent_id') || url.searchParams.get('payment_intent');

    if (!sessionId && !paymentIntentId) {
        throw error(400, 'Manglar session_id eller payment_intent_id');
    }

    try {
        let metadata: any;
        let customerEmail: string | undefined | null;
        let paymentStatus: string;

        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            metadata = session.metadata;
            customerEmail = session.customer_details?.email;
            paymentStatus = session.payment_status === 'paid' ? 'paid' : 'failed';
        } else {
            const intent = await stripe.paymentIntents.retrieve(paymentIntentId!);
            metadata = intent.metadata;
            customerEmail = intent.receipt_email || metadata.customer_email; // PaymentIntents might not have receipt_email yet
            paymentStatus = intent.status === 'succeeded' ? 'paid' : 'failed';

            // For PaymentIntents via Express Checkout, we might need to get the email from the charge
            if (!customerEmail && intent.latest_charge) {
                const charge = await stripe.charges.retrieve(intent.latest_charge as string);
                customerEmail = charge.billing_details.email;
            }
        }

        if (paymentStatus === 'paid') {
            const { userId, quantity, deliveryMethod, totalPrice } = metadata || {};

            // Vi bruker en ny PB-instans for server-side operasjoner
            const pb = new PocketBase('https://db.haugalandsved.no');

            // Opprett ordren i PocketBase
            const order = await pb.collection('orders').create({
                user: userId || null,
                guest_email: !userId ? customerEmail : null,
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
                if (customerEmail) {
                    const { sendOrderConfirmation, sendAdminNotification } = await import('$lib/server/mail');

                    // Send til kunde
                    await sendOrderConfirmation(customerEmail, {
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
                        customerEmail: customerEmail
                    });
                } else {
                    console.warn('Ingen e-postadresse funnet i Stripe for ordre:', order.id);
                }
            } catch (mailErr) {
                console.error('Kunne ikke sende ordrebekreftelse:', mailErr);
            }

            throw redirect(303, '/checkout/success');
        }

        throw error(400, 'Betalinga vart ikkje fullført');
    } catch (err: any) {
        if (err.status === 303) throw err;
        console.error('Success handler error:', err);
        throw error(500, 'Kunne ikkje stadfesta ordren');
    }
};
