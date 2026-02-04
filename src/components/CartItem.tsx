export default function CartItem() {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="w-32 h-32 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <div className="w-full h-full bg-slate-200" />
      </div>

      <div className="grow text-center sm:text-left">
        <h3 className="font-handwritten text-xl font-bold">
          1970s Wood-Grain Radio
        </h3>

        <p className="text-slate-500 mt-1 italic">
          Works perfectly, slight scratch on the dial.
        </p>

        <div className="mt-4 flex items-center justify-center sm:justify-start gap-4">
          <span className="font-bold text-xl">$45.00</span>

          <div className="flex items-center border rounded-lg border-slate-300">
            <button className="px-2 py-1 hover:bg-slate-100">-</button>
            <span className="px-3 border-x border-slate-300">1</span>
            <button className="px-2 py-1 hover:bg-slate-100">+</button>
          </div>
        </div>
      </div>

      <button className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
        <span className="material-icons">delete_outline</span>
      </button>
    </div>
  );
}
