import Image from "next/image";
import Card from "../components/Card";
import { getAllProducts } from "../services/products.services";

export default async function Page() {
  const allProducts = await getAllProducts();

  return (
    <div className="w-full bg-amber-200 text-zinc-900">
      {/* HERO */}
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

        <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <span className="font-display inline-block px-3 py-1 bg-amber-800 text-amber-50 uppercase tracking-widest text-xs sm:text-sm -rotate-2">
              Liquidación de temporada
            </span>

            <h1 className=" font-handwritten  text-4xl sm:text-6xl md:text-7xl  leading-tight">
              Objetos con{" "}
              <span className="text-emerald-900  decoration-amber-600 underline-offset-8">
                historia
              </span>
              ,<br />
              precios de RetroGarage.
            </h1>

            <p className="font-handwritten text-base sm:text-lg max-w-xl text-zinc-800">
              Tesoros olvidados: desde maletas vintage hasta cámaras analógicas
              que aún sueñan con revelar rollos.
            </p>
          </div>

          <div className="flex-1 relative w-full max-w-md">
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 border-2 border-amber-50 shadow-2xl rotate-2 overflow-hidden rounded-sm">
                <Image
                  src="https://res.cloudinary.com/dyylxjijf/image/upload/v1770309885/homehero_idlclz.png"
                  alt="Vintage items"
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-amber-300 p-2 shadow-lg -rotate-12 flex items-center justify-center text-center border border-amber-700/30">
                <p className="font-display  text-amber-950 leading-none text-lg">
                  ¡Sale!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section id="featured" className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
        <div className="flex items-end justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <h2 className="font-handwritten text-2xl sm:text-4xl font-extrabold mb-2">
              Destacados de la semana
            </h2>
            <p className="font-handwritten text-amber-900 font-semibold">
              Recién llegados del ático
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {allProducts?.slice(0, 8).map((product) => (
            <Card key={product.title} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
