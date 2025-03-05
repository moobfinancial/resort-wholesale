import React, { useState, useEffect } from 'react';
import { Bell, Shield, Briefcase, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useBusinessForm } from '../../hooks/useBusinessForm';
import BusinessVerification from '../business/BusinessVerification';
import { submitVerification } from '../../api/businessVerification';
import { useCustomerAuthStore } from '../../stores/customerAuth';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Business Verification Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function Settings() {
  const { user, updateProfile } = useCustomerAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: formData.phone // Keep existing phone number if any
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear any previous messages
    setSaveError('');
    setSaveSuccess(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email
      });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    // Clear messages
    setPasswordError('');
    setPasswordSuccess(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/customer/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useCustomerAuthStore.getState().token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      setPasswordSuccess(true);
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const {
    formData: businessData,
    errors,
    isLoading,
    isSuccess,
    errorMessage,
    handleInputChange: handleBusinessInputChange,
    handleSubmit: handleBusinessSubmit
  } = useBusinessForm();

  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: true,
    newsletter: false,
    deliveries: true
  });

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
        
        {/* Profile Section */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          
          {saveError && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{saveError}</h3>
                </div>
              </div>
            </div>
          )}
          
          {saveSuccess && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Profile updated successfully!</h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
        
        {/* Password Change Section */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
          
          {passwordError && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{passwordError}</h3>
                </div>
              </div>
            </div>
          )}
          
          {passwordSuccess && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Password changed successfully!</h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>

        {/* Business Information Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
            </div>
            {(isSuccess || errorMessage) && (
              <div className={`flex items-center ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {isSuccess ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                <span className="text-sm">
                  {isSuccess ? 'Changes saved successfully!' : errorMessage}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                id="businessName"
                value={businessData.businessName}
                onChange={handleBusinessInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.businessName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your business name"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700">
                Business Phone *
              </label>
              <input
                type="tel"
                name="businessPhone"
                id="businessPhone"
                value={businessData.businessPhone}
                onChange={handleBusinessInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.businessPhone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter business phone number"
              />
              {errors.businessPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.businessPhone}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700">
                Business Email *
              </label>
              <input
                type="email"
                name="businessEmail"
                id="businessEmail"
                value={businessData.businessEmail}
                onChange={handleBusinessInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.businessEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter business email address"
              />
              {errors.businessEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.businessEmail}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700">
                Business Address *
              </label>
              <input
                type="text"
                name="businessAddress"
                id="businessAddress"
                value={businessData.businessAddress}
                onChange={handleBusinessInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.businessAddress ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter business address"
              />
              {errors.businessAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.businessAddress}</p>
              )}
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                Tax ID Number *
              </label>
              <input
                type="text"
                name="taxId"
                id="taxId"
                value={businessData.taxId}
                onChange={handleBusinessInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.taxId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter tax ID number"
              />
              {errors.taxId && (
                <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>
              )}
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                Business Type *
              </label>
              <input
                type="text"
                name="businessType"
                id="businessType"
                value={businessData.businessType}
                onChange={handleBusinessInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.businessType ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Gift Shop, Resort Store"
              />
              {errors.businessType && (
                <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleBusinessSubmit}
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Business Information'
              )}
            </button>
          </div>
        </div>

        {/* Business Verification Section */}
        <div className="mt-8">
          <ErrorBoundary fallback={<div>Something went wrong with business verification</div>}>
            <BusinessVerification
              currentStatus="pending"
              onSubmit={async (files: File[]) => {
                try {
                  await submitVerification(files);
                } catch (error) {
                  throw new Error(error instanceof Error ? error.message : 'Failed to submit documents');
                }
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace(/-/g, ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationToggle(key as keyof typeof notifications)}
                  className={`${
                    value ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      value ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
          <div className="space-y-4">
            <button className="flex items-center text-sm text-blue-600 hover:text-blue-500">
              <Shield className="h-5 w-5 mr-2" />
              Change Password
            </button>
            <button className="flex items-center text-sm text-blue-600 hover:text-blue-500">
              <Shield className="h-5 w-5 mr-2" />
              Two-Factor Authentication
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
