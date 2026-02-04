import Link from "next/link";

function Footer() {
  return (
    <footer className="w-full bg-black text-white border-t border-neutral-800">
      <div className="w-full mx-auto max-w-7xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span className="text-sm text-gray-300 sm:text-center">
          Copyright © 2026{" "}
          <Link href="#" className="hover:underline font-medium">
            RetroGarage™
          </Link>
          . Todos los derechos reservados.
        </span>
        <ul className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-400">
          <li>
            <Link href="#" className="hover:underline">
              Acerca de.
            </Link>
          </li>
          <li>
            <Link href="#" className="hover:underline">
              Aviso legal.
            </Link>
          </li>
          <li>
            <Link href="#" className="hover:underline">
              Política de privacidad.
            </Link>
          </li>
          <li>
            <Link href="#" className="hover:underline">
              Americas.
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export default Footer;
