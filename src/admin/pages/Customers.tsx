export default function Customers() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage wholesale customer accounts.
          </p>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <div className="min-w-full divide-y divide-gray-300">
                <div className="bg-white px-4 py-5 sm:p-6">
                  <div className="text-center text-sm text-gray-500">
                    No customers found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
