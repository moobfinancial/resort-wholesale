import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CallControls } from './CallControls';
import { ScheduleCallDialog } from './ScheduleCallDialog';
import { GetNewNumberDialog } from './GetNewNumberDialog';
import { AddPurchasedNumberDialog } from './AddPurchasedNumberDialog';
import { ActiveCallDialog } from './ActiveCallDialog';
import { IncomingCallDialog } from './IncomingCallDialog';

interface PhoneNumber {
  number: string;
  status: string;
  type: string;
  lastUsed: string;
}

interface CallTranscriptEntry {
  role: 'ai' | 'user';
  message: string;
  timestamp?: string;
  content?: string;
}

interface IncomingCall {
  id: number;
  number: string;
  timestamp: string;
}

interface PhoneManagerState {
  isNewUser: boolean;
  registrationStep: number;
  registrationType: string | null;
  registrationData: Record<string, any>;
  phoneNumbers: PhoneNumber[];
  selectedNumber: string;
  showScheduleModal: boolean;
  showGetNewNumberModal: boolean;
  showAddPurchasedNumberModal: boolean;
  scheduleDate: Date | undefined;
  scheduleTime: string;
  confirmationType: string;
  retryCount: string;
  inboundAssistant: string;
  outboundAssistant: string;
  outboundPhoneNumber: string;
  fallbackNumber: string;
  isCallLoading: boolean;
  isCallActive: boolean;
  callTranscript: CallTranscriptEntry[];
  isMicAllowed: boolean;
  volume: number;
  isMuted: boolean;
  isAssistantActive: boolean;
  userMessage: string;
  showActiveCallDialog: boolean;
  showIncomingCallDialog: boolean;
  activeCallId: string | null;
  userWantsToAnswer: boolean;
  ringCount: number;
  incomingRingingCalls: IncomingCall[];
  scheduledCalls: Array<{
    id: string;
    date: string;
    time: string;
    number: string;
    assistant: string;
    status: string;
  }>;
  activeCalls: Array<{
    id: string;
    number: string;
    assistant: string;
    status: string;
    duration: number;
  }>;
  isListening: boolean;
}

export function PhoneNumberManager() {
  const { toast } = useToast();
  const [state, setState] = useState<PhoneManagerState>({
    isNewUser: true,
    registrationStep: 0,
    registrationType: null,
    registrationData: {},
    phoneNumbers: [],
    selectedNumber: '',
    showScheduleModal: false,
    showGetNewNumberModal: false,
    showAddPurchasedNumberModal: false,
    scheduleDate: undefined,
    scheduleTime: '12:00',
    confirmationType: 'sms',
    retryCount: '1',
    inboundAssistant: 'mark',
    outboundAssistant: 'mark',
    outboundPhoneNumber: '',
    fallbackNumber: '',
    isCallLoading: false,
    isCallActive: false,
    callTranscript: [],
    isMicAllowed: false,
    volume: 50,
    isMuted: false,
    isAssistantActive: true,
    userMessage: '',
    showActiveCallDialog: false,
    showIncomingCallDialog: false,
    activeCallId: null,
    userWantsToAnswer: false,
    ringCount: 3,
    incomingRingingCalls: [],
    scheduledCalls: [],
    activeCalls: [],
    isListening: false,
  });

  const set = (field: keyof PhoneManagerState, value: any) => setState(prev => ({ ...prev, [field]: value }));

  const setPhoneNumbers = (value: PhoneNumber[]) => setState((prev: PhoneManagerState) => ({ ...prev, phoneNumbers: value }));

  const handleNumberPurchase = (number: string) => {
    setPhoneNumbers([...state.phoneNumbers, { number, status: 'active', type: 'inbound', lastUsed: new Date().toISOString() }]);
    set('selectedNumber', number);
    set('showGetNewNumberModal', false);
    toast({
      title: "Number Purchased",
      description: `Successfully acquired ${number}`
    });
  };

  const handleSendMessage = () => {
    if (state.userMessage.trim()) {
      setState(prev => ({ 
        ...prev, 
        callTranscript: [
          ...prev.callTranscript, 
          { 
            role: 'user', 
            message: prev.userMessage, 
            content: prev.userMessage,
            timestamp: new Date().toISOString() 
          }
        ], 
        userMessage: '' 
      }));
      
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          callTranscript: [
            ...prev.callTranscript, 
            { 
              role: 'ai', 
              message: 'Message received',
              content: 'Message received',
              timestamp: new Date().toISOString() 
            }
          ] 
        }));
      }, 1000);
    }
  };

  const handleToggleMute = () => {
    set('isMuted', !state.isMuted);
  };

  const handleEndCall = () => {
    set('isCallActive', false);
    toast({
      title: "Call Ended",
      description: "The call has been terminated."
    });
  };

  if (state.isNewUser) {
    return (
      <div className="flex-1 p-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Welcome to Talkai247</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-gray-300">
                To begin using our AI-powered calling features, you'll need to acquire a phone number.
                Click the button below to start the process.
              </p>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => set('registrationStep', 1)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Get New Number
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {state.registrationStep > 0 && (
          <div>
            {/* RegistrationFlow component is not imported */}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-teal-400">Phone Number Management</h1>
            <p className="text-gray-400">Manage your AI-powered phone numbers and calls</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => set('showAddPurchasedNumberModal', true)}
              variant="outline"
            >
              Add purchased number
            </Button>
            <Button 
              onClick={() => set('showGetNewNumberModal', true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Get new number
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {/* PhoneList component is not imported */}
          </div>

          <div className="md:col-span-2">
            <CallControls 
              isCallActive={state.isCallActive}
              onStartCall={() => set('isCallActive', true)}
              onEndCall={() => set('isCallActive', false)}
              onScheduleCall={() => set('showScheduleModal', true)}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ScheduleCallDialog
        open={state.showScheduleModal}
        onOpenChange={(open) => set('showScheduleModal', open)}
        scheduleDate={state.scheduleDate}
        scheduleTime={state.scheduleTime}
        confirmationType={state.confirmationType}
        retryCount={state.retryCount}
        onSchedule={(data) => {
          setState(prev => ({ ...prev, scheduledCalls: [...prev.scheduledCalls, { id: data.id, date: data.date, time: data.time, number: data.number, assistant: data.assistant, status: data.status }] }));
          set('showScheduleModal', false);
          toast({
            title: "Call Scheduled",
            description: "Your call has been scheduled successfully."
          });
        }}
      />

      <GetNewNumberDialog
        open={state.showGetNewNumberModal}
        onOpenChange={(open) => set('showGetNewNumberModal', open)}
        onPurchase={handleNumberPurchase}
      />

      <AddPurchasedNumberDialog
        open={state.showAddPurchasedNumberModal}
        onOpenChange={(open) => set('showAddPurchasedNumberModal', open)}
        onAdd={(data) => {
          setPhoneNumbers([...state.phoneNumbers, { number: data.number, status: 'active', type: 'inbound', lastUsed: new Date().toISOString() }]);
          set('showAddPurchasedNumberModal', false);
          toast({
            title: "Number Added",
            description: "Your purchased number has been added successfully."
          });
        }}
      />

      <ActiveCallDialog
        open={state.isCallActive}
        onOpenChange={(open) => set('isCallActive', open)}
        transcript={state.callTranscript}
        isListening={state.isListening}
        isMuted={state.isMuted}
        volume={state.volume}
        onUserMessageChange={(message: string) => set('userMessage', message)}
        onSendMessage={handleSendMessage}
        onToggleMute={handleToggleMute}
        onVolumeChange={(value: number) => set('volume', value)}
        onEndCall={handleEndCall}
      />

      {state.incomingRingingCalls.length > 0 && (
        <IncomingCallDialog
          call={state.incomingRingingCalls[0]}
          onAccept={() => {
            setState(prev => ({ ...prev, incomingRingingCalls: [] }));
            set('isCallActive', true);
            toast({
              title: "Call Connected",
              description: "You are now connected to the caller."
            });
          }}
          onDecline={() => {
            setState(prev => ({ ...prev, incomingRingingCalls: [] }));
            toast({
              title: "Call Declined",
              description: "The incoming call was declined."
            });
          }}
        />
      )}
    </div>
  );
}