import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { STRIPE_SECRET_KEY as STRIPE_SECRET_KEY_STATIC } from '$env/static/private';

const secretKey = env.STRIPE_SECRET_KEY || STRIPE_SECRET_KEY_STATIC;

if (!secretKey) {
    console.error('CRITICAL: STRIPE_SECRET_KEY is missing from environment variables');
}

export const stripe = new Stripe(secretKey || '', {
    apiVersion: '2026-01-28.clover'
});
