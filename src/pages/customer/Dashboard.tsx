import React, { useState } from 'react';
import { 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  Package, 
  Settings, 
  LogOut,
  Home,
  FileText,
  DollarSign
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
  | 'settings'
  | 'credit'
  | 'documents';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('purchases');
  const navigate = useNavigate();
  const logout = useCustomerAuthStore(state => state.logout);

  const tabs = [
    { id: 'purchases', label: 'Purchase History', icon: ShoppingBag },
    { id: 'payments', label: 'Payment History', icon: Clock },
    { id: 'deliveries', label: 'Pending Deliveries', icon: Package },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'credit', label: 'Apply for Credit', icon: DollarSign },
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
      case 'credit':
        return (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Business Credit Application</h2>
            <p className="mb-6 text-gray-600 max-w-2xl mx-auto">
              Apply for a business credit line to make purchases now and pay later. 
              Our flexible credit terms of 30, 90, or 180 days help you manage cash flow.
            </p>
            <button 
              onClick={() => navigate('/customer/credit/apply')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
            >
              Start Application
            </button>
          </div>
        );
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
