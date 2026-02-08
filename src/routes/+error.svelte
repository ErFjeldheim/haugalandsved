<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Sida finst ikkje - Haugalandsved</title>
	<meta name="description" content="Sida du leitar etter finst ikkje. Gå tilbake til forsida for å finna ved til fyringa di." />
</svelte:head>

<div class="min-h-screen bg-stone-50 px-4 py-20">
	<div class="container mx-auto max-w-2xl text-center">
		<div class="rounded-2xl bg-white p-12 shadow-xl ring-1 ring-stone-900/5">
			<div class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-12 w-12 text-amber-700"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zM12 15h.008v.008H12V15z"
					/>
				</svg>
			</div>

			<h1 class="mb-4 font-serif text-5xl font-bold text-stone-900">
				{page.status}
			</h1>
			<p class="mb-2 text-2xl font-semibold text-stone-800">Sida finst ikkje</p>
			<p class="mb-8 text-stone-600">
				Det ser ut som du har gått deg vill i skogen. Sida du ser etter finst ikkje, eller ho kan ha blitt flytta.
			</p>

			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a
					href="/"
					class="inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-4 w-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
						/>
					</svg>
					Gå til forsida
				</a>
				<a
					href="/#kontakt"
					class="text-sm font-medium text-stone-600 transition hover:text-brand-primary"
				>
					Kontakt oss &rarr;
				</a>
			</div>

			<div class="mt-12 border-t border-stone-200 pt-8">
				<p class="mb-4 text-sm text-stone-500">Eller utforsk meir:</p>
				<nav class="flex flex-wrap justify-center gap-6">
					<a href="/#om-veden" class="text-sm font-medium text-amber-700 transition hover:text-amber-600">
						Om veden
					</a>
					<a href="/#kalkulator" class="text-sm font-medium text-amber-700 transition hover:text-amber-600">
						Rekn ut pris
					</a>
					<a href="/salgsvilkar" class="text-sm font-medium text-amber-700 transition hover:text-amber-600">
						Salsvilkår
					</a>
				</nav>
			</div>
		</div>
	</div>
</div>
