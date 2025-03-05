import React from 'react';

const Settings: React.FC = () => {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your account and application settings.
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-sm text-gray-500">
              Settings will be available soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
