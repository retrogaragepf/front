// import Card from "../components/Card";
// import { getAllProducts } from "../services/products.services";

// export default async function Home() {
//   const allProducts = await getAllProducts();

//   return (
//     <div className="w-full bg-amber-200 text-zinc-900">
//       <main className="flex flex-col items-center justify-start max-w-6xl mx-auto px-4 py-10">
//         <header className="w-full text-center mb-8">
//           <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
//             RetroGarage™
//           </h1>

//           <div className="mt-2 flex items-center justify-center gap-2">
//             <span className="h-px w-10 bg-amber-800/60" />
//             <p className="font-semibold text-amber-900">2026</p>
//             <span className="h-px w-10 bg-amber-800/60" />
//           </div>

//           <p className="mt-4 text-sm sm:text-base text-zinc-800">
//             Marketplace vintage: compra, vende y descubre piezas retro.
//           </p>

//           <div className="mt-5 flex items-center justify-center gap-3">
//             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800 text-amber-50">
//               Retro picks
//             </span>
//             <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-800 text-amber-50">
//               Envío seguro
//             </span>
//           </div>
//         </header>

//         <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
//           {allProducts?.map((product) => (
//             <Card key={product.name} product={product} />
//           ))}
//         </section>
//       </main>
//     </div>
//   );
// }

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
            <span className="inline-block px-3 py-1 bg-amber-800 text-amber-50 font-bold uppercase tracking-widest text-xs sm:text-sm -rotate-2">
              Liquidación de temporada
            </span>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight">
              Objetos con{" "}
              <span className="text-emerald-900  decoration-amber-600 underline-offset-8">
                historia
              </span>
              ,<br />
              precios de garage.
            </h1>

            <p className="text-base sm:text-lg max-w-xl text-zinc-800">
              Curaduría de tesoros olvidados: desde maletas vintage hasta
              cámaras analógicas que aún sueñan con revelar rollos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="#featured"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-50 px-6 py-3 font-semibold shadow-md border border-emerald-900/30 transition"
              >
                Explorar el garage <span aria-hidden>→</span>
              </a>

              <a
                href="#featured"
                className="inline-flex items-center justify-center rounded-xl bg-amber-100 hover:bg-amber-50 text-amber-900 px-6 py-3 font-semibold border border-amber-300 transition"
              >
                Ver destacados
              </a>
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-md">
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 border-8 border-amber-50 shadow-2xl rotate-2 overflow-hidden rounded-sm">
                <Image
                  src=""
                  alt="Vintage items"
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-amber-300 p-2 shadow-lg -rotate-12 flex items-center justify-center text-center border border-amber-700/30">
                <p className="font-extrabold text-amber-950 leading-none text-lg">
                  ¡TODO AL 50%!
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
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-2">
              Destacados de la semana
            </h2>
            <p className="text-amber-900 font-semibold">
              Recién llegados del ático
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {allProducts?.slice(0, 8).map((product) => (
            <Card key={product.name} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
