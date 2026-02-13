import type { Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import PocketBase from 'pocketbase';
import { env as publicEnv } from '$env/dynamic/public';

const DEFAULT_STANDARD_PRICE = 1490;
const STANDARD_DELIVERY_PRICE_PER_PALLET = 300;
const EXPRESS_DELIVERY_PRICE_PER_3 = 1000;
const MAX_QUANTITY = 9;

async function getActiveCampaignPrice(pb: PocketBase): Promise<{ price: number; standardPrice: number }> {
    try {
        const campaigns = await pb.collection('campaigns').getFullList({
            filter: 'isActive = true',
            sort: '-created',
            requestKey: null
        });
        const now = new Date();
        const active = campaigns.find((c) => new Date(c.endDate) >= now);
        if (active) {
            return { price: active.campaignPrice, standardPrice: active.standardPrice };
        }
    } catch {
    }
    return { price: DEFAULT_STANDARD_PRICE, standardPrice: DEFAULT_STANDARD_PRICE };
}

const VALID_DELIVERY_METHODS = ['pickup', 'standard', 'express'] as const;
type DeliveryMethod = (typeof VALID_DELIVERY_METHODS)[number];

function calculateTotal(quantity: number, deliveryMethod: DeliveryMethod, pricePerSack: number) {
    const woodCost = quantity * pricePerSack;
    const shippingCost =
        deliveryMethod === 'pickup'
            ? 0
            : deliveryMethod === 'express'
                ? Math.ceil(quantity / 3) * EXPRESS_DELIVERY_PRICE_PER_3
                : quantity * STANDARD_DELIVERY_PRICE_PER_PALLET;
    return { woodCost, shippingCost, total: woodCost + shippingCost };
}

export const actions: Actions = {
    default: async ({ request, url, locals }) => {
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

        const pb = new PocketBase(publicEnv.PUBLIC_PB_URL);
        try {
            const inventory = await pb.collection('inventory').getOne('6svgilvrehzayhb');
            if (!inventory.isInStock || inventory.quantity_available < quantity) {
                throw error(400, 'Ikkje nok varer på lager');
            }
        } catch (err: any) {
            if (err.status === 400) throw err;
            console.error('Kunne ikkje sjekke lagerbehaldning:', err);
            throw error(503, 'Kunne ikkje stadfeste lagerstatus. Prøv igjen seinare.');
        }

        const { price: pricePerSack } = await getActiveCampaignPrice(pb);
        const { total: totalPrice } = calculateTotal(quantity, deliveryMethod as DeliveryMethod, pricePerSack);

        const userId = locals.user?.id || '';

        let checkoutUrl: string;

        try {
            const session = await stripe.checkout.sessions.create({
                customer_email: email ? String(email) : undefined,
                phone_number_collection: {
                    enabled: true,
                },
                shipping_address_collection: deliveryMethod !== 'pickup'
                    ? {
                        allowed_countries: ['NO'],
                    }
                    : undefined,
                line_items: [
                    {
                        price_data: {
                            currency: 'nok',
                            product_data: {
                                name: 'Blandingsved, 1000L storsekk',
                                description: `${quantity} stk. (${deliveryMethod === 'pickup' ? 'Hent sjølv' : deliveryMethod === 'express' ? 'Ekspress levering' : 'Standard levering'})`,
                            },
                            unit_amount: pricePerSack * 100,
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
