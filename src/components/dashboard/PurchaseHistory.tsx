import React from 'react';
import { Package, ExternalLink } from 'lucide-react';

const SAMPLE_PURCHASES = [
  {
    id: 'ord_1',
    date: '2024-02-10',
    items: [
      { name: 'Blue Mountain Coffee', quantity: 2, price: 49.99 },
      { name: 'Handmade Straw Beach Bag', quantity: 1, price: 89.99 }
    ],
    status: 'Delivered',
    total: 189.97
  },
  {
    id: 'ord_2',
    date: '2024-02-05',
    items: [
      { name: 'Shell Wind Chimes', quantity: 1, price: 39.99 },
      { name: 'Island Spice Gift Set', quantity: 2, price: 34.99 }
    ],
    status: 'Processing',
    total: 109.97
  }
];

export default function PurchaseHistory() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase History</h2>
      
      <div className="space-y-6">
        {SAMPLE_PURCHASES.map((purchase) => (
          <div
            key={purchase.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{purchase.id}</p>
                  <p className="text-sm text-gray-500">{purchase.date}</p>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      purchase.status === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {purchase.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {purchase.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${purchase.total.toFixed(2)}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500">
                    View Details
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
