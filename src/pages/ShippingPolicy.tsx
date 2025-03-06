import React from 'react';
import { Truck, Clock, Globe, AlertCircle, Package, FileText } from 'lucide-react';

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-teal-500 py-24">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Shipping Policy
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Information about our shipping methods, timeframes, and policies
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Resort Accessories Limited – Shipping Policy</h2>
          </div>
          <p className="text-gray-700 mb-4"><strong>Effective Date:</strong> March 1, 2025</p>
          <p className="text-gray-700 mb-6">This Shipping Policy applies to all wholesale orders placed with Resort Accessories Limited, located at 7 Norbrook Terrace, Kingston 8, St. Andrew, Jamaica.</p>
          <div className="space-y-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Truck className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">1. Shipping Methods and Carriers</h3>
              </div>
              <p className="text-gray-700">
                Resort Accessories Limited utilizes various shipping carriers, including Carriers: e.g., Knutsford Express, FedEx, UPS, DHL, Jamaica Post, to deliver wholesale orders. The specific shipping method and carrier will be determined based on the order size, destination, and customer preference, where possible.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">2. Shipping Costs</h3>
              </div>
              <p className="text-gray-700">
                Shipping costs are calculated based on the weight, dimensions, and destination of the order. Shipping costs will be clearly displayed during the checkout process before you confirm your order. We may offer free shipping on orders that meet a certain minimum order value. Typically orders over $250 USD will qualify for Free Shipping.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">3. Delivery Timeframes</h3>
              </div>
              <p className="text-gray-700">
                Estimated delivery timeframes will be provided during the checkout process. Delivery timeframes are estimates only and are not guaranteed. Actual delivery times may vary due to factors beyond our control, such as weather conditions, customs delays, and carrier issues. Resort Accessories Limited is not responsible for delays caused by the shipping carrier.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">4. Order Processing Time</h3>
              </div>
              <p className="text-gray-700">
                Orders are typically processed within 1-3 business days of receipt. Orders placed on weekends or holidays will be processed on the next business day.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Globe className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">5. Shipping Restrictions</h3>
              </div>
              <p className="text-gray-700">
                We currently ship to Worldwide. We may be unable to ship to certain locations due to legal restrictions or carrier limitations. Customers are responsible for complying with all import regulations and paying any applicable customs duties, taxes, or fees.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">6. Lost or Damaged Shipments</h3>
              </div>
              <p className="text-gray-700">
                Resort Accessories Limited is not responsible for lost or damaged shipments caused by the shipping carrier. If your order is lost or damaged in transit, please contact us immediately, and we will assist you in filing a claim with the carrier. Customers are responsible for providing accurate shipping information. Resort Accessories Limited is not responsible for delivery issues caused by incorrect or incomplete addresses.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">7. Order Tracking</h3>
              </div>
              <p className="text-gray-700">
                Once your order has shipped, you will receive a shipping confirmation email with a tracking number. If you have an online account with us you can see updates by logging into your account. You can use the tracking number to track your order's progress on the carrier's website.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">8. Contact Information</h3>
              </div>
              <div className="text-gray-700">
                <p className="mb-2">If you have any questions about our Shipping Policy, please contact us at:</p>
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
