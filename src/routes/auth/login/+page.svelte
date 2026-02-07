<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function login() {
		loading = true;
		error = '';

		try {
			await pb.collection('users').authWithPassword(email, password);
			goto('/');
		} catch (e: any) {
			error = 'Feil e-post eller passord';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Logg inn - Haugalandsved</title>
</svelte:head>

<div class="min-h-screen bg-stone-50 px-4 py-20">
	<div class="mx-auto max-w-md">
		<a
			href="/"
			class="mb-4 inline-flex items-center text-sm font-medium text-stone-500 transition hover:text-stone-700"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="mr-2 h-4 w-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
				/>
			</svg>
			Tilbake til forsida
		</a>

		<div class="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-stone-900/5">
			<h1 class="mb-6 text-3xl font-bold text-stone-900">Velkomen tilbake</h1>

			{#if error}
				<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					login();
				}}
				class="space-y-4"
			>
				<div>
					<label for="email" class="block text-sm font-medium text-stone-700">E-post</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						required
						class="mt-1 block w-full rounded-md border-0 px-3 py-2 text-stone-900 shadow-sm ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-600 sm:text-sm"
					/>
				</div>

				<div>
					<div class="flex items-center justify-between">
						<label for="password" class="block text-sm font-medium text-stone-700">Passord</label>
						<a href="/auth/forgot-password" class="text-xs text-amber-700 hover:text-amber-600"
							>Gløymt passord?</a
						>
					</div>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						class="mt-1 block w-full rounded-md border-0 px-3 py-2 text-stone-900 shadow-sm ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-600 sm:text-sm"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full cursor-pointer rounded-full bg-amber-700 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Loggar inn...' : 'Logg inn'}
				</button>
			</form>

			<div class="mt-6 text-center text-sm text-stone-500">
				Har du ikkje ein konto?
				<a href="/auth/register" class="font-medium text-amber-700 hover:text-amber-600"
					>Lag ein brukar her</a
				>
			</div>
		</div>
	</div>
</div>
