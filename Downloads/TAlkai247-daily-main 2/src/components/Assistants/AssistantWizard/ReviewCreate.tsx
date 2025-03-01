import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ReviewCreateProps {
  formData: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function ReviewCreate({ formData, onComplete, onBack }: ReviewCreateProps) {
  const getVoiceName = (voiceId: string, provider: string) => {
    // For now, just return both provider and ID for better visibility
    return `${provider} - ${voiceId}`;
  };

  const formatModelName = (model: string) => {
    if (!model) return 'Not set';
    // Keep the full model name for better identification
    return model;
  };

  const formatProvider = (provider: string) => {
    if (!provider) return 'Not set';
    
    // Handle case-insensitive provider names and various formats
    const normalizedProvider = provider.toLowerCase();
    switch(normalizedProvider) {
      case 'playht':
      case 'play.ht':
      case 'play_ht':
        return 'PlayHT';
      case 'elevenlabs':
      case '11labs':
        return 'ElevenLabs';
      case 'deepgram':
        return 'Deepgram';
      case 'cartesia':
        return 'Cartesia';
      case 'anthropic':
        return 'Anthropic';
      case 'openai':
        return 'OpenAI';
      case 'google':
        return 'Google';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  console.log('Review formData:', {
    provider: formData.provider,
    model: formData.model,
    voice: formData.voice
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Review Your Assistant</h2>

      <Card className="p-4 bg-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Basic Information</h3>
        <div className="space-y-2 text-gray-300">
          <p><span className="font-medium">Name:</span> {formData.name || 'Not set'}</p>
          <p><span className="font-medium">First Message:</span> {formData.firstMessage || 'Not set'}</p>
          <p><span className="font-medium">System Prompt:</span> {formData.systemPrompt || 'Not set'}</p>
        </div>
      </Card>

      <Card className="p-4 bg-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">LLM Configuration</h3>
        <div className="space-y-2 text-gray-300">
          <p>
            <span className="font-medium">Provider:</span>{' '}
            {formatProvider(formData.provider)}
          </p>
          <p>
            <span className="font-medium">Model:</span>{' '}
            {formatModelName(formData.model)}
          </p>
        </div>
      </Card>

      {formData.voice && (
        <Card className="p-4 bg-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Voice Configuration</h3>
          <div className="space-y-2 text-gray-300">
            <p>
              <span className="font-medium">Provider:</span>{' '}
              {formatProvider(formData.voice.provider)}
            </p>
            <p>
              <span className="font-medium">Voice:</span>{' '}
              {getVoiceName(formData.voice.voiceId, formData.voice.provider)}
            </p>
            {formData.voice.settings && (
              <div className="mt-2">
                <p className="font-medium mb-1">Settings:</p>
                <ul className="list-disc list-inside pl-4">
                  <li>Speed: {formData.voice.settings.speed}x</li>
                  <li>Pitch: {formData.voice.settings.pitch}x</li>
                  <li>Stability: {(formData.voice.settings.stability * 100).toFixed(0)}%</li>
                  <li>Volume: {formData.voice.settings.volume}%</li>
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-4 bg-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Tools</h3>
        <div className="space-y-2">
          {formData.tools?.length > 0 ? (
            formData.tools.map((tool: string, index: number) => (
              <div key={index} className="text-gray-300">
                • {tool}
              </div>
            ))
          ) : (
            <p className="text-gray-300">No tools configured</p>
          )}
        </div>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onComplete(formData)}>
          Create Assistant
        </Button>
      </div>
    </div>
  );
}