import React from 'react';

export default function Newsletter() {
  return (
    <section className="py-16 bg-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-800 to-blue-900 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-900 mix-blend-multiply" />
          </div>
          <div className="relative py-16 px-8 sm:px-16 lg:px-24">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Stay Updated with New Products & Special Offers
              </h2>
              <p className="text-lg text-blue-100 mb-8">
                Subscribe to our newsletter and get exclusive wholesale deals and updates.
              </p>
              <form className="max-w-md mx-auto">
                <div className="flex gap-4">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-yellow-500 text-blue-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors duration-300"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="text-sm text-blue-200 mt-4">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
