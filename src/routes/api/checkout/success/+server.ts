import { error, redirect } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const INVENTORY_ID = '6svgilvrehzayhb';

/**
 * Autentiser ein server-side PocketBase-instans som superbrukar.
 * PB SDK 0.23+ brukar `_superusers`-samlinga i staden for utdatert `pb.admins`.
 */
async function getAdminPb(): Promise<PocketBase> {
    const pb = new PocketBase(publicEnv.PUBLIC_PB_URL);
    if (!env.PB_ADMIN_EMAIL || !env.PB_ADMIN_PASSWORD) {
        throw new Error('PB_ADMIN_EMAIL eller PB_ADMIN_PASSWORD manglar i miljøvariablar');
    }
    await pb.collection('_superusers').authWithPassword(env.PB_ADMIN_EMAIL, env.PB_ADMIN_PASSWORD);
    return pb;
}

export const GET = async ({ url }: { url: URL }) => {
    const sessionId = url.searchParams.get('session_id');
    const paymentIntentId = url.searchParams.get('payment_intent_id') || url.searchParams.get('payment_intent');

    if (!sessionId && !paymentIntentId) {
        throw error(400, 'Manglar session_id eller payment_intent_id');
    }

    try {
        let metadata: Record<string, string>;
        let customerEmail: string | undefined | null;
        let customerName: string | undefined | null;
        let customerPhone: string | undefined | null;
        let address: string | undefined | null;
        let zip: string | undefined | null;
        let city: string | undefined | null;
        let paymentStatus: string;

        if (sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            metadata = (session.metadata ?? {}) as Record<string, string>;
            customerEmail = session.customer_details?.email;
            customerName = session.customer_details?.name;
            customerPhone = session.customer_details?.phone;

            const shippingAddress = session.collected_information?.shipping_details?.address;
            const customerAddress = session.customer_details?.address;

            if (shippingAddress) {
                address = shippingAddress.line1;
                zip = shippingAddress.postal_code;
                city = shippingAddress.city;
            } else if (customerAddress) {
                address = customerAddress.line1;
                zip = customerAddress.postal_code;
                city = customerAddress.city;
            }

            paymentStatus = session.payment_status === 'paid' ? 'paid' : 'failed';
        } else {
            const intent = await stripe.paymentIntents.retrieve(paymentIntentId!);
            metadata = (intent.metadata ?? {}) as Record<string, string>;
            customerEmail = intent.receipt_email || metadata.customer_email;
            paymentStatus = intent.status === 'succeeded' ? 'paid' : 'failed';

            // Express Checkout fallback: email may only exist on the charge object
            if (!customerEmail && intent.latest_charge) {
                const charge = await stripe.charges.retrieve(intent.latest_charge as string);
                customerEmail = charge.billing_details.email;
            }
        }

        if (paymentStatus !== 'paid') {
            throw error(400, 'Betalinga vart ikkje fullført');
        }

        const { userId, quantity, deliveryMethod, totalPrice } = metadata;

        const pb = await getAdminPb();

        const order = await pb.collection('orders').create({
            user: userId || null,
            guest_email: !userId ? customerEmail : null,
            quantity: Number(quantity),
            delivery_method: deliveryMethod,
            total_price: Number(totalPrice),
            status: 'Betalt',
            customer_name: customerName,
            phone: customerPhone,
            address: address,
            zip: zip,
            city: city
        });

        const MAX_RETRIES = 3;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const inventory = await pb.collection('inventory').getOne(INVENTORY_ID);
                const currentQty = inventory.quantity_available;
                const newQuantity = Math.max(0, currentQty - Number(quantity));

                console.log(`Oppdaterer lager (forsøk ${attempt + 1}): ${currentQty} -> ${newQuantity}`);

                await pb.collection('inventory').update(INVENTORY_ID, {
                    quantity_available: newQuantity
                });

                break;
            } catch (invErr) {
                if (attempt === MAX_RETRIES - 1) {
                    console.error('Kunne ikkje oppdatere lagerbehaldning etter fleire forsøk:', invErr);
                }
                await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
            }
        }

        try {
            if (customerEmail) {
                const { sendOrderConfirmation, sendAdminNotification } = await import('$lib/server/mail');

                await sendOrderConfirmation(customerEmail, {
                    id: order.id,
                    quantity: Number(quantity),
                    deliveryMethod: String(deliveryMethod),
                    totalPrice: Number(totalPrice),
                    customerName: customerName || undefined,
                    address: address || undefined,
                    zip: zip || undefined,
                    city: city || undefined
                });

                await sendAdminNotification({
                    id: order.id,
                    quantity: Number(quantity),
                    deliveryMethod: String(deliveryMethod),
                    totalPrice: Number(totalPrice),
                    customerEmail: customerEmail,
                    customerName: customerName || undefined,
                    customerPhone: customerPhone || undefined,
                    address: address || undefined,
                    zip: zip || undefined,
                    city: city || undefined
                });
            } else {
                console.warn('Ingen e-postadresse funnen i Stripe for ordre:', order.id);
            }
        } catch (mailErr) {
            console.error('Kunne ikkje sende ordrestadfesting:', mailErr);
        }

        throw redirect(303, '/checkout/success');
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 303) throw err;
        console.error('Success handler error:', err);
        throw error(500, 'Kunne ikkje stadfesta ordren');
    }
};
