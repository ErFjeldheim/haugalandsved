<script lang="ts">
	import { pb, currentUser } from '$lib/pocketbase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let orders = $state<any[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		if (!$currentUser) {
			goto('/auth/login');
			return;
		}

		try {
			const records = await pb.collection('orders').getFullList({
				sort: '-created'
			});
			orders = records;
		} catch (e: any) {
			error = 'Kunne ikke laste ordreoversikt.';
		} finally {
			loading = false;
		}
	});

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('no-NO', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string) {
		switch (status.toLowerCase()) {
			case 'levert':
				return 'bg-green-100 text-green-700';
			case 'behandles':
				return 'bg-blue-100 text-blue-700';
			case 'avbrutt':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-stone-100 text-stone-700';
		}
	}
</script>

<svelte:head>
	<title>Mine ordre - Haugalandsved</title>
</svelte:head>

<div class="min-h-screen bg-stone-50 px-4 py-16">
	<div class="container mx-auto max-w-4xl">
		<h1 class="mb-8 text-3xl font-bold text-stone-900">Mine ordre</h1>

		{#if loading}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"
				></div>
				<p class="mt-4 text-text-muted">Laster dine bestillinger...</p>
			</div>
		{:else if error}
			<div class="rounded-lg bg-red-50 p-6 text-center text-red-700 shadow-sm">
				<p>{error}</p>
				<button onclick={() => window.location.reload()} class="mt-4 font-medium underline"
					>Prøv igjen</button
				>
			</div>
		{:else if orders.length === 0}
			<div class="rounded-2xl bg-white p-12 text-center shadow-xl ring-1 ring-stone-900/5">
				<div
					class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-stone-50"
				>
					<svg
						class="h-10 w-10 text-stone-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						/>
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-stone-900">Ingen ordre ennå</h2>
				<p class="mt-2 text-stone-600">Du har ikke lagt inn noen bestillinger for øyeblikket.</p>
				<a
					href="/#kalkulator"
					class="mt-8 inline-block rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
				>
					Bestill ved nå
				</a>
			</div>
		{:else}
			<div class="space-y-6">
				{#each orders as order}
					<div class="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-900/5">
						<div
							class="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 bg-stone-50/50 px-6 py-4"
						>
							<div>
								<p class="text-xs font-semibold tracking-wider text-stone-500 uppercase">
									Ordrenummer
								</p>
								<p class="mt-1 text-sm font-medium text-stone-900">{order.id}</p>
							</div>
							<div>
								<p class="text-xs font-semibold tracking-wider text-stone-500 uppercase">Dato</p>
								<p class="mt-1 text-sm font-medium text-stone-900">{formatDate(order.created)}</p>
							</div>
							<div>
								<span
									class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
								>
									{order.status}
								</span>
							</div>
						</div>
						<div class="p-6 sm:flex sm:items-center sm:justify-between">
							<div class="space-y-1">
								<h3 class="text-lg font-bold text-stone-900">Blandingsved, 1000L storsekk</h3>
								<p class="text-sm text-stone-600">
									Antall: {order.quantity} | Frakt: {order.delivery_method === 'delivery'
										? 'Levering'
										: 'Hent selv'}
								</p>
							</div>
							<div class="mt-4 text-right sm:mt-0">
								<p class="text-xs font-semibold tracking-wider text-stone-500 uppercase">
									Totalpris
								</p>
								<p class="mt-1 text-2xl font-black text-brand-primary">
									{order.total_price.toLocaleString()} kr
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
