import type { Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import { pb } from '$lib/pocketbase';

// SECURITY: Prisar MÅ vera server-side – klienten kan ikkje påverke dei
const PRICE_PER_SACK = 1190;
const STANDARD_DELIVERY_PRICE_PER_PALLET = 300;
const EXPRESS_DELIVERY_PRICE_PER_3 = 1000;
const MAX_QUANTITY = 9;

const VALID_DELIVERY_METHODS = ['pickup', 'standard', 'express'] as const;
type DeliveryMethod = (typeof VALID_DELIVERY_METHODS)[number];

function calculateTotal(quantity: number, deliveryMethod: DeliveryMethod) {
    const woodCost = quantity * PRICE_PER_SACK;
    const shippingCost =
        deliveryMethod === 'pickup'
            ? 0
            : deliveryMethod === 'express'
                ? Math.ceil(quantity / 3) * EXPRESS_DELIVERY_PRICE_PER_3
                : quantity * STANDARD_DELIVERY_PRICE_PER_PALLET;
    return { woodCost, shippingCost, total: woodCost + shippingCost };
}

export const actions: Actions = {
    default: async ({ request, url, cookies }) => {
        const data = await request.formData();
        const quantity = Number(data.get('quantity'));
        const deliveryMethod = data.get('deliveryMethod') as string;
        const email = data.get('email');

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
            throw error(400, `Ugyldig tal: må vera mellom 1 og ${MAX_QUANTITY}`);
        }

        if (!VALID_DELIVERY_METHODS.includes(deliveryMethod as DeliveryMethod)) {
            throw error(400, 'Ugyldig leveringsmetode');
        }

        try {
            const inventory = await pb.collection('inventory').getOne('6svgilvrehzayhb');
            if (!inventory.isInStock || inventory.quantity_available < quantity) {
                throw error(400, 'Ikkje nok varer på lager');
            }
        } catch (err: any) {
            if (err.status === 400) throw err;
            console.error('Kunne ikkje sjekke lagerbehaldning:', err);
        }

        const { total: totalPrice } = calculateTotal(quantity, deliveryMethod as DeliveryMethod);

        const pbAuthCookie = cookies.get('pb_auth');
        let userId = '';
        if (pbAuthCookie) {
            try {
                const parsed = JSON.parse(pbAuthCookie);
                userId = parsed?.record?.id || parsed?.model?.id || '';
            } catch { /* gjestekjøp */ }
        }

        let checkoutUrl: string;

        try {
            const session = await stripe.checkout.sessions.create({
                customer_email: email ? String(email) : undefined,
                line_items: [
                    {
                        price_data: {
                            currency: 'nok',
                            product_data: {
                                name: 'Blandingsved, 1000L storsekk',
                                description: `${quantity} stk. (${deliveryMethod === 'pickup' ? 'Hent sjølv' : deliveryMethod === 'express' ? 'Ekspress levering' : 'Standard levering'})`,
                            },
                            unit_amount: PRICE_PER_SACK * 100,
                        },
                        quantity: quantity,
                    },
                    ...(deliveryMethod !== 'pickup'
                        ? [
                            {
                                price_data: {
                                    currency: 'nok',
                                    product_data: {
                                        name: deliveryMethod === 'express' ? 'Ekspress levering' : 'Standard levering',
                                    },
                                    unit_amount:
                                        deliveryMethod === 'express'
                                            ? EXPRESS_DELIVERY_PRICE_PER_3 * 100
                                            : STANDARD_DELIVERY_PRICE_PER_PALLET * 100,
                                },
                                quantity:
                                    deliveryMethod === 'express'
                                        ? Math.ceil(quantity / 3)
                                        : quantity,
                            },
                        ]
                        : []),
                ],
                mode: 'payment',
                success_url: `${url.origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${url.origin}/#kalkulator`,
                metadata: {
                    userId,
                    quantity: String(quantity),
                    deliveryMethod: String(deliveryMethod),
                    totalPrice: String(totalPrice)
                }
            });

            if (!session.url) {
                throw error(500, 'Kunne ikkje opprette Stripe-sesjon');
            }
            checkoutUrl = session.url;
        } catch (err: any) {
            if (err.status) throw err;
            console.error('Stripe error:', err);
            throw error(500, 'Noko gjekk gale med betalinga');
        }

        throw redirect(303, checkoutUrl);
    }
};
