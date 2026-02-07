import Card from "@/src/components/Card";
import { mockGetAllProducts } from "@/src/services/products.mock.service";

export default async function ProductPage() {
  const products = await mockGetAllProducts();

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-6">Productos</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <Card key={p.id} product={p} />
        ))}
      </section>
    </main>
  );
}
