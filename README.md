# Haugalandsved 🪵

Nettside og nettbutikk for salg av kortreist ved på Haugalandet.

![Status](https://img.shields.io/website?url=https%3A%2F%2Fhaugalandsved.no&label=live&up_message=online&down_message=offline&style=flat-square)
![Svelte](https://img.shields.io/badge/svelte-%23f1413d.svg?style=flat-square&logo=svelte&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-%23B8DBE4.svg?style=flat-square&logo=pocketbase&logoColor=black)
![Dokploy](https://img.shields.io/badge/Hosted_on-Dokploy-blue?style=flat-square)

## 🚀 Deployment

Prosjektet er hostet på egen server og administreres via **Dokploy**.

- **Live URL:** [https://haugalandsved.no](https://haugalandsved.no)
- **Admin Panel:** [https://haugalandsved.no/admin](https://haugalandsved.no/admin)

Deployment skjer automatisk via Dokploy (med Nixpacks buildpack) hver gang det pushes til `main`-branchen.

## 🛠 Teknologistakk

Prosjektet er bygget på følgende moderne webteknologier:

*   **Frontend:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend / Database:** [PocketBase](https://pocketbase.io/)
*   **Kart:** [Leaflet](https://leafletjs.com/)
*   **Betaling:** [Stripe](https://stripe.com/)
*   **Hosting:** VPS med [Dokploy](https://dokploy.com/)

## 💻 Lokal utvikling

Slik kommer du i gang lokalt:

1.  **Klon prosjektet:**
    ```bash
    git clone https://github.com/DittBrukernavn/haugalandsved.git
    cd haugalandsved
    ```

2.  **Installer avhengigheter:**
    ```bash
    npm install
    ```

3.  **Konfigurer miljøvariabler:**
    Kopier `.env.example` til `.env` og fyll inn nødvendig info (Stripe nøkler, PocketBase URL osv).

4.  **Start utviklingsserver:**
    ```bash
    npm run dev
    ```
    Nettsiden er nå tilgjengelig på `http://localhost:5173`.

## 📦 Bygging for produksjon

Prosjektet bruker `adapter-node` og er konfigurert for Docker/Nixpacks.

```bash
npm run build
# Start produksjonsserver
npm run start
```
