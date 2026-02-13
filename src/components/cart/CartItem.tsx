export default function CartItem() {
  return (
    <div className="flex items-center gap-6 p-6 bg-white rounded-xl border shadow-sm relative">
      <div className="w-24 h-24 bg-slate-200 rounded-lg" />

      <div className="flex-1">
        <h3 className="font-handwritten text-lg font-bold">
          1970s Wood-Grain Radio
        </h3>
        <p className="italic text-slate-500 text-sm">
          Works perfectly, slight scratch on the dial.
        </p>

        <div className="flex items-center gap-4 mt-4">
          <span className="font-bold text-xl">$45.00</span>

          <div className="flex items-center border rounded-lg">
            <button className="px-2">-</button>
            <span className="px-3">1</span>
            <button className="px-2">+</button>
          </div>
        </div>
      </div>

      <button className="absolute top-4 right-4 text-slate-400">
        delete_outline
      </button>
    </div>
  );
}
