import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, EyeOff, Copy } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AccountTab() {
  const { toast } = useToast();
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Inc.',
    role: 'Administrator',
    phoneNumber: '+1 (555) 123-4567',
    publicApiKey: 'pk_live_abcdefghijklmnopqrstuvwxyz123456',
    privateApiKey: 'sk_live_abcdefghijklmnopqrstuvwxyz123456',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: '' });
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
    { id: 2, name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer' },
  ]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const handleSaveChanges = () => {
    setUser(editedUser);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    toast({
      title: "Password Changed",
      description: "Your password has been successfully updated.",
    });
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "API Key Copied",
      description: "The API key has been copied to your clipboard.",
    });
  };

  const handleEnableTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    setShowTwoFactorModal(false);
    toast({
      title: twoFactorEnabled ? "Two-Factor Authentication Disabled" : "Two-Factor Authentication Enabled",
      description: twoFactorEnabled ? "Two-factor authentication has been disabled for your account." : "Two-factor authentication has been enabled for your account.",
    });
  };

  const handleInviteUser = () => {
    setShowInviteUserModal(false);
    setInviteData({ email: '', role: '' });
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${inviteData.email} with the role of ${inviteData.role}.`,
    });
  };

  const handleRemoveUser = (id: number) => {
    const userToRemove = teamMembers.find(member => member.id === id);
    setUserToDelete(userToRemove);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      setTeamMembers(teamMembers.filter(member => member.id !== userToDelete.id));
      toast({
        title: "User Removed",
        description: `${userToDelete.name} has been removed from your team.`,
      });
      setShowDeleteConfirmModal(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-teal-400">Account Settings</h2>
        <p className="text-gray-400">Manage your account information and preferences</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                value={isEditing ? editedUser.name : user.name}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                value={isEditing ? editedUser.email : user.email}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="company" className="text-white">Company</Label>
              <Input
                id="company"
                value={isEditing ? editedUser.company : user.company}
                onChange={(e) => setEditedUser({ ...editedUser, company: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-white">Role</Label>
              <Input
                id="role"
                value={user.role}
                readOnly
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="text-white">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={isEditing ? editedUser.phoneNumber : user.phoneNumber}
                onChange={(e) => setEditedUser({ ...editedUser, phoneNumber: e.target.value })}
                readOnly={!isEditing}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            {isEditing ? (
              <div className="flex space-x-2">
                <Button onClick={handleSaveChanges} className="bg-teal-600 hover:bg-teal-700 text-white">
                  Save Changes
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="bg-gray-700 text-white border-gray-600">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="publicApiKey" className="text-white">Public API Key</Label>
              <div className="flex">
                <Input
                  id="publicApiKey"
                  value={user.publicApiKey}
                  readOnly
                  className="bg-gray-700 text-white border-gray-600 flex-grow"
                />
                <Button onClick={() => handleCopyApiKey(user.publicApiKey)} className="ml-2 bg-teal-600 hover:bg-teal-700 text-white">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="privateApiKey" className="text-white">Private API Key</Label>
              <div className="flex">
                <Input
                  id="privateApiKey"
                  type={showPrivateKey ? "text" : "password"}
                  value={user.privateApiKey}
                  readOnly
                  className="bg-gray-700 text-white border-gray-600 flex-grow"
                />
                <Button onClick={() => setShowPrivateKey(!showPrivateKey)} className="ml-2 bg-gray-700 hover:bg-gray-600 text-white">
                  {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button onClick={() => handleCopyApiKey(user.privateApiKey)} className="ml-2 bg-teal-600 hover:bg-teal-700 text-white">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => setShowChangePasswordModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
              Change Password
            </Button>
            <div className="flex items-center space-x-2">
              <Switch
                id="two-factor"
                checked={twoFactorEnabled}
                onCheckedChange={() => setShowTwoFactorModal(true)}
              />
              <Label htmlFor="two-factor" className="text-white">Enable Two-Factor Authentication</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => setShowInviteUserModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
              Invite New User
            </Button>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-sm text-gray-400">{member.email}</p>
                    <p className="text-sm text-gray-400">{member.role}</p>
                  </div>
                  <Button onClick={() => handleRemoveUser(member.id)} variant="destructive">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-white">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="text-white">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleChangePassword} className="bg-teal-600 hover:bg-teal-700 text-white">
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTwoFactorModal} onOpenChange={setShowTwoFactorModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to {twoFactorEnabled ? 'disable' : 'enable'} two-factor authentication?</p>
            {!twoFactorEnabled && (
              <p>You'll be asked to enter a verification code each time you log in to your account.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleEnableTwoFactor} className="bg-teal-600 hover:bg-teal-700 text-white">
              {twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteUserModal} onOpenChange={setShowInviteUserModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email" className="text-white">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="invite-role" className="text-white">Role</Label>
              <Select onValueChange={(value) => setInviteData({ ...inviteData, role: value })}>
                <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleInviteUser} className="bg-teal-600 hover:bg-teal-700 text-white">
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirm User Removal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to remove {userToDelete?.name} from your team?</p>
            <p>This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDeleteConfirmModal(false)} variant="outline" className="bg-gray-700 text-white border-gray-600">
              Cancel
            </Button>
            <Button onClick={confirmDeleteUser} variant="destructive">
              Confirm Removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}