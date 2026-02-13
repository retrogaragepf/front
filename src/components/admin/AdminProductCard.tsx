interface Props {
  product: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function AdminProductCard({
  product,
  onApprove,
  onReject,
}: Props) {
  return (
    <article className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all">
      
      {/* Imagen */}
      <div className="aspect-[4/3] bg-zinc-100 border-b-4 border-black">
        <img
          src={product.images?.[0] ?? "/placeholder.png"}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-3">
        <h2 className="font-extrabold text-lg tracking-tight">
          {product.title}
        </h2>

        <p className="text-zinc-600 font-medium">
          ${Number(product.price).toLocaleString()}
        </p>

        <div className="inline-block bg-yellow-100 border-2 border-yellow-600 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
          Pendiente de aprobación
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-3">
          <button
            onClick={() => onApprove(product.id)}
            className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold border-2 border-green-700 hover:bg-green-700 transition"
          >
            Aprobar
          </button>

          <button
            onClick={() => onReject(product.id)}
            className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold border-2 border-red-700 hover:bg-red-700 transition"
          >
            Desaprobar
          </button>
        </div>
      </div>
    </article>
  );
}
