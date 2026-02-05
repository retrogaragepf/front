import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/src/services/products.services";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) notFound();

  const product = await getProductById(id);

  return (
    <div className="w-full bg-amber-200 text-zinc-900">
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/" className="underline">
          Volver
        </Link>

        <section className="mt-6 grid gap-8 md:grid-cols-2 items-start">
          <div className="w-full">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-amber-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <p className="mt-4 text-base leading-relaxed">
              {product.description}
            </p>

            <p className="mt-6 text-2xl font-semibold">
              ${product.price.toLocaleString("es-CO")}
            </p>

            <p className="mt-2 text-sm">
              Stock: <span className="font-semibold">{product.stock}</span>
            </p>

            <button className="mt-8 w-full md:w-auto px-6 py-3 rounded-xl bg-black text-amber-200 font-semibold hover:opacity-90 transition">
              Agregar al carrito
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
