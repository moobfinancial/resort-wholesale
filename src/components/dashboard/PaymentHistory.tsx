import React from 'react';
import { CreditCard, DollarSign } from 'lucide-react';

const SAMPLE_PAYMENTS = [
  {
    id: 'pmt_1',
    date: '2024-02-10',
    amount: 189.97,
    method: 'Visa ending in 4242',
    status: 'Completed',
    orderId: 'ord_1'
  },
  {
    id: 'pmt_2',
    date: '2024-02-05',
    amount: 109.97,
    method: 'Mastercard ending in 8888',
    status: 'Completed',
    orderId: 'ord_2'
  }
];

export default function PaymentHistory() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Date
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Order ID
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Amount
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Payment Method
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {SAMPLE_PAYMENTS.map((payment) => (
              <tr key={payment.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                  {payment.date}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  #{payment.orderId}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    {payment.amount.toFixed(2)}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                    {payment.method}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {SAMPLE_PAYMENTS.length} payments
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
