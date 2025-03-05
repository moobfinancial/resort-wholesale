import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';

const SAMPLE_PAYMENT_METHODS = [
  {
    id: 'card_1',
    type: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2025,
    isDefault: true
  },
  {
    id: 'card_2',
    type: 'Mastercard',
    last4: '8888',
    expMonth: 3,
    expYear: 2026,
    isDefault: false
  }
];

export default function PaymentMethods() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h2>
      
      <div className="space-y-4">
        {SAMPLE_PAYMENT_METHODS.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {method.type} ending in {method.last4}
                </p>
                <p className="text-sm text-gray-500">
                  Expires {method.expMonth}/{method.expYear}
                </p>
                {method.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!method.isDefault && (
                <button className="text-sm text-blue-600 hover:text-blue-500">
                  Set as default
                </button>
              )}
              <button className="p-2 text-gray-400 hover:text-red-500">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        <button className="w-full mt-4 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900">
          <Plus className="h-5 w-5 mr-2" />
          Add new payment method
        </button>
      </div>
    </div>
  );
}
