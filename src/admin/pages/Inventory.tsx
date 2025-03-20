import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useProductStore } from "../../stores/productStore";

// interface Product {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   stock: number;
//   category: string;
//   imageUrl?: string;
//   sku?: string;
// }

export default function Inventory() {
  const { products, fetchProducts, loading } = useProductStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        await fetchProducts();
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products"
        );
        console.error("Error loading products:", err);
      }
    };

    loadProducts();
  }, [fetchProducts]);

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Inventory
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your inventory with current stock levels.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link to="/admin/products/new" className="btn flex items-center">
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add product
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading products
              </h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Stock
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {!loading && products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6"
                      >
                        No products found. Click "Add product" to create one.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {product.imageUrl && (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={product.imageUrl}
                                  alt={product.name}
                                  // onError={(e) => {
                                  //   const target = e.target as HTMLImageElement;

                                  //   // Prevent infinite loop with placeholder
                                  //   if (target.src.includes('placeholder')) {
                                  //     return;
                                  //   }

                                  //   // Try with /images/products/ path
                                  //   if (!target.src.includes('/images/products/')) {
                                  //     const filename = product.imageUrl.split('/').pop();
                                  //     if (filename) {
                                  //       target.src = `/images/products/${filename}`;
                                  //       return;
                                  //     }
                                  //   }
                                  //   // Try uploads directory
                                  //   else if (!target.src.includes('placeholder')) {
                                  //     const filename = product.imageUrl.split('/').pop();
                                  //     if (filename) {
                                  //       target.src = `/uploads/products/${filename}`;
                                  //       return;
                                  //     }
                                  //   }

                                  //   // Final fallback
                                  //   target.src = '/images/products/placeholder.jpg';
                                  // }}
                                />
                              )}
                              {!product.imageUrl && (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">
                                    {product.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-gray-500">{product.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          $
                          {typeof product.price === "number"
                            ? product.price.toFixed(2)
                            : typeof product.price === "string"
                            ? parseFloat(product.price).toFixed(2)
                            : "0.00"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.stock}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/admin/products/${product.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
