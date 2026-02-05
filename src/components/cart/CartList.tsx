import CartItem from "./CartItem";

export default function CartList() {
  return (
    <section className="space-y-8">
      <h2 className="font-display text-2xl mb-6">
        Your Found Objects
      </h2>

      <CartItem />
      <CartItem />
      <CartItem />
    </section>
  );
}