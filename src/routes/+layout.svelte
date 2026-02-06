<script lang="ts">
	import './layout.css';
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
	<div class="container mx-auto flex h-16 items-center justify-between px-4">
		<a href="/" class="group flex items-center gap-3">
			<img
				src="/images/haugalandved-logo-transparent.webp"
				alt="Haugalandsved logo"
				class="h-10 w-auto transition duration-300 group-hover:scale-105"
			/>
			<span class="text-xl font-bold tracking-tight text-stone-900">Haugalandsved</span>
		</a>

		<nav class="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
			<a href="/#om-veden" class="transition hover:text-amber-700">Om veden</a>
			<a href="/#kalkulator" class="transition hover:text-amber-700">Prisliste</a>
			<a href="/#kontakt" class="transition hover:text-amber-700">Kontakt</a>
		</nav>

		<div class="flex items-center gap-4">
			<!-- Desktop Menu -->
			<div class="hidden items-center gap-4 md:flex">
				{#if $currentUser}
					<a
						href="/profile/orders"
						class="text-sm font-medium text-stone-600 transition hover:text-amber-700"
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
						class="text-sm font-medium text-stone-600 transition hover:text-amber-700"
					>
						Logg inn
					</a>
					<a
						href="/auth/register"
						class="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
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

<main>
	{@render children()}
</main>

<footer class="mt-auto border-t border-stone-200 bg-stone-50 py-12">
	<div class="container mx-auto px-4 text-center">
		<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
			<div class="text-left">
				<p class="text-sm font-bold text-stone-900">Din Jakt AS</p>
				<p class="text-xs text-stone-500">Org. nr: 993278408</p>
			</div>

			<nav class="flex flex-wrap justify-center gap-6 text-sm font-medium text-stone-600">
				<a href="/salgsvilkar" class="transition hover:text-amber-700">Salgsvilkår</a>
				<a href="/personvern" class="transition hover:text-amber-700">Personvern</a>
				<a href="/#om-veden" class="transition hover:text-amber-700">Om veden</a>
			</nav>

			<div class="text-right text-xs text-stone-400">
				<p>Driftes av Fjeldheim Services ENK (Fjelldata)</p>
				<p>© {new Date().getFullYear()} Haugalandsved</p>
			</div>
		</div>
	</div>
</footer>
