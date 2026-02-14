import Link from "next/link";

type Category = {
  slug: string; // lo que va en la URL
  id: string; // UUID real en DB
  name: string;
  description: string;
  emoji: string;
};

const CATEGORIES: Category[] = [
  {
    slug: "ropa-accesorios",
    id: "11c146c3-a99c-48d7-b04e-3068abcc7295",
    name: "Ropa & Accesorios",
    description:
      "Chaquetas vintage, camisetas retro, gorras, cinturones y más.",
    emoji: "🧥",
  },
  {
    slug: "tecnologia-retro",
    id: "5a969f68-e239-485d-b281-d33692317e46",
    name: "Tecnología Retro",
    description: "Consolas, radios, cámaras, walkman y tesoros electrónicos.",
    emoji: "📼",
  },
  {
    slug: "decoracion-hogar",
    id: "c4eee638-343b-42ea-9568-cd2f968e9bd4",
    name: "Decoración & Hogar",
    description: "Lámparas, cuadros, vajillas, pósters y piezas con historia.",
    emoji: "🛋️",
  },
  {
    slug: "coleccionables",
    id: "d55fe09b-bb15-49a3-aeb9-99378c82fa38",
    name: "Coleccionables",
    description: "Figuras, vinilos, cómics, cards y objetos de colección.",
    emoji: "🧸",
  },
  {
    slug: "autos-garaje",
    id: "cb35a1d8-aff0-4b39-a8de-0c2de3a4214b",
    name: "Autos & Garaje",
    description: "Accesorios, herramientas clásicas y memorabilia automotriz.",
    emoji: "🏁",
  },
  {
    slug: "muebles-antiguos",
    id: "d2b33220-7370-4102-86d3-d6b0a5a64828",
    name: "Muebles Antiguos",
    description: "Muebles restaurables, madera clásica y diseño atemporal.",
    emoji: "🪑",
  },
];

export default async function CategoriesPage() {
  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3"></div>

        <header className="mt-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-amber-900">
            Categorías principales
          </h1>
          <p className="mt-2 text-zinc-700 max-w-2xl leading-relaxed">
            Explora lo mejor del universo retro: piezas con historia, estilo y
            carácter. Elige una categoría y empieza tu cacería vintage.
          </p>
        </header>

        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="
                group
                h-full
                rounded-2xl
                border-2 border-amber-900
                bg-amber-50
                shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]
                hover:-translate-y-0.5px
                hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.85)]
                transition
                overflow-hidden
                flex flex-col
              "
            >
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{cat.emoji}</span>
                    <h2 className="text-lg font-extrabold tracking-wide text-amber-900 group-hover:text-emerald-900 transition truncate">
                      {cat.name}
                    </h2>
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-300 bg-amber-100 text-amber-900 text-[10px] font-extrabold tracking-widest uppercase shrink-0">
                    Ver
                  </span>
                </div>

                <p
                  className="
                    mt-3 text-sm text-zinc-700 leading-relaxed
                    min-h-13
                    overflow-hidden
                    [display:-webkit-box]
                    [-webkit-box-orient:vertical]
                    [-webkit-line-clamp:2]
                  "
                >
                  {cat.description}
                </p>

                <div className="my-5 h-0.5 w-full bg-amber-300" />

                <div className="mt-auto flex items-center justify-between gap-3">
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
                      shrink-0
                    "
                    aria-hidden
                    title="Abrir"
                  >
                    →
                  </span>
                </div>
              </div>

              <div className="h-2 bg-emerald-900" />
            </Link>
          ))}
        </section>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/product"
            className="
              w-full sm:w-auto text-center
              font-handwritten px-4 py-3 rounded-xl
              border-2 border-amber-900
              bg-amber-50 text-amber-900 font-extrabold tracking-wide text-sm
              shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
              hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
              active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
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
              hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
              active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
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
