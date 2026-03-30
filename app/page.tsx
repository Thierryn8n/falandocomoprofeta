import HomePageClient from "./home-page-client"

/** Rota estática: sem await em params/searchParams (evita edge cases de hidratação em dev). */
export default function Page() {
  return <HomePageClient />
}
