import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$app/env/private';

if (!STRIPE_SECRET_KEY) {
	console.error('CRITICAL: STRIPE_SECRET_KEY is missing from environment variables');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || '', {
	apiVersion: '2026-08-26.dahlia'
});
