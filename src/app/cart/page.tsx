"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";
import { useAuth } from "@/src/context/AuthContext";
import { createOrder } from "@/src/services/orders.services";
import { showToast } from "nextjs-toast-notify";

function CartPage() {
  const {
    addToCart,
    cartItems,
    clearCart,
    getIdItems,
    getItemCount,
    getTotal,
    removeFromCart,
  } = useCart();

  const { dataUser } = useAuth();

  const handleCheckout = async () => {
    if (!dataUser?.token) {
      return;
    }
    await createOrder(getIdItems(), dataUser.token);
    clearCart();
    showToast.success("¡Compra Exitosa!", {
      duration: 4000,
      progress: true,
      position: "top-center",
      transition: "popUp",
      icon: "",
      sound: true,
    });
  };

  const itemCount = getItemCount();
  const total = getTotal();

  const handleRemove = (id: number) => {
    removeFromCart(id);
  };

  const handleClear = () => {
    if (cartItems.length === 0) return;
    const confirmClear = window.confirm(
      "¿Seguro que quieres vaciar el carrito?",
    );
    if (confirmClear) clearCart();
  };

  return (
    <div className="w-full min-h-screen bg-white flex justify-center items-start px-4 py-10">
      <section className=" w-full max-w-5xl flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            Carrito de Compras🛒
          </h1>
          <p className="text-black/80 text-sm sm:text-base">
            {itemCount === 0
              ? "Tu carrito está vacío."
              : `Tienes ${itemCount} producto${
                  itemCount > 1 ? "s" : ""
                } en tu carrito.`}
          </p>
        </header>

        {cartItems.length === 0 ? (
          <div className="shadow-lg rounded-2xl p-6 flex flex-col items-center gap-4">
            <p className="text-black text-center">
              Aún no has agregado productos a tu carrito.
            </p>
            <Link
              href="/"
              className="bg-azulapple text-white px-4 py-2 rounded-2xl text-sm sm:text-base hover:bg-azulapple/90 transition border-white"
            >
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className=" grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="shadow-lg rounded-xl p-4 flex gap-4 items-center"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 relative shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <h2 className="text-black font-semibold text-sm sm:text-base">
                      {item.name}
                    </h2>
                    <p className="text-black/80 text-sm">
                      COP{" "}
                      {item.price.toLocaleString("es-CO", {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id as number)}
                    className="cursor-pointer text-xs sm:text-sm text-red-500 hover:underline shrink-0"
                  >
                    Quitar❌
                  </button>
                </div>
              ))}
            </div>

            <aside className="bg-white/10 rounded-2xl p-5 flex flex-col gap-4 h-fit shadow-lg">
              <h2 className="text-lg font-semibold text-black">
                Resumen del pedido
              </h2>

              <div className="flex justify-between text-sm text-black/90">
                <span>Productos ({itemCount})</span>
                <span>
                  COP{" "}
                  {total.toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>

              <hr className="botext-black/20" />

              <div className=" flex justify-between items-center text-black font-semibold text-base">
                <span>Total 💳</span>

                <span>
                  COP{" "}
                  {total.toLocaleString("es-CO", {
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>

              <button
                className="bg-azulapple text-white w-full mt-2 py-2 rounded-2xl text-sm sm:text-base border border-white cursor-pointer hover:bg-azulapple/90 transition"
                onClick={handleCheckout}
              >
                Ir a pagar
              </button>

              <button
                className="cursor-pointer text-xs sm:text-sm text-red-500 mt-1 hover:underline"
                onClick={handleClear}
              >
                Vaciar carrito
              </button>

              <Link
                href="/"
                className="cursor-pointer text-xs sm:text-sm font-bold text-black/80 mt-2 hover:underline text-center"
              >
                Seguir comprando
              </Link>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

export default CartPage;
