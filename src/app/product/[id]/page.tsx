import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mockGetProductById } from "@/src/services/products.mock.service";

type Params = { id: string };

export default async function ProductDetailPage(props: {
  params: Params | Promise<Params>;
}) {
  const params = await props.params;
  const id = params?.id;

  if (!id) notFound();

  let product;
  try {
    product = await mockGetProductById(id);
  } catch (err) {
    console.error("mockGetProductById error:", err);
    notFound();
  }

  const imageUrl = product.images?.[0] ?? "";

  const priceNumber = Number(product.price);
  const priceFormatted = Number.isFinite(priceNumber)
    ? priceNumber.toLocaleString("es-CO", { minimumFractionDigits: 0 })
    : String(product.price);

  return (
    <div className="w-full bg-amber-100 text-zinc-900">
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Back / breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href="/product"
            className="font-handwritten text-sm font-extrabold tracking-wide text-amber-900 uppercase border-b-2 border-transparent hover:border-amber-800 hover:text-emerald-900 transition"
          >
            ← Volver a productos
          </Link>

          <span className="text-amber-900/40">•</span>
        </div>

        {/* Card */}
        <section
          className="
            mt-6
            rounded-2xl
            border-2 border-amber-900
            bg-amber-50
            shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]
            overflow-hidden
          "
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="p-5 md:p-6 border-b-2 md:border-b-0 md:border-r-2 border-amber-900">
              <div className="relative aspect-square rounded-xl border border-amber-300 bg-amber-100 overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700 text-sm font-semibold">
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Mini etiqueta retro */}
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-300 bg-amber-100 text-amber-900 text-xs font-extrabold tracking-widest uppercase">
                  Vintage Verified
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-900/30 bg-emerald-800 text-amber-50 text-xs font-extrabold tracking-widest uppercase">
                  Stock: {product.stock}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 md:p-6">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide text-amber-900">
                {product.title}
              </h1>

              <p className="mt-2 text-lg md:text-xl font-extrabold text-zinc-900">
                $ <span className="text-emerald-950">{priceFormatted}</span>{" "}
                <span className="text-sm font-semibold text-zinc-600">COP</span>
              </p>

              {product.description && (
                <p className="mt-4 text-zinc-700 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Divider */}
              <div className="my-6 h-[2px] w-full bg-amber-300" />

              {/* Actions (placeholder estilo Navbar) */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="
                    w-full sm:w-auto
                    px-4 py-3 rounded-xl border-2 border-emerald-950
                    bg-emerald-900 text-amber-50 font-extrabold tracking-wide text-sm
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                    hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                    active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                    transition
                  "
                  type="button"
                >
                  Agregar al carrito 🛒
                </button>

                <Link
                  href="/cart"
                  className="
                    w-full sm:w-auto text-center
                    font-handwritten px-4 py-3 rounded-xl
                    border-2 border-amber-900
                    bg-amber-50 text-amber-900 font-extrabold tracking-wide text-sm
                    shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)]
                    hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)]
                    active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)]
                    transition
                  "
                >
                  Ver carrito
                </Link>
              </div>

              {/* Nota mini */}
              <p className="mt-4 text-xs text-zinc-600">
                Tip: si el stock llega a 0, podemos deshabilitar el botón y
                mostrar “Agotado” con badge rojo/amber.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
