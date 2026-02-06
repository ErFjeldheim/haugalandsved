<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let inventoryItems = $state<any[]>([]);
	let loading = $state(true);
	let saving = $state(false);

	onMount(async () => {
		if (!pb.authStore.isValid || !pb.authStore.isAdmin) {
			goto('/admin/login');
			return;
		}

		try {
			// Fetch inventory items. Assuming a single global inventory for now or list of items
			// If you have a specific collection structure, adjust here.
			// Based on +page.svelte, it seems we fetch 'inventory' data.
			// Let's assume there is an 'inventory' collection.
			const records = await pb.collection('inventory').getFullList({
				sort: '-created'
			});
			inventoryItems = records;
		} catch (error) {
			console.error('Failed to load inventory:', error);
			alert('Kunne ikke laste lagerbeholdning. Sjekk at du er logget inn som admin.');
		} finally {
			loading = false;
		}
	});

	async function updateStock(id: string, newQuantity: number, isInStock: boolean) {
		saving = true;
		try {
			await pb.collection('inventory').update(id, {
				quantity_available: newQuantity,
				isInStock: isInStock
			});

			// Refresh local state to confirm
			const updated = await pb.collection('inventory').getOne(id);
			inventoryItems = inventoryItems.map((item) => (item.id === id ? updated : item));
			alert('Lagerbeholdning oppdatert!');
		} catch (error) {
			console.error('Failed to update stock:', error);
			alert('Feil ved oppdatering av lager.');
		} finally {
			saving = false;
		}
	}

	function logout() {
		pb.authStore.clear();
		goto('/admin/login');
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Haugalandsved</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<nav class="border-b border-stone-200 bg-white">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<span class="text-lg font-bold text-stone-900">Haugalandsved Admin</span>
			<button onclick={logout} class="text-sm font-medium text-red-600 hover:text-red-800">
				Logg ut
			</button>
		</div>
	</nav>

	<main class="container mx-auto px-4 py-8">
		<h1 class="mb-6 text-2xl font-bold text-stone-900">Lagerstyring</h1>

		{#if loading}
			<div class="flex justify-center p-12">
				<span class="loading-spinner text-stone-400">Laster...</span>
			</div>
		{:else if inventoryItems.length === 0}
			<div class="rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-stone-900/5">
				<p class="text-stone-500">Ingen varelager-poster funnet.</p>
				<p class="mt-2 text-xs text-stone-400">
					Opprett en post i "inventory"-samlingen i PocketBase først.
				</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each inventoryItems as item}
					<div
						class="flex flex-col items-start justify-between gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:flex-row sm:items-center"
					>
						<div>
							<h3 class="text-lg font-medium text-stone-900">Blandingsved (1000L)</h3>
							<p class="text-sm text-stone-500">ID: {item.id}</p>
							<p class="mt-1 text-xs text-stone-400">
								Sist oppdatert: {new Date(item.updated).toLocaleString()}
							</p>
						</div>

						<div class="flex items-center gap-6 rounded-lg bg-stone-50 p-4">
							<div class="flex flex-col gap-1">
								<label for="stock-{item.id}" class="text-xs font-medium text-stone-500 uppercase"
									>Antall på lager</label
								>
								<input
									type="number"
									id="stock-{item.id}"
									bind:value={item.quantity_available}
									min="0"
									class="w-24 rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:text-sm"
								/>
							</div>

							<div class="flex flex-col gap-1">
								<span class="text-xs font-medium text-stone-500 uppercase">Status</span>
								<label class="inline-flex cursor-pointer items-center">
									<input
										type="checkbox"
										bind:checked={item.isInStock}
										class="rounded border-stone-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
									/>
									<span class="ml-2 text-sm text-stone-700">Tilgjengelig for salg</span>
								</label>
							</div>

							<button
								onclick={() => updateStock(item.id, item.quantity_available, item.isInStock)}
								disabled={saving}
								class="ml-4 cursor-pointer rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
							>
								{saving ? 'Lagrer...' : 'Lagre endringer'}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
