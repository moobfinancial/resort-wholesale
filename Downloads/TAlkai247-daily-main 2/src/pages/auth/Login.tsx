import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await login({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <Bot className="h-12 w-12 text-teal-400" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-teal-400 hover:text-teal-300">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-400 focus:ring-teal-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-teal-400 hover:text-teal-300">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-teal-500 hover:bg-teal-600"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-700">
                Google
              </Button>
              <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-700">
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}