import Link from "next/link";

function Footer() {
  return (
    <footer className="w-full bg-amber-100 text-zinc-900 border-t-2 border-amber-300">
      {/* BLOQUE GRANDE */}
      <div className="max-w-7xl mx-auto px-8 sm:px-10 lg:pl-8 lg:pr-12 pt-14 pb-10 grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-x-14">
        {/* Marca */}
        <div className="w-full max-w-55 mx-auto md:mx-0 md:pr-8 space-y-5 text-center">
          <h3 className="text-1xl font-extrabold tracking-wide text-amber-900">
            RetroGarage™
          </h3>

          <p className="font-handwritten text-sm text-zinc-700 leading-relaxed max-w-65 mx-auto text-center">
            Objetos con alma que buscan un segundo hogar. No somos una tienda,
            somos un portal al pasado.
          </p>

          <div className="flex items-center justify-center gap-4 text-amber-900">
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-amber-500 bg-amber-50 flex items-center justify-center hover:bg-amber-200 transition"
              aria-label="Instagram"
              title="Instagram"
            >
              IG
            </button>

            <button
              type="button"
              className="w-9 h-9 rounded-full border border-amber-800 bg-amber-50 flex items-center justify-center hover:bg-amber-200 transition"
              aria-label="Facebook"
              title="Facebook"
            >
              f
            </button>

            <button
              type="button"
              className="w-9 h-9 rounded-full border border-amber-300 bg-amber-50 flex items-center justify-center hover:bg-amber-200 transition"
              aria-label="Compartir"
              title="Compartir"
            >
              ↗
            </button>
          </div>
        </div>

        {/* Categorías */}
        <div className="w-full max-w-55 mx-auto md:pl-4 text-center">
          <h3 className="!text-base font-extrabold tracking-widest uppercase text-amber-900 mb-4">
            Categorías
          </h3>
          <ul className="font-handwritten space-y-2.5 !text-xs text-zinc-700">
            <li>
              <Link
                href="/categories/ropa-accesorios"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Ropa y Accesorios
              </Link>
            </li>
            <li>
              <Link
                href="/categories/tecnologia-retro"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Tecnología Retro
              </Link>
            </li>
            <li>
              <Link
                href="/categories/decoracion-hogar"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Decoración y Hogar
              </Link>
            </li>
            <li>
              <Link
                href="/categories/coleccionables"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Coleccionables
              </Link>
            </li>

            <li>
              <Link
                href="/categories/autos-garaje"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Autos y Garaje
              </Link>
            </li>
            <li>
              <Link
                href="/categories/muebles-antiguos"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Muebles Antiguos
              </Link>
            </li>
          </ul>
        </div>

        {/* Ayuda */}
        <div className="w-full max-w-[220px] mx-auto text-center">
          <h3 className="!text-base font-extrabold tracking-widest uppercase text-amber-900 mb-4">
            Ayuda
          </h3>
          <ul className="space-y-2.5 !text-xs text-zinc-700">
            <li>
              <Link
                href="/preguntas-frecuentes"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Preguntas Frecuentes
              </Link>
            </li>

            <li>
              <Link
                href="/envios"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Envíos
              </Link>
            </li>
            <li>
              <Link
                href="/devoluciones"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Devoluciones
              </Link>
            </li>
            <li>
              <Link
                href="/guia-de-estado"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Guía de Estado
              </Link>
            </li>
          </ul>
        </div>

        {/* Registro */}
        <div className="w-full max-w-[220px] mx-auto text-center">
          <h3 className="!text-base font-extrabold tracking-widest uppercase text-amber-900 mb-4">
            Acceso de Usuario
          </h3>
          <ul className="space-y-2.5 !text-xs text-zinc-700">
            <li>
              <Link
                href="/register"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Registro
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Ingreso
              </Link>
            </li>
          </ul>
        </div>

        {/* Visítanos */}
        <div className="w-full max-w-[220px] mx-auto text-center">
          <h3 className="!text-base font-extrabold tracking-widest uppercase text-amber-900 mb-4">
            Visítanos
          </h3>
          <p className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4">
            www.retrogaragepf.com
          </p>
          <p className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4">
            Calle de los Anticuarios 42 <br />
            Barrio Viejo, CP 28001
          </p>
        </div>
      </div>

      {/* BARRA INFERIOR */}
      <div className="border-t border-amber-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>© 2026 RetroGarage™ — Hecho con amor analógico.</p>

          <div className="flex gap-6">
            <button
              type="button"
              className="hover:text-emerald-900 hover:underline underline-offset-4"
            >
              Privacidad
            </button>
            <button
              type="button"
              className="hover:text-emerald-900 hover:underline underline-offset-4"
            >
              Términos
            </button>
            <button
              type="button"
              className="hover:text-emerald-900 hover:underline underline-offset-4"
            >
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
