<script lang="ts">
  let count = $state(10);
  let deliveryMethod = $state<'pickup' | 'delivery'>('pickup');
  
  const PRICE_PER_SACK = 990;
  const DELIVERY_PRICE_PER_3 = 1000;
  
  let woodCost = $derived(count * PRICE_PER_SACK);
  let shippingCost = $derived(
    deliveryMethod === 'delivery' 
      ? Math.ceil(count / 3) * DELIVERY_PRICE_PER_3 
      : 0
  );
  let totalCost = $derived(woodCost + shippingCost);

  const woodTypes = [
    { name: 'Furu', description: 'Lettantennelig og gir god varme.' },
    { name: 'Bjørk', description: 'Klassikeren med høy brennverdi og pen flamme.' },
    { name: 'Gran', description: 'Gnstrer litt, men gir lun god varme.' },
    { name: 'Rogn', description: 'Hard ved som brenner lenge.' },
    { name: 'Selje', description: 'God blandingsved med fin glød.' }
  ];
</script>

<svelte:head>
  <title>Haugalandsved - Kortreist kvalitet</title>
  <meta name="description" content="Kjøp kortreist blandingsved av høy kvalitet fra Haugalandet. Levering rett hjem eller hent selv." />
</svelte:head>

<div class="min-h-screen bg-stone-50 font-sans text-stone-800">
  
  <!-- HERO SECTION -->
  <section class="relative bg-stone-900 py-20 text-white lg:py-32 overflow-hidden">
    <!-- Abstract background pattern -->
    <div class="absolute inset-0 opacity-20">
        <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-600 blur-3xl"></div>
        <div class="absolute top-1/2 right-0 h-64 w-64 rounded-full bg-orange-900 blur-3xl"></div>
    </div>

    <div class="container relative mx-auto px-4 text-center">
      <h1 class="mb-6 font-serif text-4xl font-bold tracking-tight text-amber-50 sm:text-6xl lg:text-7xl">
        Varme fra Haugalandet
      </h1>
      <p class="mx-auto mb-10 max-w-2xl text-lg text-stone-300 sm:text-xl">
        Kortreist blandingsved i 1000L storsekker. Furu, bjørk, gran, rogn og selje – ferdig kappet og kløyvd, klar til å varme hjemmet ditt.
      </p>
      <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a href="#kalkulator" class="rounded-full bg-amber-700 px-8 py-4 text-lg font-semibold text-white transition hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-900/20 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900">
          Bestill nå
        </a>
        <a href="#om-veden" class="text-sm font-medium text-stone-400 hover:text-white transition">
          Les mer om veden &rarr;
        </a>
      </div>
    </div>
  </section>

  <!-- CALCULATOR SECTION -->
  <section id="kalkulator" class="py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-900/5 lg:flex">
        
        <!-- Controls -->
        <div class="p-8 lg:w-3/5 lg:p-12">
          <h2 class="mb-6 text-2xl font-bold text-stone-900">Beregn pris</h2>
          
          <div class="space-y-8">
            <!-- Quantity -->
            <div>
              <label for="quantity" class="block text-sm font-medium text-stone-700">Antall storsekker (1000L)</label>
              <div class="mt-2 flex items-center gap-4">
                <input 
                  type="range" 
                  id="quantity-range" 
                  min="1" 
                  max="30" 
                  bind:value={count}
                  class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-amber-700"
                />
                <input 
                  type="number" 
                  id="quantity" 
                  min="1" 
                  max="30" 
                  bind:value={count}
                  class="block w-20 rounded-md border-0 py-1.5 text-center text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm sm:leading-6"
                />
              </div>
              <p class="mt-2 text-sm text-stone-500">Maks 30 sekker per bestilling.</p>
            </div>

            <!-- Delivery Method -->
            <fieldset>
              <legend class="text-sm font-medium text-stone-700">Levering</legend>
              <div class="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <!-- Hent selv -->
                <label class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
                  class:border-amber-600={deliveryMethod === 'pickup'}
                  class:ring-2={deliveryMethod === 'pickup'}
                  class:ring-amber-600={deliveryMethod === 'pickup'}
                  class:border-stone-300={deliveryMethod !== 'pickup'}>
                  <input type="radio" name="delivery-method" value="pickup" bind:group={deliveryMethod} class="sr-only">
                  <span class="flex flex-1">
                    <span class="flex flex-col">
                      <span class="block text-sm font-medium text-stone-900">Hent selv</span>
                      <span class="mt-1 flex items-center text-sm text-stone-500">Gratis frakt</span>
                      <span class="mt-6 text-xs font-medium text-stone-900">Vea Sæbøvikv. 136</span>
                    </span>
                  </span>
                  <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center border-stone-300"
                    class:border-transparent={deliveryMethod === 'pickup'}
                    class:bg-amber-600={deliveryMethod === 'pickup'}>
                    {#if deliveryMethod === 'pickup'}
                        <span class="h-1.5 w-1.5 rounded-full bg-white"></span>
                    {/if}
                  </span>
                  <span class="absolute -inset-px rounded-lg border-2 pointer-events-none" aria-hidden="true"
                    class:border-amber-600={deliveryMethod === 'pickup'}
                    class:border-transparent={deliveryMethod !== 'pickup'}></span>
                </label>

                <!-- Levering -->
                <label class="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
                  class:border-amber-600={deliveryMethod === 'delivery'}
                  class:ring-2={deliveryMethod === 'delivery'}
                  class:ring-amber-600={deliveryMethod === 'delivery'}
                  class:border-stone-300={deliveryMethod !== 'delivery'}>
                  <input type="radio" name="delivery-method" value="delivery" bind:group={deliveryMethod} class="sr-only">
                  <span class="flex flex-1">
                    <span class="flex flex-col">
                      <span class="block text-sm font-medium text-stone-900">Levering</span>
                      <span class="mt-1 flex items-center text-sm text-stone-500">1000 kr per 3 paller</span>
                      <span class="mt-6 text-xs font-medium text-stone-900">Rett hjem til deg</span>
                    </span>
                  </span>
                  <span class="mt-0.5 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center border-stone-300"
                    class:border-transparent={deliveryMethod === 'delivery'}
                    class:bg-amber-600={deliveryMethod === 'delivery'}>
                    {#if deliveryMethod === 'delivery'}
                        <span class="h-1.5 w-1.5 rounded-full bg-white"></span>
                    {/if}
                  </span>
                  <span class="absolute -inset-px rounded-lg border-2 pointer-events-none" aria-hidden="true"
                    class:border-amber-600={deliveryMethod === 'delivery'}
                    class:border-transparent={deliveryMethod !== 'delivery'}></span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>

        <!-- Summary -->
        <div class="bg-stone-50 p-8 lg:w-2/5 lg:p-12 border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col justify-between">
          <div>
            <h2 class="text-lg font-medium text-stone-900">Oversikt</h2>
            <dl class="mt-6 space-y-4">
              <div class="flex items-center justify-between">
                <dt class="text-sm text-stone-600">Ved ({count} x {PRICE_PER_SACK},-)</dt>
                <dd class="text-sm font-medium text-stone-900">{woodCost.toLocaleString()} kr</dd>
              </div>
              <div class="flex items-center justify-between border-t border-stone-200 pt-4">
                <dt class="flex items-center text-sm text-stone-600">
                  Frakt
                  {#if deliveryMethod === 'delivery'}
                    <span class="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600">
                      {Math.ceil(count / 3)} tur(er)
                    </span>
                  {/if}
                </dt>
                <dd class="text-sm font-medium text-stone-900">{shippingCost.toLocaleString()} kr</dd>
              </div>
              <div class="flex items-center justify-between border-t border-stone-200 pt-4">
                <dt class="text-base font-medium text-stone-900">Totalt</dt>
                <dd class="text-2xl font-bold text-amber-700">{totalCost.toLocaleString()} kr</dd>
              </div>
            </dl>
             <p class="mt-2 text-xs text-stone-500 italic">Alle priser inkl. mva.</p>
          </div>

          <div class="mt-8">
            <button class="w-full rounded-md bg-stone-900 px-3.5 py-3.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 transition-colors">
              Gå til betaling
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRODUCT INFO SECTION -->
  <section id="om-veden" class="bg-white py-16 lg:py-24">
    <div class="container mx-auto px-4">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl text-pretty">Kvalitet i hver sekk</h2>
        <p class="mt-4 text-lg leading-8 text-stone-600">
          Vår blandingsved består av de beste tresortene fra lokale skoger. 
          Pakket i 1000L sekker på europall for enkel håndtering.
        </p>
      </div>
      <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-5">
          {#each woodTypes as wood}
            <div class="flex flex-col items-center text-center">
              <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
                <!-- Tree Icon Placeholder (using simple SVG for rustic feel) -->
                 <svg class="h-8 w-8 text-amber-700" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <dt class="text-base font-semibold leading-7 text-stone-900">
                {wood.name}
              </dt>
              <dd class="mt-1 flex flex-auto flex-col text-base leading-7 text-stone-600">
                <p class="flex-auto">{wood.description}</p>
              </dd>
            </div>
          {/each}
        </dl>
      </div>
    </div>
  </section>

  <!-- CALL TO ACTION (Footer-like) -->
  <section class="bg-orange-900 py-16 text-center text-white">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-pretty">Klar for vinteren?</h2>
      <p class="mx-auto mt-6 max-w-xl text-lg text-orange-100">
        Sikre deg tørr og fin ved i dag. Vi leverer raskt og effektivt.
      </p>
      <div class="mt-10 flex items-center justify-center gap-x-6">
        <a href="#kalkulator" class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-orange-900 shadow-sm hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">
          Bestill ved nå
        </a>
      </div>
    </div>
  </section>

</div>
