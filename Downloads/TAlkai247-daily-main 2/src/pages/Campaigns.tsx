import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Edit, Trash2, Download, Upload } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  startDate: string;
  startTime: string;
  phoneNumber: string;
  assistant: string;
  description: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'test',
      startDate: '2024-10-31',
      startTime: '12:12',
      phoneNumber: '',
      assistant: '',
      description: '',
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0
    }
  ]);
  
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Campaign>({
    id: '',
    name: '',
    startDate: '',
    startTime: '',
    phoneNumber: '',
    assistant: '',
    description: '',
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0
  });

  const handleCreateCampaign = () => {
    const createdCampaign: Campaign = {
      ...newCampaign,
      id: Math.random().toString(36).substr(2, 9),
    };
    setCampaigns([...campaigns, createdCampaign]);
    setIsCreating(false);
    setNewCampaign({
      id: '',
      name: '',
      startDate: '',
      startTime: '',
      phoneNumber: '',
      assistant: '',
      description: '',
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0
    });
  };

  const handleUpdateCampaign = () => {
    if (selectedCampaign) {
      setCampaigns(campaigns.map((c: Campaign) => c.id === selectedCampaign.id ? selectedCampaign : c));
    }
    setSelectedCampaign(null);
  };

  const handleSelectCampaign = (campaign: Campaign | null) => {
    if (campaign) {
      setSelectedCampaign(campaign);
    } else {
      setSelectedCampaign(null);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white">
      <h2 className="text-3xl font-bold mb-6">Outbound Campaigns</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700 col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Campaign List</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full mb-4 bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => setIsCreating(true)}
            >
              + New Campaign
            </Button>
            <ScrollArea className="h-[calc(100vh-300px)]">
              {campaigns.map((campaign: Campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-2 mb-2 bg-gray-700 rounded">
                  <span className="text-white">{campaign.name}</span>
                  <div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      handleSelectCampaign(campaign);
                      setShowDetails(true);
                    }}>
                      <Eye className="h-4 w-4 text-teal-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSelectCampaign(campaign)}>
                      <Edit className="h-4 w-4 text-teal-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setCampaigns(campaigns.filter((c: Campaign) => c.id !== campaign.id));
                    }}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 col-span-2">
          <CardHeader>
            <CardTitle className="text-white">
              {isCreating ? 'Create New Campaign' : 'Edit Campaign'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="outbound-phone" className="text-white">Outbound Phone:</Label>
                  <Select value={isCreating ? newCampaign.phoneNumber : selectedCampaign?.phoneNumber} onValueChange={(value: string) => {
                    if (isCreating) {
                      setNewCampaign({...newCampaign, phoneNumber: value});
                    } else if (selectedCampaign) {
                      setSelectedCampaign({...selectedCampaign, phoneNumber: value});
                    }
                  }}>
                    <SelectTrigger id="outbound-phone" className="bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Select outbound phone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone1">+1 (123) 456-7890</SelectItem>
                      <SelectItem value="phone2">+1 (987) 654-3210</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assistant" className="text-white">Assistant:</Label>
                  <Select value={isCreating ? newCampaign.assistant : selectedCampaign?.assistant} onValueChange={(value: string) => {
                    if (isCreating) {
                      setNewCampaign({...newCampaign, assistant: value});
                    } else if (selectedCampaign) {
                      setSelectedCampaign({...selectedCampaign, assistant: value});
                    }
                  }}>
                    <SelectTrigger id="assistant" className="bg-gray-700 text-white border-gray-600">
                      <SelectValue placeholder="Select assistant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assistant1">Assistant 1</SelectItem>
                      <SelectItem value="assistant2">Assistant 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="campaign-name" className="text-white">Name:</Label>
                <Input 
                  id="campaign-name" 
                  className="bg-gray-700 text-white border-gray-600" 
                  placeholder="Enter campaign name" 
                  value={isCreating ? newCampaign.name : selectedCampaign?.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (isCreating) {
                      setNewCampaign({...newCampaign, name: e.target.value});
                    } else if (selectedCampaign) {
                      setSelectedCampaign({...selectedCampaign, name: e.target.value});
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="set-date" className="text-white">Set Date:</Label>
                  <Input 
                    id="set-date" 
                    type="date" 
                    className="bg-gray-700 text-white border-gray-600"
                    value={isCreating ? newCampaign.startDate : selectedCampaign?.startDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (isCreating) {
                        setNewCampaign({...newCampaign, startDate: e.target.value});
                      } else if (selectedCampaign) {
                        setSelectedCampaign({...selectedCampaign, startDate: e.target.value});
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="set-time" className="text-white">Set Time:</Label>
                  <Input 
                    id="set-time" 
                    type="time" 
                    className="bg-gray-700 text-white border-gray-600"
                    value={isCreating ? newCampaign.startTime : selectedCampaign?.startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (isCreating) {
                        setNewCampaign({...newCampaign, startTime: e.target.value});
                      } else if (selectedCampaign) {
                        setSelectedCampaign({...selectedCampaign, startTime: e.target.value});
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Description:</Label>
                <Textarea 
                  id="description" 
                  className="bg-gray-700 text-white border-gray-600" 
                  placeholder="Enter description here"
                  value={isCreating ? newCampaign.description : selectedCampaign?.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    if (isCreating) {
                      setNewCampaign({...newCampaign, description: e.target.value});
                    } else if (selectedCampaign) {
                      setSelectedCampaign({...selectedCampaign, description: e.target.value});
                    }
                  }}
                />
              </div>
              <div className="flex space-x-2">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>
              </div>
              <div>
                <Label className="text-white mb-2 block">Contact List:</Label>
                <ScrollArea className="h-40 bg-gray-700 rounded p-2">
                  {['Malik gee - +12176346394', 'Malik gee - +15005550006', 'dwain brown - +12176346394', 'dwain brown - +19548748669', 'Tommy Jones - 9548986970'].map((contact: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <Checkbox id={`contact-${index}`} />
                      <Label htmlFor={`contact-${index}`} className="text-white">{contact}</Label>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <div>
                <Label className="text-white mb-2 block">Selected Contacts:</Label>
                <div className="bg-gray-700 h-20 rounded p-2"></div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={isCreating ? handleCreateCampaign : handleUpdateCampaign}
              >
                {isCreating ? 'Create Campaign' : 'Update Campaign'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p><strong>Name:</strong> {selectedCampaign?.name}</p>
            <p><strong>Start Date:</strong> {selectedCampaign?.startDate}</p>
            <p><strong>Start Time:</strong> {selectedCampaign?.startTime}</p>
            <p><strong>Phone Number:</strong> {selectedCampaign?.phoneNumber}</p>
            <p><strong>Assistant:</strong> {selectedCampaign?.assistant}</p>
            <p><strong>Description:</strong> {selectedCampaign?.description}</p>
            <p><strong>Total Calls:</strong> {selectedCampaign?.totalCalls}</p>
            <p><strong>Successful Calls:</strong> {selectedCampaign?.successfulCalls}</p>
            <p><strong>Failed Calls:</strong> {selectedCampaign?.failedCalls}</p>
            <p><strong>Success Rate:</strong> {selectedCampaign ? (selectedCampaign.successfulCalls / selectedCampaign.totalCalls * 100).toFixed(2) : 0}%</p>
          </div>
          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-4" onClick={() => setShowDetails(false)}>
            Back to Campaigns
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}