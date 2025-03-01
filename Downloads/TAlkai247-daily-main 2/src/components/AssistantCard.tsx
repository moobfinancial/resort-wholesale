import { useState } from 'react';
import { Share2, Settings } from 'lucide-react';

interface Tool {
  id: string;
  type?: string;
  config: Record<string, string | number | boolean>;
}

interface AssistantCardProps {
  name: string;
  id: string;
  modes: string[];
  firstMessage: string;
  systemPrompt: string;
  provider: string;
  model: string;
  tools: Tool[];
}

export default function AssistantCard({
  name,
  id,
  modes,
  firstMessage,
  systemPrompt,
  provider,
  model,
  tools
}: AssistantCardProps) {
  const [activeTab, setActiveTab] = useState('model');

  const tabs = [
    { id: 'model', label: 'Model' },
    { id: 'voice', label: 'Voice' },
    { id: 'functions', label: 'Functions' },
    { id: 'tools', label: 'Tools' },
    { id: 'advanced', label: 'Advanced' }
  ];

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">{name}</h2>
          <span className="text-gray-400 text-sm">{id}</span>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-[#2a2f3e] rounded-lg">
            <Share2 size={20} className="text-gray-400" />
          </button>
          <button className="p-2 hover:bg-[#2a2f3e] rounded-lg">
            <Settings size={20} className="text-gray-400" />
          </button>
          <button className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c]">
            Test {name}
          </button>
          <button className="px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488]">
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-white mb-2">Mode</h3>
          <select className="bg-[#2a2f3e] text-white px-4 py-2 rounded-lg w-full">
            {modes.map(mode => (
              <option key={mode} value={mode.toLowerCase()}>{mode}</option>
            ))}
          </select>
        </div>

        <div className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-[#1a1f2e]'
                  : 'bg-[#2a2f3e] text-white hover:bg-[#3a3f4e]'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'model' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white mb-2">First Message</h3>
              <textarea
                value={firstMessage}
                className="w-full bg-[#2a2f3e] text-white rounded-lg p-4 min-h-[100px] resize-none"
                readOnly
              />
            </div>

            <div>
              <h3 className="text-white mb-2">System Prompt</h3>
              <textarea
                value={systemPrompt}
                className="w-full bg-[#2a2f3e] text-white rounded-lg p-4 min-h-[200px] resize-none"
                readOnly
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <h3 className="text-white mb-2">Provider</h3>
                <select className="w-full bg-[#2a2f3e] text-white px-4 py-2 rounded-lg">
                  <option value={provider}>{provider}</option>
                </select>
              </div>
              <div>
                <h3 className="text-white mb-2">Model</h3>
                <select className="w-full bg-[#2a2f3e] text-white px-4 py-2 rounded-lg">
                  <option value={model}>{model}</option>
                </select>
              </div>
              <div>
                <h3 className="text-white mb-2">Knowledge Base</h3>
                <button className="w-full px-4 py-2 bg-[#2a2f3e] text-white rounded-lg hover:bg-[#3a3f4e]">
                  Add a New File
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            {tools.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between bg-[#2a2f3e] p-4 rounded-lg">
                <span className="text-white">{tool.id}</span>
                <button className="px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488]">
                  Configure
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-white mb-2">Provider</h3>
                <select className="w-full bg-[#2a2f3e] text-white px-4 py-2 rounded-lg">
                  <option value="playht">Playht</option>
                  <option value="elevenlabs">Elevenlabs</option>
                </select>
              </div>
              <div>
                <h3 className="text-white mb-2">Voice</h3>
                <select className="w-full bg-[#2a2f3e] text-white px-4 py-2 rounded-lg">
                  <option value="voice1">Voice 1</option>
                  <option value="voice2">Voice 2</option>
                </select>
              </div>
            </div>
            <div>
              <h3 className="text-white mb-2">Background Sound</h3>
              <select className="w-full bg-[#2a2f3e] text-white px-4 py-2 rounded-lg">
                <option value="none">None</option>
                <option value="ambient">Ambient</option>
                <option value="nature">Nature</option>
              </select>
            </div>
            <div>
              <h3 className="text-white mb-2">Speed</h3>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                defaultValue="1"
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}