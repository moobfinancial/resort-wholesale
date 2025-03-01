import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import type { WhisperState, Contact, CallTranscriptEntry } from '../types';

const initialContacts: Contact[] = [
  { 
    id: '1', 
    name: "John Doe", 
    number: "+1234567890", 
    email: "john@example.com", 
    type: "business" 
  },
  { 
    id: '2', 
    name: "Jane Smith", 
    number: "+1987654321", 
    email: "jane@example.com", 
    type: "personal" 
  },
  { 
    id: '3', 
    name: "Alice Johnson", 
    number: "+1122334455", 
    email: "alice@example.com", 
    type: "business" 
  },
];

const initialState: WhisperState = {
  activeCall: false,
  selectedContact: null,
  goals: [],
  contacts: initialContacts,
  showContactDialog: false,
  showWhisperSetupDialog: false,
  newContact: { name: "", number: "", email: "", type: "personal" },
  contactSearch: "",
  showContactsSheet: false,
  whisperEnabled: false,
  micMuted: false,
  volume: 50,
  callTranscript: [],
  userMessage: "",
  isListening: false,
};

export function useWhisperState() {
  const [state, setState] = useState<WhisperState>(initialState);
  const { toast } = useToast();

  const set = useCallback((field: keyof WhisperState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleStartCall = useCallback(() => {
    if (!state.selectedContact) {
      toast({
        title: "No Contact Selected",
        description: "Please select a contact before starting a call.",
        variant: "destructive"
      });
      return;
    }
    set('activeCall', true);
    set('callTranscript', [
      {
        type: 'ai',
        message: `Connected to call with ${state.selectedContact.name}. AI assistant is ready to help.`,
        timestamp: new Date().toISOString()
      }
    ]);
    toast({
      title: "Call Started",
      description: `Connected to ${state.selectedContact.name}`,
    });
  }, [state.selectedContact, set, toast]);

  const handleEndCall = useCallback(() => {
    set('activeCall', false);
    set('callTranscript', []);
    toast({
      title: "Call Ended",
      description: "The call has been terminated.",
    });
  }, [set, toast]);

  const handleSelectContact = useCallback((contact: Contact) => {
    set('selectedContact', contact);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (state.userMessage.trim()) {
      const newMessage: CallTranscriptEntry = {
        type: 'user',
        message: state.userMessage,
        timestamp: new Date().toISOString()
      };

      const newTranscript = [...state.callTranscript, newMessage];
      set('callTranscript', newTranscript);
      set('userMessage', '');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: CallTranscriptEntry = {
          type: 'ai',
          message: `I understand you said: "${state.userMessage}". Here's my suggestion...`,
          timestamp: new Date().toISOString()
        };
        set('callTranscript', [...newTranscript, aiResponse]);
      }, 1000);
    }
  }, [state.userMessage, state.callTranscript, set]);

  const handleVoiceInput = useCallback(() => {
    if (!state.isListening) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          set('isListening', true);
          toast({
            title: "Voice Input Active",
            description: "Listening for your voice input...",
          });
        })
        .catch(() => {
          toast({
            title: "Microphone Access Denied",
            description: "Please enable microphone access to use voice input.",
            variant: "destructive"
          });
        });
    } else {
      set('isListening', false);
      toast({
        title: "Voice Input Stopped",
        description: "Voice input has been disabled.",
      });
    }
  }, [state.isListening, set, toast]);

  return {
    state,
    set,
    handleStartCall,
    handleEndCall,
    handleSelectContact,
    handleSendMessage,
    handleVoiceInput,
  };
}