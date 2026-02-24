"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import Card from "@/src/components/Card";
import { getAllProducts } from "@/src/services/products.services";

const CATEGORY_SLUG_TO_ID: Record<string, string> = {
  "ropa-accesorios": "d73a8f0d-703f-4890-bba1-cffecd40271c",
  "tecnologia-retro": "130961b9-22f3-4fdf-93e2-9eed4a0d4dd5",
  "decoracion-hogar": "6d281dc5-d83e-4c75-85c8-1fc7f755f450",
  coleccionables: "3d4da119-a95c-41ce-b45c-e5f5fbafc7d8",
  "autos-garaje": "1d23d8f1-8e80-4e18-92e3-b93dc77ceb73",
  "muebles-antiguos": "297be8b6-431a-4938-880a-22f413ebe76d",
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
            className="text-amber-900 hover:text-emerald-900 transition text-xl font-extrabold tracking-wide"
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
