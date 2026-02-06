<script lang="ts">
	import { pb } from '$lib/pocketbase';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function requestReset() {
		loading = true;
		error = '';
		success = false;

		try {
			await pb.collection('users').requestPasswordReset(email);
			success = true;
		} catch (e: any) {
			error = 'Kunne ikke sende tilbakestillings-e-post. Sjekk at adressen er riktig.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Glemt passord - Haugalandsved</title>
</svelte:head>

<div class="min-h-screen bg-stone-50 px-4 py-20">
	<div class="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-stone-900/5">
		<h1 class="mb-6 text-3xl font-bold text-stone-900">Glemt passord?</h1>

		{#if success}
			<div class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
				Vi har sendt en e-post med instruksjoner for å tilbakestille passordet ditt. Vennligst sjekk
				innboksen din.
			</div>
		{:else}
			<p class="mb-6 text-sm text-stone-600">
				Skriv inn e-postadressen din under, så sender vi deg en lenke for å velge et nytt passord.
			</p>

			{#if error}
				<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
					{error}
				</div>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					requestReset();
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

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-full bg-amber-700 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Sender...' : 'Send tilbakestillings-lenke'}
				</button>
			</form>
		{/if}

		<div class="mt-6 text-center text-sm text-stone-500">
			<a href="/auth/login" class="font-medium text-amber-700 hover:text-amber-600"
				>&larr; Tilbake til logg inn</a
			>
		</div>
	</div>
</div>
