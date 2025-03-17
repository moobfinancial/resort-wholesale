import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { useCustomerAuthStore } from '../../stores/customerAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export default function AuthModal({ isOpen, onClose, onSignIn }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const isAuthenticated = useCustomerAuthStore(state => state.isAuthenticated);
  
  // Close modal automatically when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      console.log('User authenticated, closing modal');
      onSignIn();
      onClose();
    }
  }, [isAuthenticated, isOpen, onSignIn, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>

          {/* Tabs */}
          <div className="mb-8 flex space-x-2">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Content */}
          {mode === 'signin' ? (
            <SignIn onClose={onClose} onSignIn={onSignIn} />
          ) : (
            <SignUp onClose={onClose} onSignIn={onSignIn} />
          )}
        </div>
      </div>
    </div>
  );
}
