import { error, redirect } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

export const actions = {
    default: async ({ request, url }) => {
        const data = await request.formData();
        const quantity = Number(data.get('quantity'));
        const deliveryMethod = data.get('deliveryMethod');
        const totalPrice = Number(data.get('totalPrice'));
        const userId = data.get('userId');
        const email = data.get('email');



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
                                description: `${quantity} stk. (${deliveryMethod === 'delivery' ? 'Med levering' : 'Hent selv'})`,
                            },
                            unit_amount: Math.round((totalPrice / quantity) * 100),
                        },
                        quantity: quantity,
                    },
                ],
                mode: 'payment',
                success_url: `${url.origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${url.origin}/#kalkulator`,
                metadata: {
                    userId: String(userId),
                    quantity: String(quantity),
                    deliveryMethod: String(deliveryMethod),
                    totalPrice: String(totalPrice)
                }
            });

            if (!session.url) {
                throw error(500, 'Kunne ikke opprette Stripe-sesjon');
            }
            checkoutUrl = session.url;
        } catch (err: any) {
            // Sjekk om det er en SvelteKit-feil/redirect som ikke skal fanges her
            if (err.status) throw err;

            console.error('Stripe error:', err);
            throw error(500, 'Noe gikk galt med betalingen');
        }

        throw redirect(303, checkoutUrl);
    }
};
