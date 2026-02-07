<script lang="ts">
</script>

<svelte:head>
	<title>Takk for din bestilling! - Haugalandsved</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-brand-background px-4 py-20">
	<div
		class="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-brand-border/5 md:p-12"
	>
		<div class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-brand-success-light">
			<svg class="h-12 w-12 text-brand-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		</div>

		<h1 class="mb-4 text-3xl font-black text-brand-text md:text-4xl">Takk for handelen!</h1>
		<p class="mb-8 text-lg leading-relaxed text-brand-text-light">
			Din bestilling er nå bekreftet. En ordrebekreftelse har blitt sendt til din e-postadresse.
		</p>

		<div class="space-y-4">
			<a
				href="/"
				class="block w-full rounded-xl bg-brand-primary px-6 py-4 text-center text-sm font-bold text-white shadow-lg transition hover:bg-brand-primary-hover"
			>
				Tilbake til forsiden
			</a>
			<p class="text-xs text-brand-text-lighter">
				Har du spørsmål? Kontakt oss på <a href="mailto:norleifj@online.no" class="underline"
					>norleifj@online.no</a
				>
			</p>
		</div>
	</div>
</div>
