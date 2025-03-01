import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Info, 
  PhoneOutgoing, 
  Eye 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CallControlsProps {
  isCallActive: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onScheduleCall?: () => void;
}

export function CallControls({
  isCallActive,
  onStartCall,
  onEndCall,
  onScheduleCall
}: CallControlsProps) {
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [outboundNumber, setOutboundNumber] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState('mark');
  const [fallbackNumber, setFallbackNumber] = useState('');
  const [answerBeforeAI, setAnswerBeforeAI] = useState(false);
  const [ringCount, setRingCount] = useState(3);

  const handleStartCall = () => {
    console.log('Starting call...');
    onStartCall();
  };

  const handleEndCall = () => {
    console.log('Ending call...');
    onEndCall();
  };

  const handleScheduleCall = () => {
    if (onScheduleCall) {
      onScheduleCall();
    } else {
      setShowScheduleDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Inbound Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Call Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              {!isCallActive ? (
                <Button 
                  onClick={handleStartCall}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <PhoneOutgoing className="h-4 w-4 mr-2" />
                  Start Call
                </Button>
              ) : (
                <Button 
                  onClick={handleEndCall}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <PhoneOutgoing className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleScheduleCall}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Call
              </Button>
            </div>

            <div>
              <Label>Choose Assistant</Label>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mark">Mark</SelectItem>
                  <SelectItem value="sarah">Sarah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fallback Destination</Label>
              <Input
                placeholder="Enter fallback phone number"
                value={fallbackNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFallbackNumber(e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label>Answer Call Before AI</Label>
                <Switch
                  checked={answerBeforeAI}
                  onCheckedChange={setAnswerBeforeAI}
                />
              </div>
              {answerBeforeAI && (
                <div className="flex items-center space-x-2">
                  <Label>Rings Before AI Takes Over</Label>
                  <Input 
                    type="number" 
                    value={ringCount} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRingCount(parseInt(e.target.value))} 
                    className="bg-gray-700 border-gray-600 text-white" 
                    min={1} 
                    max={10} 
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-teal-400 mb-3">Active Inbound Calls</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <PhoneOutgoing className="h-4 w-4 text-teal-400" />
                    <div>
                      <p className="text-sm text-white">+1 (444) 555-6666</p>
                      <p className="text-xs text-gray-400">00:02:47</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outbound Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Outbound
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                Make outbound calls using AI assistant
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Enter Phone Number</Label>
            <Input 
              type="tel" 
              placeholder="+1 (555) 123-4567"
              value={outboundNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOutboundNumber(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
          </div>

          <div>
            <Label>Choose Assistant</Label>
            <Select defaultValue="mark">
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mark">Mark</SelectItem>
                <SelectItem value="sarah">Sarah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button
              className="bg-teal-600 hover:bg-teal-700 flex-1"
            >
              Call Now
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleScheduleCall}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Call
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-teal-400 mb-3">Call Schedule</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                <div>
                  <p className="text-sm text-white">+1 (123) 456-7890</p>
                  <p className="text-xs text-gray-400">2023-06-15 14:30</p>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-teal-400 mb-3">Active Outbound Calls</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <PhoneOutgoing className="h-4 w-4 text-teal-400" />
                  <div>
                    <p className="text-sm text-white">+1 (111) 222-3333</p>
                    <p className="text-xs text-gray-400">00:05:23</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Ongoing Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Call with: </p>
            <div className="bg-gray-700 rounded-lg p-4 min-h-[200px]">
              <h3 className="text-lg font-semibold mb-4">Call Transcript</h3>
              <div className="space-y-2">
                <p className="text-gray-300">AI: Hello, how can I help you today?</p>
                <p className="text-blue-400">User: I'd like to schedule an appointment.</p>
                <p className="text-gray-300">AI: I'll help you with that. What time works best for you?</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                className="flex-1 bg-gray-700 border-gray-600"
              />
              <Button className="bg-teal-600 hover:bg-teal-700">Send</Button>
            </div>
            <div className="flex space-x-2">
              <Button
                className="bg-teal-600 hover:bg-teal-700 flex-1"
                onClick={handleStartCall}
              >
                Start Call
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEndCall}
              >
                End Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Schedule Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                className="bg-teal-600 hover:bg-teal-700 flex-1"
                onClick={handleScheduleCall}
              >
                Schedule
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowScheduleDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}