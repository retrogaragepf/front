"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

function Navbar() {
  const { dataUser, logout } = useAuth();
  const router = useRouter();

  const { cartItems } = useCart();
  const itemsCart = cartItems.length;

  // ✅ Blindado: aunque dataUser venga null/undefined o con forma distinta
  const safeName =
    (dataUser as any)?.user?.name ??
    (dataUser as any)?.name ??
    (dataUser as any)?.user?.fullName ??
    (dataUser as any)?.fullName ??
    (dataUser as any)?.user?.username ??
    (dataUser as any)?.username ??
    "";

  // ✅ Logged: soporta varios shapes
  const isLogged =
    Boolean((dataUser as any)?.user?.email) ||
    Boolean((dataUser as any)?.email) ||
    Boolean((dataUser as any)?.user) ||
    Boolean(dataUser);

  const handleLogout = () => {
    logout();
    showToast.warning("¡Salida Exitosa!", {
      duration: 4000,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
    router.push("/");
  };

  return (
    <header className="w-full bg-amber-100 text-zinc-900 border-b-2 border-amber-300 sticky top-0 z-50">
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* IZQUIERDA: Brand */}
        <Link
          href="/"
          className="text-xl font-extrabold tracking-wide text-amber-900 hover:text-emerald-900 transition"
        >
          RetroGarage™
        </Link>

        {/* CENTRO: Links */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2">
          <ul className="flex items-center gap-8 text-sm font-extrabold tracking-wide text-amber-900 uppercase list-none m-0 p-0">
            <li>
              <Link
                href="/aboutus"
                className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Sobre Nosotros
              </Link>
            </li>

            <li>
              <Link
                href="/product"
                className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Productos Destacados
              </Link>
            </li>

            <li>
              <Link
                href="/categories"
                className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Categorias
              </Link>
            </li>
          </ul>
        </nav>

        {/* DERECHA: acciones */}
        <div className="flex items-center gap-3">
          {/* Cart icon-like */}
          <Link
            href="/cart"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-200 transition"
            aria-label="Carrito"
            title="Carrito"
          >
            <span className="text-amber-900 font-extrabold">🛒</span>
            {itemsCart > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-800 text-amber-50 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-emerald-900/30">
                {itemsCart}
              </span>
            )}
          </Link>

          {/* ✅ Mi Perfil SOLO si está logeado */}
          {isLogged ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:block max-w-35 truncate text-sm font-semibold text-zinc-800 hover:text-emerald-900 transition"
              >
                {safeName || "Mi Perfil"}
              </Link>

              <button
                onClick={handleLogout}
                className="
                  px-3 py-2 rounded-xl border-2 border-amber-900
                  bg-amber-50 text-amber-900 font-bold text-sm
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                  hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                  active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                  transition
                "
              >
                Salida
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Acceso */}
              <Link
                href="/login"
                className="
                  font-handwritten px-4 py-2 rounded-xl
                  border-2 border-amber-900
                  bg-amber-50 text-amber-900
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                  hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                  active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                  transition
                "
              >
                Acceso
              </Link>

              {/* Registro */}
              <Link
                href="/register"
                className="
                  font-handwritten px-4 py-2 rounded-xl
                  border-2 border-emerald-950
                  bg-emerald-900 text-amber-50
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                  hover:-translate-y-px hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                  active:translate-y-px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                  transition
                "
              >
                Registro
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE: nav centrada debajo */}
      <div className="md:hidden border-t border-amber-300">
        <nav className="max-w-7xl mx-auto px-6 py-3">
          <ul className="flex items-center justify-center gap-6 text-xs font-extrabold tracking-widest uppercase text-amber-900 list-none m-0 p-0">
            <li>
              <Link
                href="/aboutus"
                className="hover:text-emerald-900 transition"
              >
                Sobre Nosotros
              </Link>
            </li>

            <li>
              <Link
                href="/product"
                className="hover:text-emerald-900 transition"
              >
                Productos
              </Link>
            </li>

            {/* ✅ Mobile Dashboard SOLO si está logeado */}
            {isLogged && (
              <li>
                <Link
                  href="/dashboard"
                  className="font-handwritten border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
                >
                  Mi Perfil
                </Link>
              </li>
            )}

            <li>
              <Link href="/cart" className="hover:text-emerald-900 transition">
                Carrito
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
