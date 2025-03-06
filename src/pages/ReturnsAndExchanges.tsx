import React from 'react';
import { RefreshCw, Truck, DollarSign, Package, ShieldCheck, FileText, XCircle } from 'lucide-react';

export default function ReturnsAndExchanges() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-teal-500 py-24">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Returns & Exchanges
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Our policy for returns, refunds, and product exchanges
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <RefreshCw className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Resort Accessories Limited – Returns and Exchange Policy</h2>
          </div>
          <p className="text-gray-700 mb-4"><strong>Effective Date:</strong> March 1, 2025</p>
          <p className="text-gray-700 mb-6">This Returns and Exchange Policy applies to all wholesale orders placed with Resort Accessories Limited, located at 7 Norbrook Terrace, Kingston 8, St. Andrew, Jamaica. Legal jurisdiction is Kingston, Jamaica.</p>
          <div className="space-y-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <ShieldCheck className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">1. Eligibility for Returns and Exchanges</h3>
              </div>
              <p className="text-gray-700">
                We accept returns and exchanges only for products that are defective, damaged, or incorrectly shipped. Returns and exchanges must be requested within 14 days of the delivery date.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <RefreshCw className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">2. Return and Exchange Process</h3>
              </div>
              <p className="text-gray-700">
                To request a return or exchange, please contact us at Info@resortaccessoires.shop with your order number and a description of the issue. We may require you to provide photographic evidence of the defect or damage. If your return or exchange is approved, we will provide you with instructions on how to return the product.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Truck className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">3. Return Shipping Costs</h3>
              </div>
              <p className="text-gray-700">
                If the product is defective, damaged, or incorrectly shipped, we will pay for the return shipping costs. In all other cases, you are responsible for the return shipping costs.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">4. Condition of Returned Products</h3>
              </div>
              <p className="text-gray-700">
                Returned products must be in their original packaging and in resalable condition. We reserve the right to refuse returns that do not meet these requirements.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">5. Refunds and Exchanges</h3>
              </div>
              <p className="text-gray-700">
                For approved returns, we will issue a refund to your original payment method. For approved exchanges, we will ship you a replacement product as soon as possible. We reserve the right to offer a replacement product or a refund, at our sole discretion.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <XCircle className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">6. Exclusions</h3>
              </div>
              <p className="text-gray-700">
                We do not accept returns or exchanges for products that have been used, altered, or damaged by the customer. We do not accept returns or exchanges for clearance items or final sale items. Due to the nature of wholesale, slight variations in color or manufacturing are not considered defects and are not eligible for return.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">7. Contact Information</h3>
              </div>
              <div className="text-gray-700">
                <p className="mb-2">If you have any questions about this Returns and Exchange Policy, please contact us at:</p>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p>Resort Accessories Limited<br />
                  7 Norbrook Terrace, Kingston 8, St. Andrew, Jamaica<br />
                  1-876-568-4855<br />
                  Info@resortaccessoires.shop<br />
                  <a href="https://resort-accessories.shop" className="text-blue-600 hover:underline">https://resort-accessories.shop</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
