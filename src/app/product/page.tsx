import Card from "@/src/components/Card";
import { getAllProducts } from "@/src/services/products.services";

export default async function ProductsPage() {
  const allProducts = await getAllProducts();

  return (
    <div className="w-full bg-amber-200 text-zinc-900">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-amber-300/60">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
          }}
        />
        <div className="pointer-events-none absolute -top-20 -right-24 w-80 h-80 rounded-full bg-emerald-800/15" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-amber-800/10" />

        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <span className="inline-block px-3 py-1 bg-amber-800 text-amber-50 font-bold uppercase tracking-widest text-xs sm:text-sm -rotate-2">
            Catálogo RetroGarage
          </span>

          <div className="mt-6 flex flex-col gap-3 sm:gap-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
              Todos los{" "}
              <span className="text-emerald-900 decoration-amber-600 underline-offset-8">
                productos
              </span>
            </h1>

            <p className="text-base sm:text-lg max-w-2xl text-zinc-800">
              Explora el inventario completo del mock: reliquias retro, piezas
              únicas y hallazgos con historia.
            </p>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
        <div className="flex items-end justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-2">
              Productos disponibles
            </h2>
            <p className="text-amber-900 font-semibold">
              {allProducts?.length ?? 0} artículos en el catálogo
            </p>
          </div>
        </div>

        {!allProducts || allProducts.length === 0 ? (
          <div className="border border-amber-300/70 bg-amber-50/60 p-6 sm:p-8">
            <p className="font-semibold text-zinc-900">
              No hay productos para mostrar.
            </p>
            <p className="text-zinc-700 mt-1">
              Revisa tu helper/mock o el servicio <code>getAllProducts()</code>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {allProducts.map((product) => (
              <Card key={product.id ?? product.name} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
