import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddContact = () => {
    navigate('/dashboard/contacts');
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
            <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              <h3 className="text-white font-medium">New Call</h3>
              <p className="text-sm text-gray-400">Start a new AI call</p>
            </button>
            <button 
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              onClick={handleAddContact}
            >
              <h3 className="text-white font-medium">Add Contact</h3>
              <p className="text-sm text-gray-400">Create a new contact</p>
            </button>
            <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              <h3 className="text-white font-medium">View Reports</h3>
              <p className="text-sm text-gray-400">Analytics & insights</p>
            </button>
            <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              <h3 className="text-white font-medium">Settings</h3>
              <p className="text-sm text-gray-400">Configure your account</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}