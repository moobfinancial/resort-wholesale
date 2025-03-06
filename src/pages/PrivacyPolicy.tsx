import React from 'react';
import { FileText, Database, Share2, Lock, Clock, UserCheck, Cookie, ExternalLink, UserX, FileEdit } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-teal-500 py-24">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            How we collect, use, and protect your personal information
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Resort Accessories Limited – Privacy Policy</h2>
          </div>
          <p className="text-gray-700 mb-4"><strong>Effective Date:</strong> March 1, 2025</p>
          <p className="text-gray-700 mb-6">Resort Accessories Limited, located at 7 Norbrook Terrace, Kingston 8, St. Andrew, Jamaica, is committed to protecting your privacy. This Privacy Policy describes how we collect, use, and disclose your personal information when you use our wholesale platform. The legal jurisdiction is Kingston, Jamaica.</p>
          <div className="space-y-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">1. Information We Collect</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p><strong>Business Information:</strong> Business Name, Business Address, Business Phone, Business Email, Tax ID Number, Business Type, Business Licenses.</p>
                <p><strong>Contact Information:</strong> Name, Email Address, Phone Number, Shipping Address, Billing Address.</p>
                <p><strong>Payment Information:</strong> Credit Card Details, Bank Account Information (processed securely by our payment gateway provider).</p>
                <p><strong>Order Information:</strong> Products Purchased, Order History, Shipping Information.</p>
                <p><strong>Usage Data:</strong> IP Address, Browser Type, Operating System, Pages Visited, Time Spent on Our Platform.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h3>
              </div>
              <ul className="text-gray-700 list-disc pl-5 space-y-1">
                <li>To process your orders and provide customer support.</li>
                <li>To verify your business credentials.</li>
                <li>To communicate with you about your orders, promotions, and other news.</li>
                <li>To personalize your experience on our platform.</li>
                <li>To improve our platform and services.</li>
                <li>To comply with legal and regulatory requirements.</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Share2 className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">3. How We Share Your Information</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p><strong>Service Providers:</strong> We share your information with service providers who assist us in operating our platform, processing payments, fulfilling orders, and providing customer support. These providers include our payment gateway provider, shipping carriers, and email marketing provider.</p>
                <p><strong>Legal Compliance:</strong> We may disclose your information to comply with legal and regulatory requirements, such as responding to a subpoena or court order.</p>
                <p><strong>Business Transfers:</strong> If Resort Accessories Limited is involved in a merger, acquisition, or sale of all or a portion of its assets, your information may be transferred as part of the transaction.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Lock className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">4. Data Security</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p>We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure.</p>
                <p>These measures include data encryption, firewalls, and access controls.</p>
                <p>No method of transmission over the internet or method of electronic storage is 100% secure. Therefore, we cannot guarantee the absolute security of your information.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">5. Data Retention</h3>
              </div>
              <p className="text-gray-700">
                We will retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <UserCheck className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">6. Your Rights</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p>You have the right to access, correct, and delete your personal information.</p>
                <p>You have the right to opt out of receiving marketing communications from us.</p>
                <p>To exercise these rights, please contact us at Info@resortaccessoires.shop.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Cookie className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">7. Cookies</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p>We use cookies to collect usage data and to personalize your experience on our platform.</p>
                <p>You can control cookies through your browser settings.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <ExternalLink className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">8. Third-Party Websites</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p>Our platform may contain links to third-party websites.</p>
                <p>We are not responsible for the privacy practices of these websites.</p>
                <p>We encourage you to review the privacy policies of any third-party websites you visit.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <UserX className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">9. Children's Privacy</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p>Our platform is not intended for children under the age of 18.</p>
                <p>We do not knowingly collect personal information from children under the age of 18.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileEdit className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">10. Changes to this Privacy Policy</h3>
              </div>
              <div className="text-gray-700 space-y-2">
                <p>Resort Accessories Limited reserves the right to modify this Privacy Policy at any time.</p>
                <p>We will post the updated Privacy Policy on our platform.</p>
                <p>Your continued use of our platform after the posting of an updated Privacy Policy constitutes your acceptance of the changes.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">11. Contact Information</h3>
              </div>
              <div className="text-gray-700">
                <p className="mb-2">If you have any questions about this Privacy Policy, please contact us at:</p>
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
