import React, { useState } from 'react';
import { ShoppingCart, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PricingMode } from '../types';
import AuthModal from './auth/AuthModal';
import { useCustomerAuthStore } from '../stores/customerAuth';

interface HeaderProps {
  pricingMode: PricingMode;
  setPricingMode: (mode: PricingMode) => void;
}

export default function Header({ pricingMode, setPricingMode }: HeaderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = useCustomerAuthStore(state => state.isAuthenticated);
  const logout = useCustomerAuthStore(state => state.logout);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/palm-tree.svg"
                alt="Jamaica Tourist Store"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {/* Pricing Mode Toggle */}
            <select
              value={pricingMode}
              onChange={(e) => setPricingMode(e.target.value as PricingMode)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
            </select>

            {/* Cart */}
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <ShoppingCart className="h-6 w-6" />
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <User className="h-5 w-5 mr-2" />
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <User className="h-5 w-5 mr-2" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSignIn={() => {
          setIsAuthModalOpen(false);
          navigate('/dashboard');
        }}
      />
    </header>
  );
}