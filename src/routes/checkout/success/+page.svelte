<script lang="ts">
</script>

<svelte:head>
	<title>Takk for bestillinga di! - Haugalandsved</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-20">
	<div
		class="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-stone-200/5 md:p-12"
	>
		<div class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
			<svg class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<h1 class="mb-4 text-3xl font-black text-stone-900 md:text-4xl">Takk for handelen!</h1>
		<p class="mb-8 text-lg leading-relaxed text-stone-600">
			Bestillingen din er mottatt. Ein ordrebekreftelse er sendt til e-postadressen din.
		</p>

		<div class="space-y-4">
			<a
				href="/"
				class="block w-full rounded-xl bg-brand-primary px-6 py-4 text-center text-sm font-bold text-white shadow-lg transition hover:bg-brand-primary-hover"
			>
				Tilbake til forsida
			</a>
			<p class="text-xs text-stone-500">
				Har du spørsmål? Kontakt oss på <a href="mailto:norleifj@online.no" class="underline"
					>norleifj@online.no</a
				>
			</p>
		</div>
	</div>
</div>
