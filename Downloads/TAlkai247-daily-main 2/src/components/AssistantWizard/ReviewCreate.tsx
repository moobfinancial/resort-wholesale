import { Badge } from "@/components/ui/badge";

interface ReviewCreateProps {
  formData: any;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ReviewCreate({ formData, onBack, onSubmit }: ReviewCreateProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-white font-medium mb-4">Assistant Details</h3>
        <div className="space-y-4">
          <div>
            <span className="text-gray-400">Name:</span>
            <p className="text-white">{formData.name}</p>
          </div>
          <div>
            <span className="text-gray-400">First Message:</span>
            <p className="text-white">{formData.firstMessage}</p>
          </div>
          <div>
            <span className="text-gray-400">System Prompt:</span>
            <p className="text-white">{formData.systemPrompt}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-white font-medium mb-4">LLM Configuration</h3>
        <div className="space-y-2">
          <div>
            <span className="text-gray-400">Provider:</span>
            <p className="text-white capitalize">{formData.provider}</p>
          </div>
          <div>
            <span className="text-gray-400">Model:</span>
            <p className="text-white">{formData.model}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-white font-medium mb-4">Voice Configuration</h3>
        <div className="space-y-2">
          <div>
            <span className="text-gray-400">Provider:</span>
            <p className="text-white">{formData.voiceProvider}</p>
          </div>
          <div>
            <span className="text-gray-400">Selected Voice:</span>
            <p className="text-white">{formData.voiceId}</p>
          </div>
          <div>
            <span className="text-gray-400">Volume:</span>
            <p className="text-white">{formData.volume}%</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-6 rounded-lg">
        <h3 className="text-white font-medium mb-4">Selected Tools</h3>
        <div className="flex flex-wrap gap-2">
          {formData.tools.map((tool: any, index: number) => (
            <Badge key={index} variant="secondary" className="bg-gray-600">
              {tool.id}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Create Assistant
        </button>
      </div>
    </div>
  );
}