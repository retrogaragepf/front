"use client";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { Span } from "next/dist/trace";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { showToast } from "nextjs-toast-notify";

function Navbar() {
  const { dataUser, logout } = useAuth();
  const router = useRouter();

  const { cartItems } = useCart();

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
    <div className="w-full flex justify-between items-center h-16 px-6 bg-black text-white">
      <Link href="/">
        <section>STRCO999™</section>
      </Link>

      <section>
        <nav>
          <ul className="flex gap-7 text-sm sm:text-base">
            <Link href="/">Home</Link>

            {dataUser && <Link href="/dashboard">Dashboard</Link>}

            <Link href="/cart">Cart</Link>

            {dataUser ? (
              <div className="flex gap-4">
                <p>{dataUser.user.name}</p>
                <button
                  className="cursor-pointer hover:underline text-red-600 "
                  onClick={handleLogout}
                >
                  {" "}
                  Logout{" "}
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link href="/login">Login</Link>
                <Link href="/register">Register</Link>
              </div>
            )}
          </ul>
        </nav>
      </section>
    </div>
  );
}

export default Navbar;
