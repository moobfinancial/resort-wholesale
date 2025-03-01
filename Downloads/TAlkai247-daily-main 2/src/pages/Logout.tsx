import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LogoutTab() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p className="text-gray-400">Please wait while we sign you out.</p>
      </div>
    </div>
  );
}