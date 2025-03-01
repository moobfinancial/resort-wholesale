import { useState } from 'react';
import { Eye, Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  tags: string[];
  type: 'system' | 'user';
  systemPrompt: string;
  firstMessage: string;
  tools: Array<{
    type: string;
    name: string;
    config: Record<string, string | number | boolean>;
  }>;
}

interface TemplateSelectionProps {
  onNext: (template: Template) => void;
  onClose: () => void;
}

const systemTemplates: Template[] = [
  {
    id: 'personal-assistant',
    name: 'Personal Assistant',
    tags: ['Productivity', 'Organization'],
    type: 'system',
    systemPrompt: 'You are a personal assistant dedicated to helping with daily tasks, scheduling, and organization.',
    firstMessage: 'Hello! I\'m your personal assistant. How can I help you organize your day?',
    tools: [
      {
        type: 'calendar',
        name: 'Calendar Integration',
        config: {
          timezone: 'America/New_York',
          reminders: true,
        },
      },
    ],
  },
  {
    id: 'fitness-coach',
    name: 'Fitness Coach',
    tags: ['Health', 'Wellness'],
    type: 'system',
    systemPrompt: 'You are a fitness coach helping users achieve their health and wellness goals.',
    firstMessage: 'Welcome! Let\'s work together on your fitness journey. What are your goals?',
    tools: [
      {
        type: 'calendar',
        name: 'Calendar Integration',
        config: {
          timezone: 'America/New_York',
          reminders: true,
        },
      },
    ],
  },
  {
    id: 'language-tutor',
    name: 'Language Tutor',
    tags: ['Education', 'Languages'],
    type: 'system',
    systemPrompt: 'You are a language tutor specializing in multiple languages.',
    firstMessage: 'Hello! Ready to practice your language skills?',
    tools: [],
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    tags: ['Travel', 'Leisure'],
    type: 'system',
    systemPrompt: 'You are a travel planner with extensive knowledge of destinations worldwide.',
    firstMessage: 'Ready to plan your next adventure?',
    tools: [
      {
        type: 'calendar',
        name: 'Calendar Integration',
        config: {
          timezone: 'America/New_York',
          reminders: true,
        },
      },
      {
        type: 'scraping',
        name: 'Scraping Tool',
        config: {
          url: 'https://example.com',
          interval: 60,
        },
      },
    ],
  },
];

export default function TemplateSelection({ onNext }: TemplateSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'blank' | 'personal' | 'business' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const templateCategories = [
    {
      id: 'blank',
      label: 'Blank Template',
      description: 'Start from scratch with a clean slate',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=500&auto=format&fit=crop',
      icon: <Plus className="h-12 w-12 text-teal-500" />,
    },
    {
      id: 'personal',
      label: 'Personal Templates',
      description: 'Templates for individual use and personal assistance',
      image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=500&auto=format&fit=crop',
      icon: (
        <svg
          className="h-12 w-12 text-teal-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'business',
      label: 'Business Templates',
      description: 'Professional templates for business and enterprise',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop',
      icon: (
        <svg
          className="h-12 w-12 text-teal-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const filteredTemplates = systemTemplates.filter((template) => {
    if (!searchQuery) return true;
    return (
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#14b8a6]">Step 1: Choose a Template</h2>

      {/* Template Categories */}
      <div className="grid grid-cols-3 gap-6">
        {templateCategories.map((category) => (
          <div
            key={category.id}
            className={`group relative overflow-hidden rounded-lg cursor-pointer transition-all ${
              selectedCategory === category.id ? 'ring-2 ring-[#14b8a6]' : ''
            }`}
            onClick={() => setSelectedCategory(category.id as any)}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img
                src={category.image}
                alt={category.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gray-900/70 group-hover:bg-gray-900/60 transition-colors" />
            </div>

            {/* Content */}
            <div className="relative p-6 h-48 flex flex-col items-center justify-center text-center space-y-3">
              {category.icon}
              <h3 className="text-xl font-semibold text-white">{category.label}</h3>
              <p className="text-sm text-gray-300">{category.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Template Search & Grid */}
      {selectedCategory && selectedCategory !== 'blank' && (
        <>
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full px-4 py-2 bg-[#2a2f3e] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-[#2a2f3e] rounded-lg p-6 hover:bg-[#353b4e] transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      template.type === 'system' ? 'bg-blue-500' : 'bg-green-500'
                    } text-white`}
                  >
                    {template.type === 'system' ? 'System' : 'User'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-[#1a1f2e] text-gray-300 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye size={16} />
                    <span>Preview</span>
                  </button>

                  <button
                    className="px-4 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]"
                    onClick={() => onNext(template)}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1a1f2e] rounded-lg p-6 max-w-2xl w-full m-4">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{previewTemplate.name}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setPreviewTemplate(null)}
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-[#14b8a6] font-medium mb-2">System Prompt</h3>
                <p className="text-gray-300">{previewTemplate.systemPrompt}</p>
              </div>

              <div>
                <h3 className="text-[#14b8a6] font-medium mb-2">First Message</h3>
                <p className="text-gray-300">{previewTemplate.firstMessage}</p>
              </div>

              <div>
                <h3 className="text-[#14b8a6] font-medium mb-2">Tools</h3>
                <ul className="list-disc list-inside text-gray-300">
                  {previewTemplate.tools.map((tool) => (
                    <li key={tool.name}>
                      {tool.name} ({tool.type})
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-400 hover:text-white"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]"
                onClick={() => {
                  onNext(previewTemplate);
                  setPreviewTemplate(null);
                }}
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Button for Blank Template */}
      {selectedCategory === 'blank' && (
        <div className="flex justify-end mt-8">
          <button
            onClick={() =>
              onNext({
                id: 'blank',
                name: 'Blank Template',
                tags: [],
                type: 'system',
                systemPrompt: '',
                firstMessage: '',
                tools: [],
              })
            }
            className="px-6 py-2 bg-[#14b8a6] text-white rounded hover:bg-[#0d9488]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}