import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { PhoneIcon, X, Mic, MicOff, Send, Volume2, User } from 'lucide-react';
import type { WhisperState } from './types';

interface CallInterfaceProps {
  state: WhisperState;
  onStartCall: () => void;
  onEndCall: () => void;
  onSendMessage: () => void;
  onVoiceInput: () => void;
  onVolumeChange: (value: number) => void;
  onMessageChange: (value: string) => void;
}

export function CallInterface({
  state,
  onStartCall,
  onEndCall,
  onSendMessage,
  onVoiceInput,
  onVolumeChange,
  onMessageChange,
}: CallInterfaceProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-white flex justify-between items-center">
          {state.activeCall ? 'Active Call' : 'Start New Call'}
          {state.selectedContact && (
            <div className="flex items-center text-sm text-gray-400">
              <User className="h-4 w-4 mr-2" />
              {state.selectedContact.name} ({state.selectedContact.number})
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button
              onClick={onStartCall}
              disabled={state.activeCall || !state.selectedContact}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <PhoneIcon className="mr-2 h-4 w-4" />
              Start Call
            </Button>
            <Button
              onClick={onEndCall}
              disabled={!state.activeCall}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="mr-2 h-4 w-4" />
              End Call
            </Button>
          </div>

          {!state.selectedContact && !state.activeCall && (
            <div className="text-center py-8 text-gray-400">
              Please select a contact to start a call
            </div>
          )}

          {state.activeCall && (
            <div className="space-y-4">
              <ScrollArea className="h-[300px] bg-gray-900 rounded-lg p-4">
                {state.callTranscript.map((entry, index) => (
                  <div key={index} className="mb-2">
                    <span className={entry.type === 'ai' ? 'text-teal-400' : 'text-blue-400'}>
                      {entry.type === 'ai' ? 'AI: ' : 'You: '}
                    </span>
                    <span className="text-gray-300">{entry.message}</span>
                  </div>
                ))}
              </ScrollArea>

              <div className="flex space-x-2">
                <Input
                  value={state.userMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-700 border-gray-600"
                />
                <Button
                  onClick={onVoiceInput}
                  className={state.isListening ? 'bg-red-600' : 'bg-gray-700'}
                >
                  {state.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={onSendMessage}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={[state.volume]}
                  onValueChange={(value) => onVolumeChange(value[0])}
                  max={100}
                  step={1}
                />
                <span className="min-w-[3ch]">{state.volume}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </>
  );
}