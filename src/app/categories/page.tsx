import Link from "next/link";

type Category = {
  id: string;
  name: string;
  description: string;
  emoji: string;
};

const CATEGORIES: Category[] = [
  {
    id: "ropa-accesorios",
    name: "Ropa & Accesorios",
    description:
      "Chaquetas vintage, camisetas retro, gorras, cinturones y más.",
    emoji: "🧥",
  },
  {
    id: "tecnologia-retro",
    name: "Tecnología Retro",
    description: "Consolas, radios, cámaras, walkman y tesoros electrónicos.",
    emoji: "📼",
  },
  {
    id: "decoracion-hogar",
    name: "Decoración & Hogar",
    description: "Lámparas, cuadros, vajillas, pósters y piezas con historia.",
    emoji: "🛋️",
  },
  {
    id: "coleccionables",
    name: "Coleccionables",
    description: "Figuras, vinilos, cómics, cards y objetos de colección.",
    emoji: "🧸",
  },
  {
    id: "autos-garaje",
    name: "Autos & Garaje",
    description: "Accesorios, herramientas clásicas y memorabilia automotriz.",
    emoji: "🏁",
  },
  {
    id: "muebles-antiguos",
    name: "Muebles Antiguos",
    description: "Muebles restaurables, madera clásica y diseño atemporal.",
    emoji: "🪑",
  },
];

export default async function CategoriesPage() {
  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Top nav */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-extrabold tracking-widest text-amber-900 uppercase border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
          >
            Home
          </Link>

          <span className="text-amber-900/40">•</span>

          <span className="font-handwritten text-sm font-extrabold tracking-wide text-amber-900 uppercase">
            Categorías
          </span>
        </div>

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-amber-900">
            Categorías principales
          </h1>
          <p className="mt-2 text-zinc-700 max-w-2xl leading-relaxed">
            Explora lo mejor del universo retro: piezas con historia, estilo y
            carácter. Elige una categoría y empieza tu cacería vintage.
          </p>
        </header>

        {/* Grid */}
        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.id}`}
              className="
                group
                rounded-2xl
                border-2 border-amber-900
                bg-amber-50
                shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]
                hover:-translate-y-[2px]
                hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.85)]
                transition
                overflow-hidden
              "
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <h2 className="text-lg font-extrabold tracking-wide text-amber-900 group-hover:text-emerald-900 transition">
                      {cat.name}
                    </h2>
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-300 bg-amber-100 text-amber-900 text-[10px] font-extrabold tracking-widest uppercase">
                    Ver
                  </span>
                </div>

                <p className="mt-3 text-sm text-zinc-700 leading-relaxed">
                  {cat.description}
                </p>

                <div className="my-5 h-[2px] w-full bg-amber-300" />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold tracking-widest uppercase text-zinc-700">
                    Curado por RetroGarage™
                  </span>

                  <span
                    className="
                      inline-flex items-center justify-center
                      w-9 h-9 rounded-full
                      border border-amber-300 bg-amber-50
                      text-amber-900 font-extrabold
                      group-hover:bg-amber-200
                      transition
                    "
                    aria-hidden
                    title="Abrir"
                  >
                    →
                  </span>
                </div>
              </div>

              {/* Footer accent */}
              <div className="h-2 bg-emerald-900" />
            </Link>
          ))}
        </section>

        {/* Bottom actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/product"
            className="
              w-full sm:w-auto text-center
              font-handwritten px-4 py-3 rounded-xl
              border-2 border-amber-900
              bg-amber-50 text-amber-900 font-extrabold tracking-wide text-sm
              shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
              hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
              active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
              transition
            "
          >
            Ver todos los productos
          </Link>

          <Link
            href="/aboutus"
            className="
              w-full sm:w-auto text-center
              px-4 py-3 rounded-xl border-2 border-emerald-950
              bg-emerald-900 text-amber-50 font-extrabold tracking-wide text-sm
              shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
              hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
              active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
              transition
            "
          >
            Conoce RetroGarage™
          </Link>
        </div>
      </main>
    </div>
  );
}
