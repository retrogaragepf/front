// app/aboutus/page.tsx
import Link from "next/link";

export default function AboutUsPage() {
  return (
    <div className="w-full min-h-screen bg-amber-200">
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase text-black/70">
              RetroGarage
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black">
              Sobre nosotros
            </h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-black/80">
              Un marketplace C2C especializado en artículos vintage, retro y
              antigüedades: curado, confiable y pensado para encontrar piezas
              únicas sin perder tiempo.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-white text-sm font-semibold hover:opacity-90"
          >
            Volver al Home
          </Link>
        </header>

        {/* Divider */}
        <div className="mt-8 h-px w-full bg-black/10" />

        {/* Content */}
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main story */}
          <div className="lg:col-span-2 space-y-8">
            {/* Problema / Contexto */}
            <article className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 sm:p-8">
              <h2 className="text-xl font-bold text-black">
                Contexto
              </h2>
              <p className="mt-3 leading-relaxed text-black/80">
                El mercado de comercio electrónico C2C de artículos vintage,
                retro y antigüedades está fragmentado entre ventas de garaje
                presenciales y plataformas generalistas.
              </p>
              <p className="mt-3 leading-relaxed text-black/80">
                En esos espacios suele ser difícil encontrar piezas específicas,
                evaluar su autenticidad y generar confianza entre compradores y
                vendedores, lo que limita la comercialización efectiva de este
                tipo de productos.
              </p>
            </article>

            {/* Solución */}
            <article className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 sm:p-8">
              <h2 className="text-xl font-bold text-black">
                Nuestra Solucion
              </h2>
              <p className="mt-3 leading-relaxed text-black/80">
                RetroGarage digitaliza el concepto de “venta de garaje” para que
                cualquier adulto pueda publicar, vender o subastar artículos
                antiguos que ya no utiliza, evitando su almacenamiento
                prolongado.
              </p>
              <p className="mt-3 leading-relaxed text-black/80">
                A la vez, los compradores pueden buscar y adquirir productos en
                un entorno digital especializado, sin necesidad de desplazarse
                físicamente ni cambiar de ciudad, optimizando tiempo y costos.
              </p>
            </article>

            {/* Propuesta de valor */}
            <article className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 sm:p-8">
              <h2 className="text-xl font-bold text-black">
                Diferenciación
              </h2>
              <p className="mt-3 leading-relaxed text-black/80">
                Nuestro diferencial es el enfoque exclusivo en artículos vintage
                y antigüedades, acompañado de un sistema de reputación y
                feedback bidireccional entre compradores y vendedores, para
                fomentar una comunidad confiable.
              </p>
              <p className="mt-3 leading-relaxed text-black/80">
                Además, incorporamos criterios de publicación basados en
                productos legalmente permitidos y un flujo de envío con
                mensajería especializada, diferenciándonos de marketplaces
                genéricos por la especialización, la curaduría y el foco en la
                confianza.
              </p>
            </article>
          </div>

          {/* Right: highlights */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl bg-black text-white p-6">
              <h3 className="text-lg font-bold">Lo que defendemos</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/90">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                  Especialización: solo vintage, retro y antigüedades.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                  Confianza: reputación + feedback bidireccional.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                  Curaduría: mejor búsqueda y hallazgos reales.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300" />
                  Logística: envío con mensajería especializada.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6">
              <h3 className="text-lg font-bold text-black">
                ¿Qué puedes hacer aquí?
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-black/80">
                <li>• Explorar productos por categorías.</li>
                <li>• Publicar y vender artículos que ya no uses.</li>
                <li>• Comprar piezas únicas de manera segura.</li>
                <li>• Construir reputación como comprador/vendedor.</li>
              </ul>

              <Link
                href="/"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-black/20 bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-black/5"
              >
                Ir a ver productos
              </Link>
            </div>
          </aside>
        </section>

        {/* Footer mini */}
        <footer className="mt-12 rounded-2xl border border-black/10 bg-white/60 p-6 text-sm text-black/70">
          <p>RetroGarage — donde lo retro encuentra un nuevo hogar. 🏁</p>
        </footer>
      </main>
    </div>
  );
}
