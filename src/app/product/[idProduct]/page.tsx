import AddToCartButton from "@/src/components/AddToCartButton";
import { IProduct } from "@/src/interfaces/product.interface";
import { getProductById } from "@/src/services/products.services";
import { notFound } from "next/navigation";
import Link from "next/link";

interface ProductDetailPageProps {
  params: {
    idProduct: string;
  };
}

async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { idProduct } = await params;

  let product: IProduct;

  try {
    product = await getProductById(idProduct);
  } catch (error) {
    notFound();
  }

  return (
    <div className="bg-white">
      <div className="pt-6">
        <div className="mx-auto mt-6 max-w-2xl sm:px-6">
          <img
            alt={"Image error"}
            src={product.image}
            className="row-span-2 aspect-4/5 size-full object-cover sm:rounded-lg lg:aspect-3/4"
            width={800}
            height={800}
          />
        </div>

        <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
          <div className="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
          </div>

          <div className="mt-4 lg:row-span-3 lg:mt-0 flex flex-col gap-6">
            <h2 className="sr-only">Product information</h2>
            <p className="font-bold text-center text-3xl tracking-tight text-gray-900">
              COP$
              {product.price.toLocaleString("es-CO", {
                minimumFractionDigits: 0,
              })}
            </p>

            <AddToCartButton product={product} />

            <Link
              href="/"
              className="
               
            
                  bg-azulapple
                  cursor-pointer
                  text-amber-50
                  rounded-lg
                  px-4
                  py-2
                  w-full
                  hover:bg-azulapple/80
                  transition
                  text-center
                "
            >
              Volver al Home
            </Link>
          </div>

          <div className="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">
            <div>
              <h3 className="sr-only">Description</h3>

              <div className="space-y-6">
                <p className="text-base text-gray-900">{product.description}</p>
              </div>
            </div>

            <div className="mt-10">
              <div className="mt-4"></div>
            </div>

            <div className="mt-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
