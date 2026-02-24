"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Card from "../components/Card";
import type { IProduct } from "@/src/interfaces/product.interface";
import { showToast } from "nextjs-toast-notify";

// SOLO TOKEN. KEY ARRIBA, API_BASE_URL DENTRO
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
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // SE DEBE LEER DENTRO para evitar errores en build
        if (!API_BASE_URL) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL no está definido");
        }

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

      <section className="hero-retro relative overflow-hidden border-b border-amber-300/60">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
          }}
        />
        <div className="pointer-events-none absolute -top-20 -right-24 h-80 w-80 rounded-full bg-emerald-800/15" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-amber-800/10" />

        {/* ✅ balance texto/imagen */}
        <div className="relative mx-auto grid max-w-[1420px] grid-cols-1 items-center gap-10 px-4 py-14 sm:gap-12 sm:py-20 md:grid-cols-[1.03fr_1fr] lg:gap-14">
          {/* Texto */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <span className="font-typewriter inline-block -rotate-2 bg-amber-800 px-3 py-1 text-xs uppercase tracking-widest text-amber-50 sm:text-sm">
                Liquidación de temporada
              </span>

              {/* ✅ 4 renglones exactos */}
              <h1 className="font-typewriter text-zinc-950">
                Objetos con
                <br />
                <span className="inline-block text-emerald-900">historia,</span>
                <br />
                precios de
                <br />
                RetroGarage.
              </h1>
            </div>

            <p className="font-typewriter max-w-xl text-[15px] leading-relaxed text-zinc-800 sm:text-base">
              Tesoros olvidados: desde maletas vintage hasta cámaras analógicas
              que aún sueñan con revelar rollos.
            </p>
          </div>

          {/* Imagen */}
          <div className="relative w-full max-w-[680px] justify-self-center md:justify-self-end">
            <div className="relative aspect-square w-full">
              <div className="absolute inset-0 rotate-[1.6deg] overflow-hidden rounded-sm border-2 border-amber-50 shadow-2xl">
                <Image
                  src="https://res.cloudinary.com/dyylxjijf/image/upload/v1770309885/homehero_idlclz.png"
                  alt="Vintage items"
                  fill
                  sizes="(max-width: 768px) 92vw, (max-width: 1280px) 48vw, 680px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Sticky note */}
              <div className="absolute -bottom-4 left-2 z-10 w-28 -rotate-12 border border-amber-700/30 bg-amber-300 p-2 shadow-lg sm:-bottom-5 sm:left-3 sm:w-32 sm:p-2.5 md:-bottom-6 md:left-0">
                <p className="font-display text-center text-base leading-none text-amber-950 sm:text-lg">
                  ¡Sale 30% off!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section id="featured" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-6 sm:mb-14">
          <div>
            <h2 className="mb-2 font-typewriter text-2xl font-extrabold sm:text-4xl">
              Destacados de la semana
            </h2>
            <h4 className="font-typewriter font-semibold text-amber-900">
              Recién llegados del ático
            </h4>
          </div>
        </div>

        {loading ? (
          <p className="font-handwritten font-semibold text-amber-900">
            Cargando productos...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
            {allProducts?.slice(0, 8).map((product: any) => (
              <Card key={product.id ?? product.title} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
