import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot } from 'lucide-react';

export default function SignUp() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Bot className="h-12 w-12 text-teal-400" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-teal-400 hover:text-teal-300">
            Sign in
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>

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
                autoComplete="new-password"
                required
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="company">Company Name (Optional)</Label>
              <Input
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-400 focus:ring-teal-500"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-teal-400 hover:text-teal-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-teal-400 hover:text-teal-300">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600">
              Create Account
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