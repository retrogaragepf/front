import CartList from "@/src/components/CartList";
import Receipt from "@/src/components/Receipt";
import SellerNote from "@/src/components/SellerNote";

export default function CartPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 md:p-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <CartList />
        </div>

        <div className="space-y-8">
          <Receipt />
          <SellerNote />
        </div>
      </div>
    </main>
  );
}