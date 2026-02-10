<script lang="ts">
	import { pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let inventoryItems = $state<any[]>([]);
	let campaigns = $state<any[]>([]);
	let loading = $state(true);
	let saving = $state(false);

	function formatForInput(isoString: string) {
		if (!isoString) return '';
		const d = new Date(isoString);
		const offsetMs = d.getTimezoneOffset() * 60 * 1000;
		return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
	}

	onMount(async () => {
		if (!pb.authStore.isValid || !pb.authStore.isSuperuser) {
			goto('/admin/login');
			return;
		}

		try {
			const [invRes, campRes] = await Promise.all([
				pb.collection('inventory').getFullList(),
				pb.collection('campaigns').getFullList({ sort: '-created' })
			]);
			
			inventoryItems = invRes;
			campaigns = campRes.map((c) => ({
				...c,
				endDate: formatForInput(c.endDate)
			}));
		} catch (error) {
			console.error('Failed to load data:', error);
			alert('Kunne ikkje laste data. Sjekk at du er logga inn som admin.');
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

	async function createCampaign() {
		saving = true;
		try {
			const nextWeek = new Date();
			nextWeek.setDate(nextWeek.getDate() + 7);

			const newCampaign = {
				isActive: false,
				label: 'Ny kampanje',
				campaignPrice: 1000,
				standardPrice: 1500,
				endDate: nextWeek.toISOString()
			};

			const created = await pb.collection('campaigns').create(newCampaign);
			campaigns = [{ ...created, endDate: formatForInput(created.endDate) }, ...campaigns];
		} catch (error) {
			console.error('Error creating campaign:', error);
			alert('Feil ved oppretting av kampanje.');
		} finally {
			saving = false;
		}
	}

	async function updateCampaign(campaign: any) {
		saving = true;
		try {
			const payload = {
				isActive: campaign.isActive,
				label: campaign.label,
				campaignPrice: campaign.campaignPrice,
				standardPrice: campaign.standardPrice,
				endDate: new Date(campaign.endDate).toISOString()
			};

			const updated = await pb.collection('campaigns').update(campaign.id, payload);
			campaigns = campaigns.map((c) =>
				c.id === campaign.id ? { ...updated, endDate: formatForInput(updated.endDate) } : c
			);
			alert('Kampanje oppdatert!');
		} catch (error) {
			console.error('Error updating campaign:', error);
			alert('Feil ved lagring av kampanje.');
		} finally {
			saving = false;
		}
	}

	async function deleteCampaign(id: string) {
		if (!confirm('Er du sikker på at du vil slette denne kampanjen?')) return;

		saving = true;
		try {
			await pb.collection('campaigns').delete(id);
			campaigns = campaigns.filter((c) => c.id !== id);
		} catch (error) {
			console.error('Error deleting campaign:', error);
			alert('Feil ved sletting av kampanje.');
		} finally {
			saving = false;
		}
	}

	function getStatus(campaign: any) {
		const now = new Date();
		const end = new Date(campaign.endDate);

		if (!campaign.isActive) return { text: 'Inaktiv', color: 'bg-stone-200 text-stone-600' };
		if (end < now) return { text: 'Utgått', color: 'bg-red-100 text-red-700' };
		return { text: 'Aktiv', color: 'bg-emerald-100 text-emerald-700' };
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
		{#if loading}
			<div class="flex justify-center p-12">
				<span class="loading-spinner text-stone-500">Laster...</span>
			</div>
		{:else}
			<section class="mb-12">
				<h1 class="mb-6 text-2xl font-bold text-stone-900">Lagerstyring</h1>

				{#if inventoryItems.length === 0}
					<div class="rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-stone-900/5">
						<p class="text-stone-500">Ingen varelager-poster funnet.</p>
						<p class="mt-2 text-xs text-stone-500">
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
									<p class="mt-1 text-xs text-stone-500">
										Sist oppdatert: {new Date(item.updated).toLocaleString()}
									</p>
								</div>

								<div class="flex items-center gap-6 rounded-lg bg-stone-50 p-4">
									<div class="flex flex-col gap-1">
										<label
											for="stock-{item.id}"
											class="text-xs font-medium uppercase text-stone-500">Antall på lager</label
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
										<span class="text-xs font-medium uppercase text-stone-500">Status</span>
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
			</section>

			<section>
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-2xl font-bold text-stone-900">Kampanjestyring</h2>
					<button
						onclick={createCampaign}
						disabled={saving}
						class="cursor-pointer rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
					>
						Opprett ny kampanje
					</button>
				</div>

				{#if campaigns.length === 0}
					<div class="rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-stone-900/5">
						<p class="text-stone-500">Ingen kampanjer funnet.</p>
					</div>
				{:else}
					<div class="space-y-6">
						{#each campaigns as campaign}
							{@const status = getStatus(campaign)}
							<div
								class="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-stone-900/5"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<span
											class={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
										>
											{status.text}
										</span>
										<span class="text-xs text-stone-400">ID: {campaign.id}</span>
									</div>
									<button
										onclick={() => deleteCampaign(campaign.id)}
										disabled={saving}
										class="cursor-pointer text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
									>
										Slett
									</button>
								</div>

								<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
									<div class="flex flex-col gap-1">
										<label for="label-{campaign.id}" class="text-xs font-medium uppercase text-stone-500">Bannertekst</label>
										<input
											id="label-{campaign.id}"
											type="text"
											bind:value={campaign.label}
											class="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:text-sm"
										/>
									</div>
									<div class="flex flex-col gap-1">
										<label for="campaignPrice-{campaign.id}" class="text-xs font-medium uppercase text-stone-500">Kampanjepris</label>
										<input
											id="campaignPrice-{campaign.id}"
											type="number"
											bind:value={campaign.campaignPrice}
											class="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:text-sm"
										/>
									</div>
									<div class="flex flex-col gap-1">
										<label for="standardPrice-{campaign.id}" class="text-xs font-medium uppercase text-stone-500">Standardpris</label>
										<input
											id="standardPrice-{campaign.id}"
											type="number"
											bind:value={campaign.standardPrice}
											class="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:text-sm"
										/>
									</div>
									<div class="flex flex-col gap-1">
										<label for="endDate-{campaign.id}" class="text-xs font-medium uppercase text-stone-500">Sluttdato</label>
										<input
											id="endDate-{campaign.id}"
											type="datetime-local"
											bind:value={campaign.endDate}
											class="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:text-sm"
										/>
									</div>
								</div>

								<div
									class="flex flex-col items-center justify-end gap-4 border-t border-stone-100 pt-4 sm:flex-row"
								>
									<label class="flex cursor-pointer items-center gap-2">
										<input
											type="checkbox"
											bind:checked={campaign.isActive}
											class="rounded border-stone-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
										/>
										<span class="text-sm text-stone-700">Aktiv kampanje</span>
									</label>
									<button
										onclick={() => updateCampaign(campaign)}
										disabled={saving}
										class="cursor-pointer rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
									>
										{saving ? 'Lagrer...' : 'Lagre endringer'}
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</main>
</div>
