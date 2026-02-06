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
			await pb.admins.authWithPassword(email, password);
			goto('/admin/dashboard');
		} catch (e: any) {
			error = 'Feil e-post eller passord (kun admin)';
			console.error(e);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Login - Haugalandsved</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-stone-100 px-4">
	<div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-stone-900/5">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-stone-900">Admin Panel</h1>
			<p class="mt-2 text-sm text-stone-500">Logg inn for å administrere vedlageret</p>
		</div>

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
					class="mt-1 block w-full rounded-md border-0 px-3 py-2 text-stone-900 shadow-sm ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-600 sm:text-sm"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-stone-700">Passord</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					class="mt-1 block w-full rounded-md border-0 px-3 py-2 text-stone-900 shadow-sm ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-600 sm:text-sm"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full cursor-pointer rounded-md bg-stone-900 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:ring-2 focus:ring-stone-500 focus:outline-none disabled:opacity-50"
			>
				{loading ? 'Logger inn...' : 'Logg inn'}
			</button>
		</form>

		<div class="mt-6 text-center">
			<a href="/" class="text-xs text-stone-500 hover:text-stone-700">Tilbake til nettsiden</a>
		</div>
	</div>
</div>
