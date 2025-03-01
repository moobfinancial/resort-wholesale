import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import StatCard from '@/components/StatCard';
import { Card } from '@/components/ui/card';
import { UserPlus, PhoneCall, BarChart2, Settings } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(`/dashboard/${path}`);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name}!</h1>
        <p className="text-gray-400">Here's an overview of your AI communication metrics</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Minutes"
          value="0.00"
          bgColor="bg-[#3b82f6]"
        />
        <StatCard
          title="Number of Calls"
          value="0.00"
          bgColor="bg-[#eab308]"
        />
        <StatCard
          title="Total Spend"
          value="$0.00"
          bgColor="bg-[#22c55e]"
        />
        <StatCard
          title="Avg Cost per Call"
          value="$0.00"
          bgColor="bg-[#ef4444]"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="text-gray-400">
            No recent activity to display
          </div>
        </Card>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleNavigation('phone')}
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <PhoneCall className="h-5 w-5 text-teal-400 group-hover:text-teal-300" />
                <h3 className="text-white font-medium">New Call</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">Start a new AI call</p>
            </button>
            
            <button 
              onClick={() => handleNavigation('contacts')}
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-teal-400 group-hover:text-teal-300" />
                <h3 className="text-white font-medium">Add Contact</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">Create a new contact</p>
            </button>
            
            <button 
              onClick={() => handleNavigation('logs')}
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-5 w-5 text-teal-400 group-hover:text-teal-300" />
                <h3 className="text-white font-medium">View Reports</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">Analytics & insights</p>
            </button>
            
            <button 
              onClick={() => handleNavigation('account')}
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-teal-400 group-hover:text-teal-300" />
                <h3 className="text-white font-medium">Settings</h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">Configure your account</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}