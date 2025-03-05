import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '../../../stores/productStore';
import toast from 'react-hot-toast';

type AdjustmentType = 'add' | 'subtract';

export default function StockAdjustment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct, adjustStock } = useProductStore();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [type, setType] = useState<AdjustmentType>('add');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (id) {
        try {
          const loadedProduct = await getProduct(id);
          setProduct(loadedProduct);
        } catch (error) {
          toast.error('Failed to load product');
          navigate('/admin/inventory');
        }
      } else {
        // If no ID is provided, redirect to inventory page
        navigate('/admin/inventory');
      }
    };
    loadProduct();
  }, [id, getProduct, navigate]);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const newStock = type === 'add' 
        ? product.stock + quantity 
        : product.stock - quantity;

      if (newStock < 0) {
        toast.error('Cannot reduce stock below 0');
        setLoading(false);
        return;
      }

      await adjustStock(product.id, quantity, type);
      toast.success(`Successfully ${type === 'add' ? 'added' : 'removed'} ${quantity} items from stock`);
      navigate('/admin/inventory');
    } catch (error) {
      console.error('Stock adjustment error:', error);
      toast.error('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <h2 className="text-base font-semibold leading-6 text-gray-900">
            Stock Adjustment for {product.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Current stock level: {product.stock}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adjustment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AdjustmentType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={loading}
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Remove Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason for Adjustment
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter reason for stock adjustment..."
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/inventory')}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
