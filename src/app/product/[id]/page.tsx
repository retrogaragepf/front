import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mockGetProductById } from "@/src/services/products.mock.service";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id;
  if (!id) notFound();

  let product;
  try {
    product = await mockGetProductById(id);
  } catch {
    notFound();
  }

  const imageUrl = product.images?.[0] ?? "";

  const priceNumber = Number(product.price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String(product.price);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/product" className="text-sm underline">
        Volver
      </Link>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-square bg-amber-100 border border-amber-300">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm">
              Sin imagen
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold">{product.title}</h1>
          <p className="text-lg font-bold">$ {priceFormatted}</p>

          {product.description && (
            <p className="text-zinc-700">{product.description}</p>
          )}

          <p className="text-sm text-zinc-600">Stock: {product.stock}</p>
        </div>
      </div>
    </main>
  );
}
