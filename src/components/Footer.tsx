import Link from "next/link";

function Footer() {
  return (
    <footer className="w-full bg-amber-100 text-zinc-900 border-t-2 border-amber-300">
      {/* BLOQUE GRANDE */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Marca */}
        <div className="space-y-5">
          <h2 className="text-3xl font-extrabold tracking-wide text-amber-900">
            RetroGarage™
          </h2>

          <p className="font-handwritten text-sm text-zinc-700 leading-relaxed max-w-xs">
            Objetos con alma que buscan un segundo hogar. No somos una tienda,
            somos un portal al pasado.
          </p>

          <div className="flex items-center gap-4 text-amber-900">
            <Link
              href="#"
              className="w-9 h-9 rounded-full border border-amber-300 bg-amber-50 flex items-center justify-center hover:bg-amber-200 transition"
              aria-label="Instagram"
              title="Instagram"
            >
              IG
            </Link>

            <Link
              href="#"
              className="w-9 h-9 rounded-full border border-amber-300 bg-amber-50 flex items-center justify-center hover:bg-amber-200 transition"
              aria-label="Facebook"
              title="Facebook"
            >
              f
            </Link>

            <Link
              href="#"
              className="w-9 h-9 rounded-full border border-amber-300 bg-amber-50 flex items-center justify-center hover:bg-amber-200 transition"
              aria-label="Compartir"
              title="Compartir"
            >
              ↗
            </Link>
          </div>
        </div>

        {/* Categorías */}
        <div>
          <h3 className="text-sm font-extrabold tracking-widest uppercase text-amber-900 mb-5">
            Categorías
          </h3>
          <ul className="font-handwritten space-y-3 text-sm text-zinc-700">
            <li>
              <Link
                href="#"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Decoración
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="font-handwrittenhover:text-emerald-900 hover:underline underline-offset-4"
              >
                Electrónica Retro
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Mobiliario Industrial
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Libros y Papel
              </Link>
            </li>
          </ul>
        </div>

        {/* Ayuda */}
        <div>
          <h3 className="font-handwritten text-sm font-extrabold tracking-widest uppercase text-amber-900 mb-5">
            Ayuda
          </h3>
          <ul className="space-y-3 text-sm text-zinc-700">
            <li>
              <Link
                href="#"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Envíos
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Devoluciones
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Guía de Estado
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="font-handwritten hover:text-emerald-900 hover:underline underline-offset-4"
              >
                Preguntas Frecuentes
              </Link>
            </li>
          </ul>
        </div>

        {/* Visítanos */}
        <div>
          <h3 className="text-sm font-extrabold tracking-widest uppercase text-amber-900 mb-5">
            Visítanos
          </h3>
          <p className="font-handwritten text-sm text-zinc-700 leading-relaxed mb-4">
            www.retrogaragepf.com
          </p>
          <p className="font-handwritten text-sm text-zinc-700 leading-relaxed">
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
            <Link
              href="#"
              className="hover:text-emerald-900 hover:underline underline-offset-4"
            >
              Privacidad
            </Link>
            <Link
              href="#"
              className="hover:text-emerald-900 hover:underline underline-offset-4"
            >
              Términos
            </Link>
            <Link
              href="#"
              className="hover:text-emerald-900 hover:underline underline-offset-4"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
