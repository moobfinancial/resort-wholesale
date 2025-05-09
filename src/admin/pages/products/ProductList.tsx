import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { useProductStore } from "../../../stores/productStore";
import toast from "react-hot-toast";

export default function ProductList() {
  const { products, fetchProducts, deleteProduct, loading } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load products on mount
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

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (productId: string) => {
    if (!productId) return;

    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsDeleting(productId);
      try {
        await deleteProduct(productId);
        await fetchProducts(); // Refresh the list after deletion
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete product"
        );
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Products
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all products in your store
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            to="/admin/products/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus
              className="inline-block -ml-0.5 mr-1.5 h-5 w-5"
              aria-hidden="true"
            />
            Add Product
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

      {/* Search and Filter */}
      <div className="mt-4 flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search products..."
            />
          </div>
        </div>
        <div className="w-64">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Product List */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
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
                  {!loading && filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6"
                      >
                        No products found. Click "Add Product" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {product.imageUrl && (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={product.imageUrl}
                                  alt={product.name}
                                  // onError={(e) => {
                                  //   const target = e.target as HTMLImageElement;
                                  //   const currentSrc = target.src;

                                  //   // Prevent infinite loop - if already trying to load placeholder, stop
                                  //   if (currentSrc.includes('placeholder')) {
                                  //     return;
                                  //   }

                                  //   // Try with /images/products/ path
                                  //   if (!currentSrc.includes('/images/products/')) {
                                  //     const filename = product.imageUrl.split('/').pop();
                                  //     if (filename) {
                                  //       target.src = `/images/products/${filename}`;
                                  //       return; // Exit early to give this a chance to load
                                  //     }
                                  //   }
                                  //   // Try uploads directory
                                  //   else if (!currentSrc.includes('placeholder')) {
                                  //     const filename = product.imageUrl.split('/').pop();
                                  //     if (filename) {
                                  //       target.src = `/uploads/products/${filename}`;
                                  //       return; // Exit early to give this a chance to load
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
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                navigate(`/admin/products/${product.id}`)
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/admin/products/${product.id}/edit`)
                              }
                              className="text-amber-600 hover:text-amber-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={isDeleting === product.id}
                              title="Delete"
                            >
                              {isDeleting === product.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
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
