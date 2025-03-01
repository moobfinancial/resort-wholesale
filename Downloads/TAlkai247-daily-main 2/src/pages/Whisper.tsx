"use client"

import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CallInterface } from '@/components/Whisper/CallInterface';
import { WhisperTemplates } from '@/components/Whisper/WhisperTemplates';
import { ContactSelector, Contact } from '@/components/Whisper/ContactSelector';
import { useWhisperState } from '@/components/Whisper/hooks/useWhisperState';

export default function WhisperTab() {
  const {
    state,
    set,
    handleStartCall,
    handleEndCall,
    handleSendMessage,
    handleVoiceInput,
  } = useWhisperState();

  const handleSelectContact = (contact: Contact) => {
    set('selectedContact', contact);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 bg-gray-900 text-gray-100">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400">Whisper Management</h1>
          <p className="text-gray-400">Manage AI whisper suggestions during calls</p>
        </div>

        <div className={`grid ${state.activeCall ? 'grid-cols-1' : 'grid-cols-3'} gap-6`}>
          {!state.activeCall && (
            <div className="col-span-1">
              <ContactSelector
                contacts={state.contacts}
                selectedContact={state.selectedContact}
                onSelectContact={handleSelectContact}
              />
            </div>
          )}

          <div className={state.activeCall ? 'col-span-full' : 'col-span-2'}>
            <Card className="bg-gray-800 border-gray-700">
              <CallInterface
                state={state}
                onStartCall={handleStartCall}
                onEndCall={handleEndCall}
                onSendMessage={handleSendMessage}
                onVoiceInput={handleVoiceInput}
                onVolumeChange={(value) => set('volume', value)}
                onMessageChange={(value) => set('userMessage', value)}
              />
            </Card>
          </div>

          {!state.activeCall && (
            <div className="col-span-full">
              <WhisperTemplates />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}