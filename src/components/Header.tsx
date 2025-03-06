import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerAuthStore } from '../stores/customerAuth';
import AuthModal from './auth/AuthModal';
import CartIcon from './cart/CartIcon';

export default function Header() {
  const { isAuthenticated, logout } = useCustomerAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();

  const handleSignIn = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-20 w-auto"
                src="/images/brand/logo1.png"
                alt="Resort Accessories"
              />
            </Link>

            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Products
              </Link>
              <Link
                to="/about"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/contact' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-6">
            {/* Cart Icon */}
            <CartIcon />
            
            {/* Authentication */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/customer/dashboard"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={handleSignIn}
      />
    </header>
  );
}
