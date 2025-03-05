import React, { useState } from 'react';
import { 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  Package, 
  Settings, 
  LogOut,
  Home,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuthStore } from '../../stores/customerAuth';
import PurchaseHistory from '../../components/dashboard/PurchaseHistory';
import PaymentMethods from '../../components/dashboard/PaymentMethods';
import PendingDeliveries from '../../components/dashboard/PendingDeliveries';
import PaymentHistory from '../../components/dashboard/PaymentHistory';
import { default as SettingsPanel } from '../../components/dashboard/Settings';
import BusinessVerification from '../../components/business/BusinessVerification';

type TabType =
  | 'purchases'
  | 'payments'
  | 'deliveries'
  | 'payment-methods'
  | 'settings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('purchases');
  const navigate = useNavigate();
  const logout = useCustomerAuthStore(state => state.logout);

  const tabs = [
    { id: 'purchases', label: 'Purchase History', icon: ShoppingBag },
    { id: 'payments', label: 'Payment History', icon: Clock },
    { id: 'deliveries', label: 'Pending Deliveries', icon: Package },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'purchases':
        return <PurchaseHistory />;
      case 'payments':
        return <PaymentHistory />;
      case 'deliveries':
        return <PendingDeliveries />;
      case 'payment-methods':
        return <PaymentMethods />;
      case 'settings':
        return <SettingsPanel />;
      case 'documents':
        return (
          <BusinessVerification
            currentStatus="pending"
            onSubmit={async (files: File[]) => {
              console.log('Files submitted:', files);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <a href="/" className="flex items-center text-blue-600">
                <Home className="h-5 w-5 mr-2" />
                Back to Store
              </a>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleSignOut}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
