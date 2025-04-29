import React, { useEffect, useState, useTransition } from "react";
import { useProductStore } from "../stores/frontendProductStore";
import ProductGrid from "../components/products/ProductGrid";
import ProductFilters from "../components/products/ProductFilters";
import Pagination from "../components/common/Pagination";
import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Products() {
  const location = useLocation();
  const [isPending, startTransition] = useTransition();

  const {
    products,
    categories,
    loading,
    error,
    totalPages,
    currentPage,
    fetchProducts,
    fetchCategories,
    fetchFeaturedProducts,
    fetchNewArrivals,
    featuredProducts,
    newArrivals,
    setCurrentPage,
  } = useProductStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Determine what type of products to display based on the route
  const isNewArrivals = location.pathname === "/products/new-arrivals";
  const isFeatured = location.pathname === "/products/featured";
  const pageTitle = isNewArrivals
    ? "New Arrivals"
    : isFeatured
    ? "Featured Products"
    : "All Products";
  console.log("products", products);
  useEffect(() => {
    startTransition(() => {
      fetchCategories();
    });
  }, [fetchCategories]);

  useEffect(() => {
    startTransition(() => {
      if (isNewArrivals) {
        fetchNewArrivals();
      } else if (isFeatured) {
        fetchFeaturedProducts();
      } else {
        fetchProducts({
          category: selectedCategory,
          search: searchQuery,
          sort: sortBy,
          page: currentPage,
          limit: 12,
        });
      }
    });
  }, [
    selectedCategory,
    searchQuery,
    sortBy,
    currentPage,
    fetchProducts,
    fetchFeaturedProducts,
    fetchNewArrivals,
    isNewArrivals,
    isFeatured,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      fetchProducts({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
        page: 1,
        limit: 12,
      });
      setCurrentPage(1);
    });
  };

  // Determine which products to display based on the route
  const displayProducts = isNewArrivals
    ? newArrivals
    : isFeatured
    ? featuredProducts
    : products;

  // Display a loading state when transitions are pending
  const isLoading = loading || isPending;

  return (
    <div className="bg-white">
      <div>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between border-b border-gray-200 pb-6 pt-24">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {pageTitle}
            </h1>

            {!isNewArrivals && !isFeatured && (
              <div className="flex items-center">
                <form onSubmit={handleSearch} className="relative mr-4">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="rounded-md border-gray-300 py-2 pl-3 pr-10 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <Search className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <section aria-labelledby="products-heading" className="pb-24 pt-6">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>

            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
              {/* Filters */}
              {!isNewArrivals && !isFeatured && (
                <div className="hidden lg:block">
                  <ProductFilters
                    categories={categories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                  />
                </div>
              )}

              {/* Product grid */}
              <div
                className={
                  !isNewArrivals && !isFeatured
                    ? "lg:col-span-3"
                    : "lg:col-span-4"
                }
              >
                {error ? (
                  <div className="text-center py-12">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : (
                  <>
                    <ProductGrid
                      products={displayProducts}
                      loading={isLoading}
                      pricingMode="wholesale"
                    />

                    {!isLoading &&
                      !isNewArrivals &&
                      !isFeatured &&
                      totalPages > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                        />
                      )}
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
