# Haugalandsved 🪵

Website and online store for selling locally sourced firewood from Haugalandet.

![Status](https://img.shields.io/website?url=https%3A%2F%2Fhaugalandsved.no&label=live&up_message=online&down_message=offline&style=flat-square)
![Svelte](https://img.shields.io/badge/svelte-%23f1413d.svg?style=flat-square&logo=svelte&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-%23B8DBE4.svg?style=flat-square&logo=pocketbase&logoColor=black)
![Dokploy](https://img.shields.io/badge/Hosted_on-Dokploy-blue?style=flat-square)

## 🚀 Deployment

The project is hosted on a self-built server and managed via **Dokploy**.

- **Live URL:** [https://haugalandsved.no](https://haugalandsved.no)
- **Admin Panel:** [https://haugalandsved.no/admin/dashboard](https://haugalandsved.no/admin/dashboard)

Deployment happens automatically via Dokploy (using Nixpacks buildpack) whenever changes are pushed to the `main` branch.

## 🛠 Tech Stack

The project is built using the following modern web technologies:

*   **Frontend:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **BaaS (self hosted):** [PocketBase](https://pocketbase.io/)
*   **Maps:** [Leaflet](https://leafletjs.com/)
*   **Payments:** [Stripe](https://stripe.com/)
*   **Hosting:** [Dokploy](https://dokploy.com/)

## 💻 Local Development

How to get started locally:

1.  **Clone the project:**
    ```bash
    git clone https://github.com/YourUsername/haugalandsved.git
    cd haugalandsved
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Copy `.env.example` to `.env` and fill in the necessary info (Stripe keys, PocketBase URL, etc.).

4.  **Start development server:**
    ```bash
    npm run dev
    ```
    The website is now available at `http://localhost:5173`.

## 📦 Building for Production

The project uses `adapter-node` and is configured for Docker/Nixpacks.

```bash
npm run build
# Start production server
npm run start
```
