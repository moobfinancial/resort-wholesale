import { useState } from 'react';
import { X } from 'lucide-react';
import TemplateSelection from './TemplateSelection';
import CustomizeAssistant from './CustomizeAssistant';
import VoiceSelection from './VoiceSelection';
import ConfigureTools from './ConfigureTools';
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
  tools: {
    id: string;
    config: Record<string, any>;
  }[];
  voice: {
    provider: string | null;
    voiceId: string | null;
    settings: {
      volume: number;
      speed: number;
      pitch: number;
      stability: number;
    };
  };
}

interface AssistantWizardProps {
  onClose: () => void;
  onComplete: (assistant: Assistant) => void;
}

const wizardSteps = [
  { number: 1, title: 'Template' },
  { number: 2, title: 'Customize' },
  { number: 3, title: 'Voice' },
  { number: 4, title: 'Tools' },
  { number: 5, title: 'Review' }
];

export default function AssistantWizard({ onClose, onComplete }: AssistantWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<{
    name: string;
    firstMessage: string;
    systemPrompt: string;
    tools: Array<{
      type: string;
      name: string;
      config: Record<string, string | number | boolean>;
    }>;
    template: any;
    voiceProvider: string;
    voiceId: string;
    volume: number;
    provider: string;
    model: string;
  }>({
    name: '',
    firstMessage: '',
    systemPrompt: '',
    tools: [],
    template: null,
    voiceProvider: '',
    voiceId: '',
    volume: 75,
    provider: '',
    model: ''
  });

  const handleTemplateSelect = (template: {
    name: string;
    firstMessage: string;
    systemPrompt: string;
    tools: Array<{
      type: string;
      name: string;
      config: Record<string, string | number | boolean>;
    }>;
  }) => {
    setFormData({
      ...formData,
      name: template.name,
      firstMessage: template.firstMessage,
      systemPrompt: template.systemPrompt,
      tools: template.tools,
      template
    });
    setCurrentStep(2);
  };

  const handleCustomization = (data: {
    name: string;
    firstMessage: string;
    systemPrompt: string;
    provider: string;
    model: string;
  }) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3);
  };

  const handleVoiceSelection = (data: {
    voiceProvider: string;
    voiceId: string;
    volume: number;
  }) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(4);
  };

  const handleToolsConfig = (tools: Array<{
    type: string;
    name: string;
    config: Record<string, string | number | boolean>;
  }>) => {
    setFormData({ ...formData, tools });
    setCurrentStep(5);
  };

  const handleCreate = () => {
    const { provider, model, tools, ...rest } = formData; 
    const assistant: Assistant = {
      id: Math.random().toString(36).substr(2, 9),
      modes: ['web', 'voice'],
      provider,
      model,
      tools: tools.map(tool => ({
        id: tool.type,
        config: tool.config
      })),
      voice: {
        provider: formData.voiceProvider || null,
        voiceId: formData.voiceId || null,
        settings: {
          volume: formData.volume || 100,
          speed: 1,
          pitch: 1,
          stability: 0.75
        }
      },
      ...rest
    };
    onComplete(assistant);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[800px] max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-teal-400">
              Create your new Assistant
            </h2>
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-2">
            <WizardProgress steps={wizardSteps} currentStep={currentStep} />
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 1 && (
            <TemplateSelection
              onNext={handleTemplateSelect}
              onClose={onClose}
            />
          )}

          {currentStep === 2 && (
            <CustomizeAssistant
              formData={formData}
              onNext={handleCustomization}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <VoiceSelection
              formData={formData}
              onNext={handleVoiceSelection}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <ConfigureTools
              onNext={handleToolsConfig}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && (
            <ReviewCreate
              formData={formData}
              onBack={() => setCurrentStep(4)}
              onSubmit={handleCreate}
            />
          )}
        </div>
      </div>
    </div>
  );
}