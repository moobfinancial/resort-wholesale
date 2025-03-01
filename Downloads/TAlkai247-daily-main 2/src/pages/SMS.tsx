import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SMSConfig {
  id: number;
  phoneNumber: string;
  assistant: string;
  triggerKey: string;
  triggerValue: string;
  status: number;
}

export default function SMS() {
  const [smsConfigurations, setSMSConfigurations] = useState<SMSConfig[]>([
    { 
      id: 1, 
      phoneNumber: '+12176346394', 
      assistant: 'N/A', 
      triggerKey: 'Menu', 
      triggerValue: 'Here is the menu link you can check. Thank you!', 
      status: 1 
    },
    { 
      id: 2, 
      phoneNumber: '+19548748669', 
      assistant: 'N/A', 
      triggerKey: 'Appointment', 
      triggerValue: 'Here is the appointment booking link. Have a good day!', 
      status: 1 
    },
  ]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<Partial<SMSConfig>>({
    id: undefined,
    phoneNumber: '',
    assistant: '',
    triggerKey: '',
    triggerValue: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenModal = (config: SMSConfig | null = null) => {
    if (config) {
      setCurrentConfig(config);
      setIsEditing(true);
    } else {
      setCurrentConfig({
        id: undefined,
        phoneNumber: '',
        assistant: '',
        triggerKey: '',
        triggerValue: '',
      });
      setIsEditing(false);
    }
    setShowConfigModal(true);
  };

  const handleSaveConfig = () => {
    if (isEditing && currentConfig.id) {
      setSMSConfigurations(smsConfigurations.map(config => 
        config.id === currentConfig.id ? { ...currentConfig as SMSConfig } : config
      ));
    } else {
      setSMSConfigurations([...smsConfigurations, { 
        ...currentConfig, 
        id: Date.now(), 
        status: 1 
      } as SMSConfig]);
    }
    setShowConfigModal(false);
    setCurrentConfig({
      id: undefined,
      phoneNumber: '',
      assistant: '',
      triggerKey: '',
      triggerValue: '',
    });
    setIsEditing(false);
  };

  const handleDeleteConfig = (id: number) => {
    setSMSConfigurations(smsConfigurations.filter(config => config.id !== id));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = smsConfigurations.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-8 bg-gray-900 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-teal-400">AI SMS Integration</h1>
        <p className="text-gray-400">Manage your AI SMS Integration settings here.</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="mb-4">
          <Button 
            onClick={() => handleOpenModal()}
            className="bg-teal-600 hover:bg-teal-700 text-white flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add SMS Configuration</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>AI Assistant</TableHead>
                <TableHead>Trigger Keys</TableHead>
                <TableHead>Trigger Values</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>{config.phoneNumber}</TableCell>
                  <TableCell>{config.assistant}</TableCell>
                  <TableCell>{config.triggerKey}</TableCell>
                  <TableCell>{config.triggerValue}</TableCell>
                  <TableCell>
                    <Badge variant={config.status === 1 ? "success" : "secondary"}>
                      {config.status === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(config)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-gray-400">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, smsConfigurations.length)} of {smsConfigurations.length} entries
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Previous
            </Button>
            <Button
              onClick={() => paginate(currentPage + 1)}
              disabled={indexOfLastItem >= smsConfigurations.length}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit SMS Configuration' : 'Add SMS Configuration'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Phone Number</Label>
              <Select
                value={currentConfig.phoneNumber}
                onValueChange={(value) => setCurrentConfig({ ...currentConfig, phoneNumber: value })}
              >
                <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Choose a number..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+12176346394">+1 (217) 634-6394</SelectItem>
                  <SelectItem value="+19548748669">+1 (954) 874-8669</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select AI Assistant</Label>
              <Select
                value={currentConfig.assistant}
                onValueChange={(value) => setCurrentConfig({ ...currentConfig, assistant: value })}
              >
                <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Choose an AI assistant..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assistant-1">Assistant 1</SelectItem>
                  <SelectItem value="assistant-2">Assistant 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Trigger Key</Label>
              <Input
                value={currentConfig.triggerKey}
                onChange={(e) => setCurrentConfig({ ...currentConfig, triggerKey: e.target.value })}
                className="bg-gray-700 border-gray-600"
                placeholder="Enter trigger key"
              />
            </div>

            <div>
              <Label>Trigger Value</Label>
              <Input
                value={currentConfig.triggerValue}
                onChange={(e) => setCurrentConfig({ ...currentConfig, triggerValue: e.target.value })}
                className="bg-gray-700 border-gray-600"
                placeholder="Enter trigger value"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfigModal(false)}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isEditing ? 'Update Configuration' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}