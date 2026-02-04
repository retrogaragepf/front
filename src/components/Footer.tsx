import Link from "next/link";

function Footer() {
  return (
    <footer className="w-full bg-amber-800 text-amber-50 border-t border-amber-700">
      <div className="w-full mx-auto max-w-7xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span className="text-sm text-amber-100 sm:text-center">
          Copyright © 2026{" "}
          <Link
            href="#"
            className="hover:underline underline-offset-4 font-semibold text-amber-50"
          >
            RetroGarage™
          </Link>
          . Todos los derechos reservados.
        </span>

        <ul className="flex flex-wrap items-center gap-4 text-sm font-medium text-amber-100">
          <li>
            <Link
              href="#"
              className="hover:text-emerald-200 hover:underline underline-offset-4"
            >
              Acerca de
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="hover:text-emerald-200 hover:underline underline-offset-4"
            >
              Aviso legal
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="hover:text-emerald-200 hover:underline underline-offset-4"
            >
              Política de privacidad
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="hover:text-emerald-200 hover:underline underline-offset-4"
            >
              Americas
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export default Footer;
