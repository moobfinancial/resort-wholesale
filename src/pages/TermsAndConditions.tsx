import React from 'react';
import { FileText, UserCheck, DollarSign, Package, Truck, RefreshCw, Copyright, Shield, Scale, FileEdit } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-teal-500 py-24">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Terms and Conditions
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            The legal agreement governing your use of our platform and services
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Resort Accessories Limited – Terms and Conditions</h2>
          </div>
          <p className="text-gray-700 mb-4"><strong>Effective Date:</strong> March 1, 2025</p>
          <p className="text-gray-700 mb-6">These Terms and Conditions govern your use of the Resort Accessories Limited wholesale platform and your purchases of products from us. By using our platform and placing an order, you agree to be bound by these Terms and Conditions. Resort Accessories Limited, located at 7 Norbrook Terrace, Kingston 8, St. Andrew, Jamaica. Legal jurisdiction is Kingston, Jamaica.</p>
          <div className="space-y-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <UserCheck className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">1. Account Registration</h3>
              </div>
              <p className="text-gray-700">
                To place wholesale orders, you must register for a business account. You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account. Resort Accessories Limited reserves the right to refuse service, terminate accounts, or cancel orders at its sole discretion.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">2. Wholesale Pricing and Payment</h3>
              </div>
              <p className="text-gray-700">
                All prices are listed in United States Dollars (US Dollars (USD)] and are subject to change without notice. Wholesale prices are available only to registered business customers. We accept the following payment methods: Credit Card, Bank Transfer, CryptoCurrency. Payment is due upon placement of the order unless otherwise agreed upon in writing. Late payments may be subject to interest charges.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">3. Minimum Order Quantities (MOQ)</h3>
              </div>
              <p className="text-gray-700">
                Certain products may have minimum order quantities (MOQ). You must meet the MOQ to purchase those products at the listed wholesale price.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">4. Order Acceptance</h3>
              </div>
              <p className="text-gray-700">
                Your order is an offer to purchase products from us. We reserve the right to accept or reject your order at our sole discretion. We will confirm acceptance of your order by sending you an order confirmation email.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Truck className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">5. Shipping and Delivery</h3>
              </div>
              <p className="text-gray-700">
                Shipping costs and delivery timeframes are estimates only. Please refer to our Shipping Policy for more information. Risk of loss and title to products passes to you upon delivery to the shipping carrier.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <RefreshCw className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">6. Returns and Exchanges</h3>
              </div>
              <p className="text-gray-700">
                Please refer to our Returns and Exchange Policy for information on returns and exchanges.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Copyright className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">7. Intellectual Property</h3>
              </div>
              <p className="text-gray-700">
                All content on the Resort Accessories Limited platform, including text, images, logos, and trademarks, is the property of Resort Accessories Limited or its licensors and is protected by copyright and other intellectual property laws. You may not use our content without our express written permission.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">8. Limitation of Liability</h3>
              </div>
              <p className="text-gray-700">
                Resort Accessories Limited is not liable for any indirect, incidental, special, or consequential damages arising out of or relating to your use of our platform or your purchase of products from us. Our liability is limited to the purchase price of the products.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Scale className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">9. Governing Law</h3>
              </div>
              <p className="text-gray-700">
                These Terms and Conditions are governed by the laws of Jamaica. Any disputes arising out of or relating to these Terms and Conditions will be resolved in the courts of Kingston, Jamaica.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileEdit className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">10. Modifications</h3>
              </div>
              <p className="text-gray-700">
                Resort Accessories Limited reserves the right to modify these Terms and Conditions at any time. We will post the updated Terms and Conditions on our platform. Your continued use of our platform after the posting of updated Terms and Conditions constitutes your acceptance of the changes.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">11. Contact Information</h3>
              </div>
              <div className="text-gray-700">
                <p className="mb-2">If you have any questions about these Terms and Conditions, please contact us at:</p>
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
