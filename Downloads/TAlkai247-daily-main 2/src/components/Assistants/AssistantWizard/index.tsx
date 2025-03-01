import { useState } from 'react';
import { X } from 'lucide-react';
import TemplateSelection from './TemplateSelection';
import CustomizeAssistant from './CustomizeAssistant';
import ConfigureTools from './ConfigureTools';
import VoiceSelection from './VoiceSelection';
import ReviewCreate from './ReviewCreate';
import WizardProgress from './WizardProgress';

interface Assistant {
  name: string;
  id: string;
  modes: string[];
  firstMessage: string;
  systemPrompt: string;
  provider: string;
  model: string;
  tools: string[];
  voice?: {
    provider: string;
    voiceId: string;
    settings: {
      speed: number;
      pitch: number;
      stability: number;
      volume: number;
    };
  };
}

interface AssistantWizardProps {
  onClose: () => void;
  onComplete: (assistant: Assistant) => void;
}

const wizardSteps = [
  { number: 1, title: 'Choose Template' },
  { number: 2, title: 'Customize' },
  { number: 3, title: 'Voice Selection' },
  { number: 4, title: 'Configure Tools' },
  { number: 5, title: 'Review & Create' }
];

export default function AssistantWizard({ onClose, onComplete }: AssistantWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Assistant>>({});

  const handleNext = (data: Partial<Assistant>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = (data: Partial<Assistant>) => {
    const finalAssistant: Assistant = {
      ...formData,
      ...data,
      id: Math.random().toString(36).substring(7), // Generate a random ID for now
    } as Assistant;
    onComplete(finalAssistant);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        <WizardProgress steps={wizardSteps} currentStep={currentStep} />

        <div className="mt-6">
          {currentStep === 1 && (
            <TemplateSelection
              formData={formData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <CustomizeAssistant
              formData={formData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <VoiceSelection
              formData={formData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <ConfigureTools
              onNext={(tools) => handleNext({ ...formData, tools })}
              onBack={handleBack}
            />
          )}
          {currentStep === 5 && (
            <ReviewCreate
              formData={formData}
              onComplete={handleComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}