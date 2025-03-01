import { useState } from 'react';
import { Eye, Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  tags: string[];
  type: 'system' | 'user';
  systemPrompt: string;
  firstMessage: string;
  tools: string[];
}

interface TemplateSelectionProps {
  formData: any;
  onNext: (template: any) => void;
}

const systemTemplates: Template[] = [
  {
    id: 'personal-assistant',
    name: 'Personal Assistant',
    tags: ['Productivity', 'Organization'],
    type: 'system',
    systemPrompt: 'You are a personal assistant dedicated to helping with daily tasks, scheduling, and organization.',
    firstMessage: 'Hello! I\'m your personal assistant. How can I help you organize your day?',
    tools: ['Calendar Integration']
  },
  {
    id: 'fitness-coach',
    name: 'Fitness Coach',
    tags: ['Health', 'Wellness'],
    type: 'system',
    systemPrompt: 'You are a fitness coach helping users achieve their health and wellness goals.',
    firstMessage: 'Welcome! Let\'s work together on your fitness journey. What are your goals?',
    tools: ['Calendar Integration']
  }
];

export default function TemplateSelection({ onNext }: TemplateSelectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = systemTemplates.filter(template => {
    if (!searchQuery) return true;
    return (
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <input
        type="text"
        placeholder="Search templates..."
        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-6">
        <div
          className="p-6 rounded-lg cursor-pointer border-2 border-gray-700 hover:border-teal-600 bg-gray-700"
          onClick={() => onNext({
            id: 'blank',
            name: 'Blank Template',
            tags: [],
            type: 'system',
            systemPrompt: '',
            firstMessage: '',
            tools: []
          })}
        >
          <Plus className="h-12 w-12 text-teal-400 mb-4" />
          <h3 className="text-xl font-semibold text-white">Start from Scratch</h3>
          <p className="text-gray-400 mt-2">Create a custom assistant without any predefined settings</p>
        </div>

        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">{template.name}</h3>
              <span className="px-2 py-1 text-xs rounded bg-teal-600 text-white">
                {template.type}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setSelectedTemplate(template)}
              >
                <Eye size={16} />
                <span>Preview</span>
              </button>
              
              <button
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                onClick={() => onNext(template)}
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedTemplate.name}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedTemplate(null)}
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-teal-400 font-medium mb-2">System Prompt</h3>
                <p className="text-gray-300">{selectedTemplate.systemPrompt}</p>
              </div>
              
              <div>
                <h3 className="text-teal-400 font-medium mb-2">First Message</h3>
                <p className="text-gray-300">{selectedTemplate.firstMessage}</p>
              </div>
              
              <div>
                <h3 className="text-teal-400 font-medium mb-2">Tools</h3>
                <ul className="list-disc list-inside text-gray-300">
                  {selectedTemplate.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-400 hover:text-white"
                onClick={() => setSelectedTemplate(null)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                onClick={() => {
                  onNext(selectedTemplate);
                  setSelectedTemplate(null);
                }}
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}