import { useRouteError } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    </div>
  );
}
