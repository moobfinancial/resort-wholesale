import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { assistantsApi } from '@/lib/api/assistants';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
}

interface CreateAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAssistant({ isOpen, onClose, onCreated }: CreateAssistantProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    systemPrompt: '',
    firstMessage: '',
    tools: [] as Array<{
      type: string;
      name: string;
      config: Record<string, string>;
    }>
  });

  const availableTools = [
    { id: 'calendar', name: 'Calendar Integration', type: 'calendar' },
    { id: 'scraping', name: 'Web Scraping', type: 'scraping' },
    { id: 'sms', name: 'SMS Messaging', type: 'sms' }
  ];

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await assistantsApi.getModels();
        setModels(response.data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch available models",
          variant: "destructive"
        });
      }
    };

    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  const toggleTool = (toolId: string) => {
    const tool = availableTools.find(t => t.id === toolId);
    if (!tool) return;

    setFormData(prev => {
      const hasType = prev.tools.some(t => t.type === tool.type);
      
      return {
        ...prev,
        tools: hasType
          ? prev.tools.filter(t => t.type !== tool.type)
          : [...prev.tools, { type: tool.type, name: tool.name, config: {} }]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await assistantsApi.createAssistant(formData);
      toast({
        title: "Success",
        description: "Assistant created successfully"
      });
      onCreated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create assistant",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New AI Assistant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Assistant Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-700 border-gray-600"
              placeholder="e.g., Customer Support Assistant"
              required
            />
          </div>

          <div>
            <Label>Language Model</Label>
            <Select
              value={formData.model}
              onValueChange={(value) => setFormData({ ...formData, model: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex justify-between items-center">
                      <span>{model.name}</span>
                      <span className="text-sm text-gray-400">
                        ${model.pricing.prompt}/1K tokens
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="bg-gray-700 border-gray-600 min-h-[100px]"
              placeholder="Define the assistant's behavior and capabilities..."
              required
            />
          </div>

          <div>
            <Label>First Message</Label>
            <Textarea
              value={formData.firstMessage}
              onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
              className="bg-gray-700 border-gray-600"
              placeholder="The first message the assistant will send..."
              required
            />
          </div>

          <div>
            <Label>Tools</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {availableTools.map((tool) => (
                <Card
                  key={tool.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    formData.tools.some(t => t.type === tool.type)
                      ? 'bg-teal-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => toggleTool(tool.id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                    <Badge variant="secondary">{tool.type}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {formData.tools.map((tool, index) => (
            <Card key={index} className="bg-gray-700 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        tools: prev.tools.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {tool.type === 'calendar' && (
                    <div>
                      <Label>Calendar Provider</Label>
                      <Select
                        value={tool.config?.provider || ''}
                        onValueChange={(value) => {
                          setFormData(prev => ({
                            ...prev,
                            tools: prev.tools.map((t, i) =>
                              i === index
                                ? { ...t, config: { ...t.config, provider: value } }
                                : t
                            )
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google Calendar</SelectItem>
                          <SelectItem value="outlook">Outlook Calendar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {tool.type === 'scraping' && (
                    <div>
                      <Label>Base URL</Label>
                      <Input
                        value={tool.config?.url || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            tools: prev.tools.map((t, i) =>
                              i === index
                                ? { ...t, config: { ...t.config, url: e.target.value } }
                                : t
                            )
                          }));
                        }}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}

                  {tool.type === 'sms' && (
                    <div className="space-y-4">
                      <div>
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          value={tool.config?.apiKey || ''}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              tools: prev.tools.map((t, i) =>
                                i === index
                                  ? { ...t, config: { ...t.config, apiKey: e.target.value } }
                                  : t
                              )
                            }));
                          }}
                          placeholder="Enter API key"
                        />
                      </div>
                      <div>
                        <Label>From Number</Label>
                        <Input
                          value={tool.config?.fromNumber || ''}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              tools: prev.tools.map((t, i) =>
                                i === index
                                  ? { ...t, config: { ...t.config, fromNumber: e.target.value } }
                                  : t
                              )
                            }));
                          }}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Assistant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}