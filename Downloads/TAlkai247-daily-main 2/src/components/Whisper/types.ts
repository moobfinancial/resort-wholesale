export interface Contact {
  id: string;
  name: string;
  number: string;
  email: string;
  type: 'business' | 'personal';
}

export interface CallTranscriptEntry {
  type: 'ai' | 'user';
  message: string;
  timestamp?: string;
}

export interface WhisperState {
  activeCall: boolean;
  selectedContact: Contact | null;
  goals: any[];
  contacts: Contact[];
  showContactDialog: boolean;
  showWhisperSetupDialog: boolean;
  newContact: {
    name: string;
    number: string;
    email: string;
    type: 'business' | 'personal';
  };
  contactSearch: string;
  showContactsSheet: boolean;
  whisperEnabled: boolean;
  micMuted: boolean;
  volume: number;
  callTranscript: CallTranscriptEntry[];
  userMessage: string;
  isListening: boolean;
}

export interface WhisperTemplate {
  name: string;
  systemPrompt: string;
  editablePrompt: string;
}