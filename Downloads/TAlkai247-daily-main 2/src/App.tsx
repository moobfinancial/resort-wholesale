import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import PrivateRoute from '@/components/PrivateRoute';
import Sidebar from '@/components/Sidebar';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Assistants from '@/pages/Assistants';
import PhoneNumber from '@/pages/PhoneNumber';
import CallLogs from '@/pages/CallLogs';
import SMS from '@/pages/SMS';
import VoiceLibrary from '@/pages/VoiceLibrary';
import ContactList from '@/pages/ContactList';
import Campaigns from '@/pages/Campaigns';
import GoalTemplate from '@/pages/GoalTemplate';
import TransparencyLevels from '@/pages/TransparencyLevels';
import Whisper from '@/pages/Whisper';
import Billing from '@/pages/Billing';
import Account from '@/pages/Account';
import Resources from '@/pages/Resources';
import Help from '@/pages/Help';
import Logout from '@/pages/Logout';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/assistants" element={
            <PrivateRoute>
              <DashboardLayout>
                <Assistants />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/phone" element={
            <PrivateRoute>
              <DashboardLayout>
                <PhoneNumber />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/logs" element={
            <PrivateRoute>
              <DashboardLayout>
                <CallLogs />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/sms" element={
            <PrivateRoute>
              <DashboardLayout>
                <SMS />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/voice" element={
            <PrivateRoute>
              <DashboardLayout>
                <VoiceLibrary />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/contacts" element={
            <PrivateRoute>
              <DashboardLayout>
                <ContactList />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/campaigns" element={
            <PrivateRoute>
              <DashboardLayout>
                <Campaigns />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/goals" element={
            <PrivateRoute>
              <DashboardLayout>
                <GoalTemplate />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/transparency" element={
            <PrivateRoute>
              <DashboardLayout>
                <TransparencyLevels />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/whisper" element={
            <PrivateRoute>
              <DashboardLayout>
                <Whisper />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/billing" element={
            <PrivateRoute>
              <DashboardLayout>
                <Billing />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/account" element={
            <PrivateRoute>
              <DashboardLayout>
                <Account />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/resources" element={
            <PrivateRoute>
              <DashboardLayout>
                <Resources />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/help" element={
            <PrivateRoute>
              <DashboardLayout>
                <Help />
              </DashboardLayout>
            </PrivateRoute>
          } />
          <Route path="/dashboard/logout" element={
            <PrivateRoute>
              <DashboardLayout>
                <Logout />
              </DashboardLayout>
            </PrivateRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}