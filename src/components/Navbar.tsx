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
          <ul className="flex items-center gap-8 text-sm font-extrabold tracking-wide text-amber-900 uppercase">
            <li>
              <Link
                href="/"
                className="border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Home
              </Link>
            </li>

            {dataUser && (
              <li>
                <Link
                  href="/dashboard"
                  className="border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
                >
                  Dashboard
                </Link>
              </li>
            )}

            <li>
              <Link
                href="/aboutus"
                className="border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
              >
                Sobre Nosotros
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
            <span className="text-amber-900 font-extrabold">👜</span>
            {itemsCart > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-800 text-amber-50 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-emerald-900/30">
                {itemsCart}
              </span>
            )}
          </Link>

          {dataUser ? (
            <div className="flex items-center gap-3">
              <p className="hidden sm:block max-w-35 truncate text-sm font-semibold text-zinc-800">
                {dataUser.user.name}
              </p>

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-200 text-amber-900 font-bold text-sm transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-200 text-amber-900 font-bold text-sm transition"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-50 font-bold text-sm transition border border-emerald-900/30"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE: nav centrada debajo */}
      <div className="md:hidden border-t border-amber-300">
        <nav className="max-w-7xl mx-auto px-6 py-3">
          <ul className="flex items-center justify-center gap-6 text-xs font-extrabold tracking-widest uppercase text-amber-900">
            <li>
              <Link href="/" className="hover:text-emerald-900 transition">
                Home
              </Link>
            </li>

            {dataUser && (
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-emerald-900 transition"
                >
                  Dashboard
                </Link>
              </li>
            )}

            <li>
              <Link href="/cart" className="hover:text-emerald-900 transition">
                Cart
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
