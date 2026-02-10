<script lang="ts">
	import './globals.css';
	import { currentUser, pb } from '$lib/pocketbase';
	import { goto } from '$app/navigation';

	let { children } = $props();
	let menuOpen = $state(false);

	function logout() {
		pb.authStore.clear();
		menuOpen = false;
		goto('/');
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

<header class="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
	<a
		href="#hovudinnhald"
		class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
	>
		Hopp til hovudinnhald
	</a>
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<a href="/" class="group flex items-center gap-3">
			<img
				src="/images/haugalandved-logo-transparent.webp"
				alt="Haugalandsved logo"
				width="120"
				height="40"
				fetchpriority="high"
				class="h-10 w-auto transition duration-300 group-hover:scale-105"
			/>
			<span class="text-xl font-bold tracking-tight text-stone-900">Haugalandsved</span>
		</a>

		<nav class="hidden items-center gap-8 text-sm font-medium text-text-muted md:flex">
			<a href="/#om-veden" class="transition hover:text-brand-primary">Om veden</a>
			<a href="/#kalkulator" class="transition hover:text-brand-primary">Prisliste</a>
			<a href="/#kontakt" class="transition hover:text-brand-primary">Kontakt</a>
			<a
				href="tel:+4791636186"
				class="inline-flex items-center gap-1.5 transition hover:text-brand-primary"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
				</svg>
				916 36 186
			</a>
		</nav>

		<div class="flex items-center gap-4">
			<!-- Desktop Menu -->
			<div class="hidden items-center gap-4 md:flex">
				{#if $currentUser}
					<a
						href="/profile/orders"
						data-sveltekit-preload-data="none"
						class="text-sm font-medium text-text-muted transition hover:text-brand-primary"
					>
						Mine ordre
					</a>
					<button
						onclick={logout}
						class="cursor-pointer rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
					>
						Logg ut
					</button>
				{:else}
					<a
						href="/auth/login"
						data-sveltekit-preload-data="none"
						class="text-sm font-medium text-text-muted transition hover:text-brand-primary"
					>
						Logg inn
					</a>
					<a
						href="/auth/register"
						data-sveltekit-preload-data="none"
						class="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
					>
						Bli kunde
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<button
				class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 md:hidden"
				onclick={toggleMenu}
				aria-label="Meny"
			>
				{#if menuOpen}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-6 w-6"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
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
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile Menu Dropdown -->
	{#if menuOpen}
		<div class="border-b border-stone-200 bg-white md:hidden">
			<nav class="flex flex-col space-y-1 p-4">
				<a
					href="/#om-veden"
					onclick={() => (menuOpen = false)}
					class="rounded-lg px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 hover:text-amber-700"
				>
					Om veden
				</a>
				<a
					href="/#kalkulator"
					onclick={() => (menuOpen = false)}
					class="rounded-lg px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 hover:text-amber-700"
				>
					Prisliste
				</a>
				<a
					href="/#kontakt"
					onclick={() => (menuOpen = false)}
					class="rounded-lg px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 hover:text-amber-700"
				>
					Kontakt
				</a>
				<a
					href="tel:+4791636186"
					onclick={() => (menuOpen = false)}
					class="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-brand-primary hover:bg-stone-50"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
					</svg>
					Ring oss: 916 36 186
				</a>

				<div class="my-2 border-t border-stone-100 pt-2">
					{#if $currentUser}
						<a
							href="/profile/orders"
							onclick={() => (menuOpen = false)}
							class="flex items-center rounded-lg px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 hover:text-amber-700"
						>
							Mine ordre
						</a>
						<button
							onclick={logout}
							class="flex w-full cursor-pointer items-center rounded-lg px-3 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50"
						>
							Logg ut
						</button>
					{:else}
						<a
							href="/auth/login"
							onclick={() => (menuOpen = false)}
							class="flex items-center rounded-lg px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 hover:text-amber-700"
						>
							Logg inn
						</a>
						<a
							href="/auth/register"
							onclick={() => (menuOpen = false)}
							class="mt-2 flex items-center justify-center rounded-full bg-amber-700 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-amber-600"
						>
							Bli kunde
						</a>
					{/if}
				</div>
			</nav>
		</div>
	{/if}
</header>

<main id="hovudinnhald">
	{@render children()}
</main>

<footer class="mt-auto border-t border-stone-200 bg-stone-50 py-12">
	<div class="container mx-auto px-4 text-center">
		<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
			<div class="text-left">
				<p class="text-sm font-bold text-stone-900">Din Jakt AS</p>
				<p class="text-xs text-stone-600">Org. nr: 993278408</p>
			</div>

			<nav class="flex flex-wrap justify-center gap-6 text-sm font-medium text-stone-600">
				<a href="/salgsvilkar" data-sveltekit-preload-data="none" class="transition hover:text-amber-700">Salsvilkår</a>
				<a href="/personvern" data-sveltekit-preload-data="none" class="transition hover:text-amber-700">Personvern</a>
				<a href="/#om-veden" class="transition hover:text-amber-700">Om veden</a>
			</nav>

			<div class="text-right text-xs text-stone-600">
				<p>
					<a
						href="https://fjelldata.com"
						target="_blank"
						rel="noopener noreferrer"
						class="transition-colors hover:text-stone-900"
					>
						Nettsida er utvikla, drifta og vedlikehalden av Fjelldata
					</a>
				</p>
				<p>© {new Date().getFullYear()} Haugalandsved</p>
			</div>
		</div>
	</div>
</footer>
