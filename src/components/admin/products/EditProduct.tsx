import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductStore } from "../../../stores/productStore";
import ProductForm from "./ProductForm";
import toast from "react-hot-toast";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProduct, updateProduct, selectedProduct, loading, error } =
    useProductStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        navigate("/admin/inventory");
        return;
      }

      try {
        await getProduct(id);
        setIsInitialized(true);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load product"
        );
        navigate("/admin/inventory");
      }
    };

    loadProduct();
  }, [id, getProduct, navigate]);

  if (loading && !isInitialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 mt-8">{error}</div>;
  }

  if (!selectedProduct) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Edit Product
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Make changes to {selectedProduct.name}
          </p>
        </div>
      </div>
      <div className="mt-8">
        <ProductForm
          initialValues={selectedProduct}
          onSave={async (formData) => {
            try {
              console.log("Received FormData from ProductForm");

              // Use the update product function from your store
              await updateProduct(id!, formData);
              toast.success("Product updated successfully");
              navigate("/admin/products");
            } catch (error) {
              toast.error("Failed to update product");
              console.error("Error updating product:", error);
            }
          }}
          isSubmitting={loading}
          isEdit={true}
        />
      </div>
    </div>
  );
}
