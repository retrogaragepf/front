import Card from "../components/Card";
import { getAllProducts } from "../services/products.services";

export default async function Home() {
  const allProducts = await getAllProducts();

  return (
    <div className="w-full">
      <main className="flex flex-col items-center justify-start max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">RetroGarage™</h1>
        <p className="text-center font-bold mb-1">2026</p>

        <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
          {allProducts &&
            allProducts.map((product) => (
              <Card key={product.name} product={product} />
            ))}
        </section>
      </main>
    </div>
  );
}
