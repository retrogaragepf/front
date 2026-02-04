import Card from "../components/Card";
import { getAllProducts } from "../services/products.services";

export default async function Home() {
  const allProducts = await getAllProducts();

  return (
    <div className="w-full bg-amber-200 text-zinc-900">
      <main className="flex flex-col items-center justify-start max-w-6xl mx-auto px-4 py-10">
        <header className="w-full text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            RetroGarage™
          </h1>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-10 bg-amber-800/60" />
            <p className="font-semibold text-amber-900">2026</p>
            <span className="h-px w-10 bg-amber-800/60" />
          </div>

          <p className="mt-4 text-sm sm:text-base text-zinc-800">
            Marketplace vintage: compra, vende y descubre piezas retro.
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800 text-amber-50">
              Retro picks
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-800 text-amber-50">
              Envío seguro
            </span>
          </div>
        </header>

        <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
          {allProducts?.map((product) => (
            <Card key={product.name} product={product} />
          ))}
        </section>
      </main>
    </div>
  );
}
