import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Phone, 
  FileText, 
  MessageSquare, 
  Mic2, 
  UserRound, 
  Megaphone, 
  Target, 
  Eye, 
  CreditCard, 
  User, 
  BookOpen, 
  HelpCircle, 
  LogOut,
  MessageCircle,
  Bot
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/')[2] || '';

  const menuItems = [
    { id: '', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'assistants', icon: Users, label: 'Assistants' },
    { id: 'phone', icon: Phone, label: 'Phone Number' },
    { id: 'logs', icon: FileText, label: 'Call Logs' },
    { id: 'sms', icon: MessageSquare, label: 'SMS' },
    { id: 'voice', icon: Mic2, label: 'Voice Library' },
    { id: 'contacts', icon: UserRound, label: 'Contact List' },
    { id: 'campaigns', icon: Megaphone, label: 'Campaigns' },
    { id: 'goals', icon: Target, label: 'Goal Template' },
    { id: 'transparency', icon: Eye, label: 'Transparency Levels' },
    { id: 'whisper', icon: MessageCircle, label: 'Whisper' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'account', icon: User, label: 'Account' },
    { id: 'resources', icon: BookOpen, label: 'Resources' },
    { id: 'help', icon: HelpCircle, label: 'Help' },
    { id: 'logout', icon: LogOut, label: 'Logout' }
  ];

  const handleNavigation = (path: string) => {
    if (path === 'logout') {
      // Handle logout logic here
      navigate('/');
    } else {
      navigate(`/dashboard/${path}`);
    }
  };

  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col min-h-screen">
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-teal-400" />
          <h1 className="text-2xl font-bold text-teal-400">Talkai247</h1>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`w-full flex items-center p-2 rounded transition-colors ${
              currentPath === item.id
                ? 'bg-teal-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}