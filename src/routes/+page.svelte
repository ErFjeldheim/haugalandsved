<script lang="ts">
	import { pb, currentUser } from '$lib/pocketbase';
	import { loadStripe } from '@stripe/stripe-js';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';

	let { data } = $props();
	let inventory = $derived(data.inventory);

	let orderLoading = $state(false);
	let orderError = $state('');
	let count = $state(1);
	let deliveryMethod = $state<'pickup' | 'standard' | 'express'>('pickup');

	// Sørg for at count ikke er høyere enn lagerbeholdning hvis vi har lite på lager
	$effect(() => {
		if (inventory.quantity > 0 && count > inventory.quantity) {
			count = inventory.quantity;
		}
	});

	const BEFORE_PRICE = 1490;
	const PRICE_PER_SACK = 1190;
	const STANDARD_DELIVERY_PRICE_PER_PALLET = 300;
	const EXPRESS_DELIVERY_PRICE_PER_3 = 1000;

	let woodCost = $derived(count * PRICE_PER_SACK);
	let shippingCost = $derived(
		deliveryMethod === 'pickup'
			? 0
			: deliveryMethod === 'express'
				? Math.ceil(count / 3) * EXPRESS_DELIVERY_PRICE_PER_3
				: count * STANDARD_DELIVERY_PRICE_PER_PALLET
	);
	let totalCost = $derived(woodCost + shippingCost);

	// Beregn ledig plass på henger
	let trailerSpotInfo = $derived({
		spotsTaken: count % 3,
		remainingSpots: count % 3 === 0 ? 0 : 3 - (count % 3),
		isFull: count % 3 === 0
	});

	const woodTypes = [
		{
			name: 'Furu',
			description: 'Lettantenneleg og gjev rask varme. Perfekt for opptenning.',
			image: '/images/trebit-furu.webp'
		},
		{
			name: 'Bjørk',
			description: 'Klassikaren med høg brennverdi, pen flamme og lite gneister.',
			image: '/images/trebit-bjørk.webp'
		},
		{
			name: 'Gran',
			description: 'Gnistrar litt, men gjev lun og god varme og er lett å fyre med.',
			image: '/images/trebit-gran.webp'
		}
	];

	let checkoutForm = $state<HTMLFormElement>();

	let stripeElements: any;
	let expressCheckoutElement: any;
	let stripe: any;

	onMount(async () => {
		if (browser && data.stripeKey) {
			stripe = await loadStripe(data.stripeKey);
			if (!stripe) return;

			stripeElements = stripe.elements({
				mode: 'payment',
				amount: Math.round(totalCost * 100),
				currency: 'nok'
			});

			expressCheckoutElement = stripeElements.create('expressCheckout', {
				buttonType: {
					applePay: 'buy',
					googlePay: 'buy'
				}
			});

			expressCheckoutElement.mount('#express-checkout-element');

			expressCheckoutElement.on('confirm', async (event: any) => {
				const {
					quantity,
					deliveryMethod: method,
					totalPrice
				} = {
					quantity: count,
					deliveryMethod,
					totalPrice: totalCost
				};

				const response = await fetch('/api/checkout/create-intent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						quantity,
						deliveryMethod: method,
						totalPrice,
						userId: $currentUser?.id
					})
				});

				const { clientSecret } = await response.json();

				const { error: confirmError } = await stripe.confirmPayment({
					elements: stripeElements,
					clientSecret,
					confirmParams: {
						return_url: `${window.location.origin}/api/checkout/success`
					}
				});

				if (confirmError) {
					event.status = 'fail';
					orderError = confirmError.message || 'Betaling feila';
				} else {
					event.status = 'success';
				}
			});
		}
	});

	// Oppdater Stripe Elements når totalCost endres
	$effect(() => {
		if (stripeElements) {
			stripeElements.update({ amount: Math.round(totalCost * 100) });
		}
	});

	async function placeOrder() {
		if (!inventory.isInStock) {
			orderError = 'Diverre, me er tomme på lager.';
			return;
		}

		orderLoading = true;
		// Vi bruker en standard form for å unngå CORS-problemer med Stripe-redirects
		setTimeout(() => checkoutForm?.submit(), 0);
	}

	let mapElement = $state<HTMLElement>();

	$effect(() => {
		if (browser && mapElement) {
			let map: any;

			const initMap = async () => {
				const L = (await import('leaflet')).default;

				// Fix Leaflet's default icon paths in Vite
				const markerIcon = (await import('leaflet/dist/images/marker-icon.png')).default;
				const markerIcon2x = (await import('leaflet/dist/images/marker-icon-2x.png')).default;
				const markerShadow = (await import('leaflet/dist/images/marker-shadow.png')).default;

				delete (L.Icon.Default.prototype as any)._getIconUrl;
				L.Icon.Default.mergeOptions({
					iconUrl: markerIcon,
					iconRetinaUrl: markerIcon2x,
					shadowUrl: markerShadow
				});

				map = L.map(mapElement!).setView([59.482409, 5.517026], 15);
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				}).addTo(map);

				L.marker([59.482409, 5.517026])
					.addTo(map)
					.bindPopup('<b>Haugalandsved</b><br>Fjellheimsvegen 66')
					.openPopup();
			};

			initMap();

			return () => {
				if (map) map.remove();
			};
		}
	});
</script>

<svelte:head>
	<title>Haugalandsved - Kortreist kvalitet</title>
	<meta
		name="description"
		content="Kjøp kortreist blandingsved av høg kvalitet frå Haugalandet. Levering rett heim eller hent sjølv."
	/>
	<meta property="og:title" content="Haugalandsved - Kortreist kvalitet" />
	<meta
		property="og:description"
		content="Kjøp kortreist blandingsved av høg kvalitet frå Haugalandet. Levering rett heim eller hent sjølv."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://haugalandsved.no" />
	<meta
		property="og:image"
		content="https://haugalandsved.no/images/flere-paller-blandingsved.webp"
	/>
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "LocalBusiness",
			"name": "Haugalandsved",
			"image": "https://haugalandsved.no/images/flere-paller-blandingsved.webp",
			"@id": "https://haugalandsved.no",
			"url": "https://haugalandsved.no",
			"telephone": "+4791636186",
			"address": {
				"@type": "PostalAddress",
				"streetAddress": "Fjellheimsvegen 66",
				"addressLocality": "Skjold",
				"postalCode": "5574",
				"addressRegion": "Vindafjord",
				"addressCountry": "NO"
			},
			"geo": {
				"@type": "GeoCoordinates",
				"latitude": 59.482409,
				"longitude": 5.517026
			},
			"openingHoursSpecification": {
				"@type": "OpeningHoursSpecification",
				"dayOfWeek": [
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
					"Sunday"
				],
				"opens": "00:00",
				"closes": "23:59"
			},
			"sameAs": []
		}
	</script>
</svelte:head>

<div class="min-h-screen bg-stone-50 font-sans text-stone-800">
	<!-- HERO SECTION -->
	<section class="relative overflow-hidden bg-stone-900 py-20 text-white lg:py-32">
		<!-- Abstract background pattern -->
		<div class="absolute inset-0 opacity-20">
			<div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-primary-hover blur-3xl"></div>
			<div class="absolute top-1/2 right-0 h-64 w-64 rounded-full bg-orange-900 blur-3xl"></div>
		</div>

		<div class="relative container mx-auto px-4 text-center">
			<h1
				class="mb-6 font-serif text-4xl font-bold tracking-tight text-amber-50 sm:text-6xl lg:text-7xl"
			>
				Varme fra Haugalandet
			</h1>
			<p class="mx-auto mb-10 max-w-2xl text-lg text-stone-300 sm:text-xl">
				Kortreist blandingsved i 1000L storsekker. Furu, bjørk, gran, rogn og selje – ferdig kappa
				og kløyvd, klar til å varme heimen din.
			</p>
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a
					href="#kalkulator"
					class="rounded-full bg-brand-primary px-8 py-4 text-lg font-semibold text-white transition hover:bg-brand-primary-hover hover:shadow-lg hover:shadow-brand-primary/20 focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-stone-900 focus:outline-none"
				>
					Bestill nå
				</a>
				<a href="#om-veden" class="text-sm font-medium text-stone-400 transition hover:text-white">
					Les meir om veden &rarr;
				</a>
			</div>
		</div>
	</section>

	<!-- CALCULATOR SECTION -->
	<section id="kalkulator" class="py-16 lg:py-24">
		<div class="container mx-auto px-4">
			<div
				class="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-900/5 lg:flex"
			>
				<!-- Controls -->
				<div class="p-8 lg:w-3/5 lg:p-12">
					<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
						<h2 class="text-2xl font-bold text-stone-900">Rekne ut pris</h2>
						<div class="flex flex-col items-end gap-1">
							<span
								class="inline-flex items-center rounded-full bg-brand-campaign-bg px-3 py-1 text-sm font-bold text-brand-campaign-text shadow-sm"
							>
								🔥 SESONGSLUTT!
							</span>
							<span class="text-[10px] font-bold text-brand-campaign-sub uppercase tracking-widest">
								Gjeld t.o.m. 28. feb
							</span>
						</div>
					</div>

					<div class="mb-8 rounded-lg bg-stone-50 p-4 ring-1 ring-stone-900/5">
						<p class="text-sm font-medium text-stone-600">
							Berre <span class="text-lg font-bold text-stone-900">{inventory.quantity}</span> storsekker
							att på lager.
						</p>
					</div>

					{#if !inventory.isInStock}
						<div class="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
							<div
								class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="h-6 w-6"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
									/>
								</svg>
							</div>
							<h3 class="text-lg font-bold text-red-900">Utselt</h3>
							<p class="mt-2 text-sm text-red-700">
								Me er diverre tomme for storsekker for augeblikket. Følg med her for oppdateringar
								om når me får inn meir ved!
							</p>
						</div>
					{:else}
						<div class="space-y-8">
							<!-- Quantity -->
							<div>
								<label for="quantity" class="block text-sm font-medium text-stone-700">
									Tal på storsekker (1000L)
								</label>
								<div class="mt-2 flex items-center gap-4">
									<input
										type="range"
										id="quantity-range"
										aria-label="Justering av antall"
										min="1"
										max={Math.min(9, inventory.quantity)}
										bind:value={count}
										class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-brand-primary"
									/>
									<input
										type="number"
										id="quantity"
										min="1"
										max={Math.min(9, inventory.quantity)}
										bind:value={count}
										class="block w-20 rounded-md border-0 py-1.5 text-center text-stone-900 shadow-sm ring-1 ring-stone-300 ring-inset placeholder:text-stone-400 focus:ring-2 focus:ring-brand-primary focus:ring-inset sm:text-sm sm:leading-6"
									/>
								</div>
								<p class="mt-2 text-sm text-stone-500">
									Maks {Math.min(9, inventory.quantity)} sekker per bestilling.
								</p>
							</div>

							<!-- Delivery Method -->
							<fieldset>
								<legend class="text-sm font-medium text-stone-700">Levering</legend>
								<div class="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
									<!-- Hent selv -->
									<label
										class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
										class:border-brand-primary={deliveryMethod === 'pickup'}
										class:ring-2={deliveryMethod === 'pickup'}
										class:ring-brand-primary={deliveryMethod === 'pickup'}
										class:border-stone-300={deliveryMethod !== 'pickup'}
									>
										<input
											type="radio"
											name="delivery-method"
											value="pickup"
											bind:group={deliveryMethod}
											class="sr-only"
										/>
										<span class="flex flex-1">
											<span class="flex flex-col">
												<span class="block text-sm font-medium text-stone-900">Hent sjølv</span>
												<span class="mt-1 flex items-center text-sm text-stone-500"
													>Avtal henting</span
												>
												<span class="mt-6 text-xs font-medium text-stone-900"
													>Fjellheimsvegen 66, 5574 Skjold</span
												>
											</span>
										</span>
										<span
											class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-stone-300"
											class:border-transparent={deliveryMethod === 'pickup'}
											class:bg-brand-primary={deliveryMethod === 'pickup'}
										>
											{#if deliveryMethod === 'pickup'}
												<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
											{/if}
										</span>
										<span
											class="pointer-events-none absolute -inset-px rounded-lg border-2"
											aria-hidden="true"
											class:border-brand-primary={deliveryMethod === 'pickup'}
											class:border-transparent={deliveryMethod !== 'pickup'}
										></span>
									</label>

									<!-- Standard Levering -->
									<label
										class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
										class:border-brand-primary={deliveryMethod === 'standard'}
										class:ring-2={deliveryMethod === 'standard'}
										class:ring-brand-primary={deliveryMethod === 'standard'}
										class:border-stone-300={deliveryMethod !== 'standard'}
									>
										<input
											type="radio"
											name="delivery-method"
											value="standard"
											bind:group={deliveryMethod}
											class="sr-only"
										/>
										<span class="flex flex-1">
											<span class="flex flex-col">
												<span class="block text-sm font-medium text-stone-900">Standard</span>
												<span class="mt-1 flex items-center text-xs text-stone-500"
													>Innan 14 dagar</span
												>
												<span class="mt-2 text-[10px] text-stone-400">Levering til sone Haugalandet</span>
												<span class="mt-4 text-sm font-bold text-stone-900"
													>300 kr per palle</span
												>
											</span>
										</span>
										<span
											class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-stone-300"
											class:border-transparent={deliveryMethod === 'standard'}
											class:bg-brand-primary={deliveryMethod === 'standard'}
										>
											{#if deliveryMethod === 'standard'}
												<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
											{/if}
										</span>
									</label>

									<!-- Ekspress Levering -->
									<label
										class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
										class:border-brand-primary={deliveryMethod === 'express'}
										class:ring-2={deliveryMethod === 'express'}
										class:ring-brand-primary={deliveryMethod === 'express'}
										class:border-stone-300={deliveryMethod !== 'express'}
									>
										<input
											type="radio"
											name="delivery-method"
											value="express"
											bind:group={deliveryMethod}
											class="sr-only"
										/>
										<span class="flex flex-1">
											<span class="flex flex-col">
												<span class="block text-sm font-medium text-stone-900">Ekspress</span>
												<span class="mt-1 flex items-center text-xs text-stone-500"
													>Innan 48 timar</span
												>
												<span class="mt-2 text-[10px] text-stone-400">Levering til sone Haugalandet</span>
												<span class="mt-4 text-sm font-bold text-stone-900"
													>1000 kr per 3 paller</span
												>
											</span>
										</span>
										<span
											class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-stone-300"
											class:border-transparent={deliveryMethod === 'express'}
											class:bg-brand-primary={deliveryMethod === 'express'}
										>
											{#if deliveryMethod === 'express'}
												<span class="h-1.5 w-1.5 rounded-full bg-white"></span>
											{/if}
										</span>
									</label>
								</div>
							</fieldset>
						</div>
					{/if}
				</div>

				<!-- Summary -->
				{#if inventory.isInStock}
					<div
						class="flex flex-col justify-between border-t border-stone-200 bg-stone-50 p-8 lg:w-2/5 lg:border-t-0 lg:border-l lg:p-12"
					>
						<div>
							<h2 class="text-lg font-medium text-stone-900">Oversyn</h2>
							<dl class="mt-6 space-y-4">
								<div class="flex items-center justify-between">
									<dt class="text-sm text-stone-600">
										Ved ({count} x {PRICE_PER_SACK},-)
										<span class="ml-1 text-xs text-stone-400 line-through">
											({count} x {BEFORE_PRICE},-)
										</span>
									</dt>
									<dd class="text-sm font-medium text-stone-900">{woodCost.toLocaleString()} kr</dd>
								</div>
								<div class="flex items-center justify-between border-t border-stone-200 pt-4">
									<dt class="flex items-center text-sm text-stone-600">
										Frakt
										{#if deliveryMethod !== 'pickup'}
											<span
												class="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600"
											>
												{Math.ceil(count / 3)} tur(er)
											</span>
										{/if}
									</dt>
									<dd class="text-sm font-medium text-stone-900">
										{shippingCost.toLocaleString()} kr
									</dd>
								</div>

								{#if deliveryMethod === 'express' && !trailerSpotInfo.isFull}
									<div class="mt-2 rounded-lg bg-orange-50 p-3 ring-1 ring-orange-200">
										<p class="text-xs font-medium text-orange-800">
											💡 Me har plass til <span class="font-bold">{trailerSpotInfo.remainingSpots}</span> sekk(er) til på hengaren for samme fraktpris!
										</p>
										<button
											onclick={() => (count = count + trailerSpotInfo.remainingSpots)}
											class="mt-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-orange-900 underline"
										>
											Fyll opp hengaren
										</button>
									</div>
								{/if}
								<div class="flex items-center justify-between border-t border-stone-200 pt-4">
									<dt class="text-base font-medium text-stone-900">Total</dt>
									<dd class="text-2xl font-bold text-brand-primary">{totalCost.toLocaleString()} kr</dd>
								</div>
							</dl>
							<p class="mt-2 text-xs text-stone-500 italic">Alle priser inkl. mva.</p>
						</div>

						<div class="mt-8">
							{#if orderError}
								<p class="mb-4 text-center text-xs text-red-600">{orderError}</p>
							{/if}

							<form action="/checkout" method="POST" bind:this={checkoutForm} class="hidden">
								<input type="hidden" name="quantity" value={count} />
								<input type="hidden" name="deliveryMethod" value={deliveryMethod} />
								<input type="hidden" name="totalPrice" value={totalCost} />
								<input type="hidden" name="userId" value={$currentUser?.id} />
								<input type="hidden" name="email" value={$currentUser?.email} />
							</form>

							<button
								onclick={placeOrder}
								disabled={orderLoading || !inventory.isInStock}
								class="w-full cursor-pointer rounded-md bg-stone-900 px-3.5 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:opacity-50"
							>
								{#if orderLoading}
									Handsamar...
								{:else if !inventory.isInStock}
									Utselt
								{:else}
									Betaling
								{/if}
							</button>

							<div class="mt-6">
								<div id="express-checkout-element">
									<!-- Stripe Express Checkout Element vil vises her -->
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- PRODUCT INFO SECTION -->
	<section id="om-veden" class="bg-white py-16 lg:py-24">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-pretty text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
					Kvalitet i kvar sekk
				</h2>
				<p class="mt-4 text-lg leading-8 text-stone-600">
					Blandingsveden vår består av dei beste treslaga frå lokale skogar. Pakka i 1000L sekker på
					europall for enkel handtering.
				</p>
			</div>

			<!-- Product Overview Images -->
			<div class="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
				<div class="group relative overflow-hidden rounded-2xl bg-stone-100">
					<img
						src="/images/enkelt-palle-blandingsved.webp"
						alt="Storsekk med blandingsved"
						loading="lazy"
						class="h-96 w-full object-cover transition duration-500 group-hover:scale-105"
					/>
					<div
						class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent p-8"
					>
						<h3 class="text-xl font-bold text-white">1000L Storsekk</h3>
						<p class="mt-2 text-stone-200">Vårt mest populære val. Pakka og klar for lagring.</p>
					</div>
				</div>
				<div class="group relative overflow-hidden rounded-2xl bg-stone-100">
					<img
						src="/images/flere-paller-blandingsved.webp"
						alt="Fleire pallar med ved"
						loading="lazy"
						class="h-96 w-full object-cover transition duration-500 group-hover:scale-105"
					/>
					<div
						class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent p-8"
					>
						<h3 class="text-xl font-bold text-white">Leveringsklar</h3>
						<p class="mt-2 text-stone-200">
							Me har god kapasitet og leverer raskt til heile Haugalandet.
						</p>
					</div>
				</div>
			</div>

			<div class="mt-24">
				<div class="mx-auto max-w-2xl text-center">
					<h3 class="text-2xl font-bold text-stone-900">Kva inneheld blandinga?</h3>
					<p class="mt-4 text-stone-600">
						Blandingsveden vår inneheld ein god miks av ulike treslag for optimal
						forbrenning. Storsekker kan også innehalda rogn og selje.
					</p>
				</div>
				<div class="mt-16 sm:mt-20 lg:mt-24">
					<div class="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
						{#each woodTypes as wood}
							<div class="group flex flex-col items-center text-center">
								<div
									class="mb-6 aspect-square w-full overflow-hidden rounded-2xl bg-amber-50 shadow-inner ring-1 ring-amber-100"
								>
									{#if wood.image}
										<img
											src={wood.image}
											alt={wood.name}
											loading="lazy"
											class="h-full w-full object-cover transition duration-500 group-hover:scale-110"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center">
											<svg
												class="h-12 w-12 text-brand-primary opacity-20"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										</div>
									{/if}
								</div>
								<h4 class="text-lg font-bold text-stone-900">
									{wood.name}
								</h4>
								<p class="mt-2 text-sm leading-6 text-stone-600">
									{wood.description}
								</p>
							</div>
						{/each}
					</div>
				</div>

				<!-- Tips & Origin Section -->
				<div class="mt-24 grid grid-cols-1 gap-12 lg:grid-cols-2">
					<div class="rounded-2xl bg-stone-50 p-8 ring-1 ring-stone-900/5 lg:p-10">
						<div class="flex items-center gap-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 w-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 class="text-xl font-bold text-stone-900">Lagra i 2 år</h3>
						</div>
						<p class="mt-6 text-stone-600 leading-relaxed">
							Me har ved som har vore lagra tørt innandørs i over 2 år. Dette sikrar ein stabil og god tørrgrad. 
							Veden er resultatet av rydding i skogen og langs gardsvegen for å gjera det fint og ryddig rundt oss.
						</p>
						<p class="mt-4 text-stone-600 leading-relaxed">
							<strong class="text-stone-900">Visste du?</strong> All ved har om lag same brennverdi rekna i tørrstoff pr. kg. Granveden er noko lettare, og har difor litt større volum pr. kg enn tyngre treslag som bjørk.
						</p>
					</div>

					<div class="rounded-2xl bg-amber-50 p-8 ring-1 ring-amber-900/5 lg:p-10">
						<div class="flex items-center gap-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 w-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-3.333-2.328 3.75 3.75 0 003.11 6.249z" />
								</svg>
							</div>
							<h3 class="text-xl font-bold text-stone-900">Tips for betre fyring</h3>
						</div>
						<ul class="mt-6 space-y-4">
							<li class="flex gap-3 text-stone-600">
								<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">1</span>
								<span>Syt for god trekk for å få komplett forbrenning og minimalt med aske.</span>
							</li>
							<li class="flex gap-3 text-stone-600">
								<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">2</span>
								<span>Reguler varmen med <strong class="text-stone-900">mengda ved</strong> meir enn med trekken.</span>
							</li>
							<li class="flex gap-3 text-stone-600">
								<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">3</span>
								<span>Godt oppkløyvd ved gjev ein reinare og betre forbrenning i omnen din.</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>
	<!-- CONTACT SECTION -->
	<section id="kontakt" class="bg-stone-50 py-16 lg:py-24">
		<div class="container mx-auto px-4">
			<div
				class="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl ring-1 ring-stone-900/5 md:p-12"
			>
				<div class="grid grid-cols-1 gap-12 md:grid-cols-2">
					<div>
						<h2 class="text-3xl font-bold tracking-tight text-stone-900">Kontakt oss</h2>
						<p class="mt-4 text-stone-600">
							Lurer du på noko om levering, vedkvalitet eller ønsker du å bestille større mengder? Ta
							gjerne kontakt med oss.
						</p>

						<div class="mt-8 space-y-6">
							<div class="flex items-center gap-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-900"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="h-5 w-5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
										/>
									</svg>
								</div>
								<div>
									<p class="text-xs font-semibold text-stone-500 uppercase">Telefon</p>
									<p class="text-stone-900">916 36 186</p>
								</div>
							</div>

							<div class="flex items-center gap-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-900"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="h-5 w-5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
										/>
									</svg>
								</div>
								<div>
									<p class="text-xs font-semibold text-stone-500 uppercase">E-post</p>
									<p class="text-stone-900">norleifj@online.no</p>
								</div>
							</div>
						</div>
					</div>

					<div
						class="flex flex-col justify-center rounded-xl bg-stone-50 p-6 ring-1 ring-stone-900/5 ring-inset"
					>
						<h3 class="font-bold text-stone-900">Lokasjon</h3>
						<p class="mt-2 text-sm text-stone-600">
							Me held til i Skjold i Vindafjord. Ved kan hentast på garden vår etter avtale.
						</p>
						<div
							class="mt-4 overflow-hidden rounded-lg bg-stone-200 shadow-inner ring-1 ring-stone-900/10"
						>
							<div bind:this={mapElement} class="z-0 aspect-video w-full"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CALL TO ACTION (Footer-like) -->
	<section class="bg-orange-900 py-16 text-center text-white">
		<div class="container mx-auto px-4">
			<h2 class="text-pretty text-3xl font-bold tracking-tight sm:text-4xl">Klar for vinteren?</h2>
			<p class="mx-auto mt-6 max-w-xl text-lg text-orange-100">
				Sikre deg tørr og fin ved i dag. Me leverer raskt og effektivt.
			</p>
			<div class="mt-10 flex items-center justify-center gap-x-6">
				<a
					href="#kalkulator"
					class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-orange-900 shadow-sm transition-colors hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				>
					Bestill ved nå
				</a>
			</div>
		</div>
	</section>
</div>
