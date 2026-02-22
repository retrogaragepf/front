"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Card from "../components/Card";
import type { IProduct } from "@/src/interfaces/product.interface";
import { showToast } from "nextjs-toast-notify";

//SOLO TOKEN. KEY ARRIBA, API_BASE_URL DENTRO
const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || "retrogarage_auth";

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return isJson && text ? JSON.parse(text) : text;
}

export default function Product() {
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // SE DEBE LEER. DENTRO PAAR EVITAR ERRORES EN BUILD
        if (!API_BASE_URL)
          throw new Error("NEXT_PUBLIC_API_BASE_URL no está definido");

        const token = localStorage.getItem(TOKEN_KEY);

        const res = await fetch(`${API_BASE_URL}/products`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        const data = await parseJsonSafe(res);

        if (!res.ok) {
          const msg =
            typeof data === "string"
              ? data
              : data?.message
                ? Array.isArray(data.message)
                  ? data.message.join(", ")
                  : String(data.message)
                : "Error obteniendo productos";
          throw new Error(msg);
        }

        setAllProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        showToast.error(e?.message ?? "No se pudieron cargar productos");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-amber-300/60">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
          }}
        />
        <div className="pointer-events-none absolute -top-20 -right-24 w-80 h-80 rounded-full bg-emerald-800/15" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-amber-800/10" />

        <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <span className="font-typewriter inline-block px-3 py-1 bg-amber-800 text-amber-50 uppercase tracking-widest text-xs sm:text-sm -rotate-2">
              Liquidación de temporada
            </span>

            <h1 className="font-typewriter text-4xl sm:text-6xl md:text-7xl  leading-tight">
              Objetos con{" "}
              <span className="text-emerald-900  decoration-amber-600 underline-offset-8">
                historia
              </span>
              ,<br />
              precios de RetroGarage.
            </h1>

            <p className="font-typewriter text-base sm:text-lg max-w-xl text-zinc-800">
              Tesoros olvidados: desde maletas vintage hasta cámaras analógicas
              que aún sueñan con revelar rollos.
            </p>
          </div>

          <div className="flex-1 relative w-full max-w-md">
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 border-2 border-amber-50 shadow-2xl rotate-2 overflow-hidden rounded-sm">
                <Image
                  src="https://res.cloudinary.com/dyylxjijf/image/upload/v1770309885/homehero_idlclz.png"
                  alt="Vintage items"
                  fill
                  sizes="(max-width: 768px) 90vw, 420px"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-amber-300 p-2 shadow-lg -rotate-12 flex items-center justify-center text-center border border-amber-700/30">
                <p className="font-display  text-amber-950 leading-none text-lg">
                  ¡Sale 30% off!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section id="featured" className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
        <div className="flex items-end justify-between gap-6 mb-10 sm:mb-14">
          <div>
            <h2 className="font-typewriter text-2xl sm:text-4xl font-extrabold mb-2">
              Destacados de la semana
            </h2>
            <p className="font-typewriter text-amber-900 font-semibold">
              Recién llegados del ático
            </p>
          </div>
        </div>

        {loading ? (
          <p className="font-handwritten text-amber-900 font-semibold">
            Cargando productos...
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {allProducts?.slice(0, 8).map((product: any) => (
              <Card key={product.id ?? product.title} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
