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
    <header className="w-full h-16 px-6 flex items-center justify-between bg-amber-800 text-amber-50 border-b border-amber-700">
      <Link href="/" className="font-semibold tracking-wide">
        RetroGarage™
      </Link>

      <nav>
        <ul className="flex items-center gap-6 text-sm sm:text-base">
          <li>
            <Link href="/" className="hover:underline underline-offset-4">
              Home
            </Link>
          </li>

          {dataUser && (
            <li>
              <Link
                href="/dashboard"
                className="hover:underline underline-offset-4"
              >
                Dashboard
              </Link>
            </li>
          )}

          <li>
            <Link
              href="/cart"
              className="flex items-center gap-2 hover:underline underline-offset-4"
            >
              Cart
              {itemsCart > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-800 text-amber-50">
                  {itemsCart}
                </span>
              )}
            </Link>
          </li>

          {dataUser ? (
            <li className="flex items-center gap-4">
              <p className="max-w-30 truncate">{dataUser.user.name}</p>
              <button
                className="cursor-pointer text-amber-50 hover:text-red-200 hover:underline underline-offset-4"
                onClick={handleLogout}
              >
                Logout
              </button>
            </li>
          ) : (
            <li className="flex items-center gap-4">
              <Link
                href="/login"
                className="hover:underline underline-offset-4"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 py-1 rounded-md bg-emerald-800 text-amber-50 hover:bg-emerald-900"
              >
                Register
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
