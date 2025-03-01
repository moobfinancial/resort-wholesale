import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CallInterface } from './CallInterface';
import { WhisperTemplates } from './WhisperTemplates';
import { ContactSelector, Contact } from './ContactSelector';
import { useWhisperState } from './hooks/useWhisperState';

export default function WhisperComponent() {
  const {
    state,
    set,
    handleStartCall,
    handleEndCall,
    handleSelectContact,
    handleSendMessage,
    handleVoiceInput,
  } = useWhisperState();

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
                onSelectContact={(contact: Contact) => handleSelectContact(contact)}
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
  );
}