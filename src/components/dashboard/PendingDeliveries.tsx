import React from 'react';
import { Package, MapPin, Calendar, Truck } from 'lucide-react';

const SAMPLE_DELIVERIES = [
  {
    id: 'del_1',
    orderId: 'ord_2',
    items: [
      { name: 'Shell Wind Chimes', quantity: 1 },
      { name: 'Island Spice Gift Set', quantity: 2 }
    ],
    status: 'In Transit',
    estimatedDelivery: '2024-02-15',
    trackingNumber: '1Z999AA1234567890',
    address: '123 Main St, Kingston, Jamaica'
  }
];

const steps = ['Order Placed', 'Processing', 'In Transit', 'Out for Delivery', 'Delivered'];

export default function PendingDeliveries() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Deliveries</h2>
      
      {SAMPLE_DELIVERIES.length > 0 ? (
        <div className="space-y-6">
          {SAMPLE_DELIVERIES.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order #{delivery.orderId}</p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <p className="text-sm text-gray-500">
                        Estimated delivery: {delivery.estimatedDelivery}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {delivery.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                    <div
                      style={{ width: '60%' }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    />
                  </div>
                  <div className="flex justify-between">
                    {steps.map((step, index) => (
                      <div
                        key={step}
                        className={`flex flex-col items-center ${
                          index <= steps.indexOf(delivery.status)
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      >
                        <div className="h-2 w-2 rounded-full bg-current" />
                        <p className="mt-2 text-xs">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Items */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Items</h4>
                    <div className="space-y-2">
                      {delivery.items.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <p className="text-sm text-gray-600">
                            {item.quantity}x {item.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking Info */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Tracking Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Truck className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-600">
                          Tracking #: {delivery.trackingNumber}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-600">{delivery.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Track Package
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending deliveries</h3>
          <p className="mt-1 text-sm text-gray-500">
            When you place an order, your delivery status will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
