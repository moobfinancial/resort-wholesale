import { AlertTriangle } from 'lucide-react';

interface Assistant {
  name: string;
  id: string;
  modes: string[];
  firstMessage: string;
  systemPrompt: string;
  provider: string;
  model: string;
  tools: string[];
}

interface DeleteConfirmationProps {
  isOpen: boolean;
  assistant: Assistant | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmation({ isOpen, assistant, onClose, onConfirm }: DeleteConfirmationProps) {
  if (!isOpen || !assistant) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] rounded-lg p-6 max-w-md w-full m-4">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Delete Assistant</h2>
        </div>
        
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete <span className="font-semibold text-white">{assistant.name}</span>? 
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete Assistant
          </button>
        </div>
      </div>
    </div>
  );
}