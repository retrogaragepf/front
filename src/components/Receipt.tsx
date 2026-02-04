export default function Receipt() {
  return (
    <div className="bg-white border-4 border-slate-900 p-8 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] overflow-hidden">
      <h2 className="font-display text-3xl mb-8 border-b-2 border-dashed pb-4">
        Receipt
      </h2>

      <div className="space-y-4 font-handwritten text-lg">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>$95.50</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping:</span>
          <span>$8.00</span>
        </div>

        <div className="flex justify-between text-emerald-700">
          <span>Discount:</span>
          <span>- $5.00</span>
        </div>

        <div className="pt-6 mt-6 border-t-4 border-double flex justify-between text-2xl font-bold">
          <span>TOTAL:</span>
          <span>$98.50</span>
        </div>
      </div>

      <div className="mt-12 relative">
        <div className="tape-effect inline-block px-8 py-2 absolute -top-4 left-1/2 -translate-x-1/2 w-4/5 text-center z-10">
          <span className="font-handwritten font-bold uppercase tracking-widest text-sm">
            Coupon Code?
          </span>
        </div>

        <div className="flex mt-8 gap-2 w-full max-w-full">
          <input
            className="flex-1 min-w-0 border-2 p-3 rounded-lg font-mono text-sm uppercase"
            placeholder="HAGGLER20"
          />
          <button className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap">
            Apply
          </button>
        </div>
      </div>

      <button className="w-full mt-12 bg-amber-400 hover:bg-amber-300 text-slate-900 font-display text-2xl py-5 px-6 rounded-xl shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all flex items-center justify-center gap-3 leading-none">
        <span>Checkout Now</span>
      </button>
    </div>
  );
}