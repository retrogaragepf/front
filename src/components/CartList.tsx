import CartItem from "./CartItem";

export default function CartList() {
  return (
    <section className="space-y-8">
      <h2 className="font-display text-2xl mb-6 flex items-center gap-2">
        Your Found Objects
      </h2>

      <div className="space-y-6">
        <CartItem />
        <CartItem />
        <CartItem />
      </div>

      <div className="mt-8">
        <a className="text-slate-600 hover:underline flex items-center gap-2">
          Back to the Garage
        </a>
      </div>
    </section>
  );
}