import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Resort Accessories</h3>
            <p className="text-sm">Your premier source for authentic Jamaican merchandise and resort accessories.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>+1 (876) 555-0123</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>info@resortaccessories.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Kingston, Jamaica</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="hover:text-white transition">About Us</a></li>
              <li><a href="/products" className="hover:text-white transition">Products</a></li>
              <li><a href="/wholesale" className="hover:text-white transition">Wholesale</a></li>
              <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Customer Service</h3>
            <ul className="space-y-2">
              <li><a href="/shipping-policy" className="hover:text-white transition">Shipping Policy</a></li>
              <li><a href="/returns-and-exchanges" className="hover:text-white transition">Returns & Exchanges</a></li>
              <li><a href="/faq" className="hover:text-white transition">FAQ</a></li>
              <li><a href="/terms-and-conditions" className="hover:text-white transition">Terms and Conditions</a></li>
              <li><a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm">Subscribe to our newsletter for updates and exclusive offers.</p>
            <form className="space-y-2">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 px-4 py-2 rounded-r-md hover:bg-blue-700 transition"
                >
                  Subscribe
                </button>
              </div>
            </form>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="hover:text-white transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-white transition">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-white transition">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-sm">
              {new Date().getFullYear()} Resort Accessories. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6 text-sm">
                <li><a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="/terms-and-conditions" className="hover:text-white transition">Terms and Conditions</a></li>
                <li><a href="#" className="hover:text-white transition">Sitemap</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
