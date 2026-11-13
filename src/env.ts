import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_PB_URL: { public: true, schema: (input) => input ?? '' },
	PB_ADMIN_EMAIL: { schema: (input) => input ?? '' },
	PB_ADMIN_PASSWORD: { schema: (input) => input ?? '' },
	STRIPE_SECRET_KEY: { schema: (input) => input ?? '' },
	SMTP_HOST: { schema: (input) => input ?? '' },
	SMTP_PORT: { schema: (input) => input ?? '' },
	SMTP_USER: { schema: (input) => input ?? '' },
	SMTP_PASS: { schema: (input) => input ?? '' },
	SMTP_FROM: { schema: (input) => input ?? '' },
	ADMIN_EMAIL: { schema: (input) => input ?? '' }
});
