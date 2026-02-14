"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import Card from "@/src/components/Card";
import { getAllProducts } from "@/src/services/products.services";

const CATEGORY_SLUG_TO_ID: Record<string, string> = {
  "ropa-accesorios": "11c146c3-a99c-48d7-b04e-3068abcc7295",
  "tecnologia-retro": "5a969f68-e239-485d-b281-d33692317e46",
  "decoracion-hogar": "c4eee638-343b-42ea-9568-cd2f968e9bd4",
  coleccionables: "d55fe09b-bb15-49a3-aeb9-99378c82fa38",
  "autos-garaje": "cb35a1d8-aff0-4b39-a8de-0c2de3a4214b",
  "muebles-antiguos": "d2b33220-7370-4102-86d3-d6b0a5a64828",
};

export default function CategoryProductsPage() {
  const params = useParams();
  const slug = (params as any)?.slug as string | undefined;

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getAllProducts();
        setProducts(res as any);
      } catch {
        setProducts([]);
      }
    };
    run();
  }, []);

  const categoryId = slug ? CATEGORY_SLUG_TO_ID[slug] : undefined;

  const filtered = useMemo(() => {
    if (!categoryId) return [];
    return products.filter((p) => p?.category?.id === categoryId);
  }, [products, categoryId]);

  if (!slug || !categoryId) return null; // sin "loading", sin texto

  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold tracking-wide">
          <Link
            href="/categories"
            className="text-amber-900 hover:text-emerald-900 transition"
          >
            Categorías
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-800">{slug}</span>
        </div>

        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {filtered.map((p) => (
            <Card key={p.id} product={p} />
          ))}
        </section>
      </main>
    </div>
  );
}
