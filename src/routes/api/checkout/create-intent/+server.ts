import { json, error } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';

export const POST = async ({ request }) => {
    const { quantity, deliveryMethod, totalPrice, userId } = await request.json();

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalPrice * 100),
            currency: 'nok',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: userId || '',
                quantity: String(quantity),
                deliveryMethod: String(deliveryMethod),
                totalPrice: String(totalPrice)
            }
        });

        return json({ clientSecret: paymentIntent.client_secret });
    } catch (err: any) {
        console.error('Error creating payment intent:', err);
        throw error(500, 'Kunne ikkje opprette betaling');
    }
};
