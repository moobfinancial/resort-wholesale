import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, PhoneOff } from 'lucide-react';

interface CallTranscriptEntry {
  role: 'ai' | 'user' | 'AI' | 'User';
  message?: string;
  content?: string;
  timestamp?: string;
}

interface ActiveCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber?: string;
  transcript: CallTranscriptEntry[];
  isListening?: boolean;
  isMuted?: boolean;
  volume?: number;
  onJoinCall?: () => void;
  onEndCall: () => void;
  onSendMessage: () => void;
  onUserMessageChange?: (message: string) => void;
  onToggleMute?: () => void;
  onVolumeChange?: (value: number) => void;
}

export function ActiveCallDialog({
  open,
  onOpenChange,
  phoneNumber,
  transcript,
  onEndCall,
  onSendMessage,
}: ActiveCallDialogProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage();
      setMessage('');
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-teal-400 text-xl">
            Active Call {phoneNumber && `with ${phoneNumber}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[300px] bg-gray-900 rounded-md p-4">
            <div className="space-y-4">
              {transcript.map((entry, index) => (
                <div 
                  key={index} 
                  className={`flex ${entry.role.toLowerCase() === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      entry.role.toLowerCase() === 'user' ? 'bg-teal-600' : 'bg-gray-700'
                    }`}
                  >
                    {entry.message || entry.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 border-gray-600 text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleVoiceInput}
              className={`${
                isListening ? 'text-red-400 hover:text-red-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              onClick={handleSendMessage}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="destructive"
            onClick={onEndCall}
            className="bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}