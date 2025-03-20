import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductForm from "./ProductForm";
import { Product } from "../../../types/product";
import { useProductStore } from "../../../stores/productStore";
import toast from "react-hot-toast";

export default function NewProduct() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { createProduct, loading } = useProductStore();

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    // setError(null);

    try {
      console.log("Received FormData from ProductForm");

      console.log("Submitting new product with FormData");

      // Use the create product function from the store
      await createProduct(formData);
      toast.success("Product created successfully");
      // navigate('/admin/products');
    } catch (err) {
      console.error("Error creating product:", err);
      setError("Failed to create product. Please try again.");
      toast.error("Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Add New Product
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new product to add to your inventory
          </p>
        </div>
      </div>
      <div className="mt-8">
        <ProductForm
          onSave={handleSubmit}
          isSubmitting={submitting || loading}
        />
      </div>
    </div>
  );
}
