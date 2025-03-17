import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuthStore } from '../../stores/adminAuth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get state and actions from auth store
  const login = useAdminAuthStore(state => state.login);
  const isAuthenticated = useAdminAuthStore(state => state.isAuthenticated);
  const isHydrated = useAdminAuthStore(state => state.isHydrated);
  
  // Effect to handle redirect after successful login
  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      // Get the saved redirect path or default to admin dashboard
      const redirectPath = sessionStorage.getItem('redirectPath') || '/admin/dashboard';
      
      // Clear the redirect path from session storage
      sessionStorage.removeItem('redirectPath');
      
      // Navigate to the redirect path
      navigate(redirectPath);
    }
  }, [isAuthenticated, isHydrated, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Call the login function from the auth store
      await login(email, password);
      
      // Login successful - the effect above will handle redirection
      console.log('Login successful');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle different error formats to ensure we always display a user-friendly message
      if (err.response?.data?.status === 'error') {
        // Standard error format
        setError(err.response.data.message || 'Login failed. Please check your credentials.');
      } else if (err.message) {
        // Error with message property
        setError(err.message);
      } else {
        // Fallback error message
        setError('Login failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-24 w-auto"
            src="/images/brand/logo1.png"
            alt="Resort Admin"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link to="/admin/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
