import { useState, useEffect } from 'react';
import { Settings, X, Save, Trash2, Command, PhoneOff, Mic } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cartesiaApi } from '@/services/cartesia';
import { elevenlabsService } from '@/services/elevenlabs'; 
import { assistantApi } from '@/services/api';
import { openRouterApi, Model } from '@/lib/api/openrouter';
import { Voice } from '@/components/VoiceLibrary/types';
import ModelSelectionCard from '@/components/LLM/ModelSelectionCard';
import { playhtApi } from '@/services/playht';
import { deepgramApi } from '@/services/deepgram';
import { Assistant, AssistantTool } from '@/types/schema';
import { ReactNode } from 'react';
interface AssistantCardProps {
  assistant: Assistant;
  onUpdate?: (assistant: Assistant) => void;
  onDelete?: (assistant: Assistant) => void;
}

export default function AssistantCard({ assistant, onUpdate, onDelete }: AssistantCardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('model');
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssistant, setEditedAssistant] = useState(assistant);
  const [voicesByProvider, setVoicesByProvider] = useState<Record<string, Voice[]>>({
    Cartesia: [],
    elevenlabs: [],
    PlayHT: [],
    Deepgram: []
  });
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  const toggleCall = () => {
    setIsInCall(!isInCall);
    if (!isInCall) {
      // Start call
      toast({
        title: "Call Started",
        description: "You can now speak with your assistant"
      });
    } else {
      // End call
      toast({
        title: "Call Ended",
        description: "Your conversation has been saved"
      });
    }
  };

  // Update editedAssistant when assistant prop changes
  useEffect(() => {
    setEditedAssistant({
      ...assistant,
      tools: assistant.tools.map(tool => ({
        id: tool.id || '', 
        isEnabled: tool.isEnabled || false, 
        type: tool.type, 
        name: tool.name || '', 
        config: tool.config 
      } as AssistantTool))
    });
  }, [assistant]);

  // Initialize selectedVoice when component mounts or assistant changes
  useEffect(() => {
    const initializeVoice = async () => {
      if (assistant.voice?.voiceId && assistant.voice?.provider) {
        try {
          let voices;
          switch (assistant.voice.provider) {
            case 'Cartesia':
              voices = await cartesiaApi.getVoices();
              break;
            case 'elevenlabs':
              voices = await elevenlabsService.getVoices();
              break;
            case 'PlayHT':
              voices = await playhtApi.getVoices();
              break;
            case 'Deepgram':
              voices = await deepgramApi.getVoices();
              break;
            default:
              voices = [];
          }
          
          const voice = voices.find((v: Voice) => v.id === assistant.voice?.voiceId);
          if (voice) {
            setSelectedVoice(voice);
            setVoicesByProvider(prev => ({
              ...prev,
              [assistant.voice!.provider]: voices
            }));
          }
        } catch (error) {
          console.error('Error initializing voice:', error);
        }
      }
    };

    initializeVoice();
  }, [assistant]);

  // Fetch all available voices when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const fetchVoices = async () => {
        setIsLoadingVoices(true);
        try {
          const [cartesiaVoices, elevenlabsVoices, playhtVoices, deepgramVoices] = await Promise.all([
            cartesiaApi.getVoices(),
            elevenlabsService.getVoices(),
            playhtApi.getVoices(),
            deepgramApi.getVoices()
          ]);

          const mapPlayHTVoiceToVoice = (playHTVoice: any): Voice => {
            return {
              id: playHTVoice.id,
              name: playHTVoice.name,
              gender: playHTVoice.gender,
              nationality: playHTVoice.nationality,
              language: playHTVoice.language,
              traits: playHTVoice.traits,
              provider: 'playht',
            };
          };

          const providers = {
            Cartesia: cartesiaVoices.slice(0, 10),
            elevenlabs: elevenlabsVoices.slice(0, 10).map(mapPlayHTVoiceToVoice),
            PlayHT: playhtVoices.slice(0, 10).map(mapPlayHTVoiceToVoice),
            Deepgram: deepgramVoices.slice(0, 10),
          };

          setVoicesByProvider(providers);
        } catch (error) {
          console.error('Error fetching voices:', error);
          toast({
            title: "Error",
            description: "Failed to fetch voices. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingVoices(false);
        }
      };

      fetchVoices();
    }
  }, [isEditing]);

  // Fetch OpenRouter models when editing is enabled
  useEffect(() => {
    const fetchModels = async () => {
      if (!isEditing) return;
      
      setIsLoadingModels(true);
      setModelError(null);
      
      try {
        const response = await openRouterApi.getModels();
        if (response.success && response.data) {
          setModels(response.data);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch models');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setModelError(error instanceof Error ? error.message : 'Failed to fetch models');
        toast({
          title: "Error",
          description: "Failed to fetch available models",
          variant: "destructive"
        });
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [isEditing]);

  const handleVoiceSelect = (voice: Voice) => {
    console.log('Selected voice:', voice);
    setSelectedVoice(voice);
    setEditedAssistant(prev => ({
      ...prev,
      voice: {
        provider: voice.provider,
        voiceId: voice.id,
        settings: prev.voice?.settings || {
          speed: 1,
          pitch: 1,
          stability: 0.75,
          volume: 100
        }
      }
    }));
  };

  // Handle voice change from dropdown
  const handleVoiceChange = (voiceId: string, provider: string) => {
    const voice = voicesByProvider[provider]?.find((v: Voice) => v.id === voiceId);
    if (voice) {
      handleVoiceSelect(voice);
    } else {
      setEditedAssistant(prev => ({
        ...prev,
        voice: {
          provider,
          voiceId,
          settings: prev.voice?.settings || {
            speed: 1,
            pitch: 1,
            stability: 0.75,
            volume: 100
          }
        }
      }));
    }
  };

  const handleVoiceSettingChange = (setting: string, value: number) => {
    setEditedAssistant(prev => ({
      ...prev,
      voice: {
        ...prev.voice!,
        settings: {
          ...prev.voice!.settings,
          [setting]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      const updatedAssistant = { ...editedAssistant, voice: { ...editedAssistant.voice, settings: { ...editedAssistant.voice.settings, volume: editedAssistant.voice.settings.volume || 0 } } };
      const response = await assistantApi.update(updatedAssistant.id, updatedAssistant);
      if (response.success && response.data) {
        onUpdate?.(response.data);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Assistant updated successfully"
        });
      } else {
        throw new Error(response.error?.message || 'Failed to update assistant');
      }
    } catch (error) {
      console.error('Error updating assistant:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assistant",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    onDelete?.(assistant); // This will trigger the delete confirmation dialog in AssistantsTab
  };

  return (
    <Card className="w-full bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-white">{editedAssistant.name}</h3>
            {editedAssistant.voice && (
              <Badge variant="secondary">Voice Enabled</Badge>
            )}
          </div>
          <p className="text-xs text-gray-400">ID: {editedAssistant.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="model" className="flex-1">Model</TabsTrigger>
            <TabsTrigger value="voice" className="flex-1">Voice</TabsTrigger>
            <TabsTrigger value="tools" className="flex-1">Tools</TabsTrigger>
            <TabsTrigger value="test" className="flex-1">Test</TabsTrigger>
          </TabsList>

          {activeTab === 'model' && (
            <div className="space-y-4">
              {!isEditing ? (
                // View Mode
                <Card className="p-4 bg-gray-700">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Provider</Label>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {editedAssistant.provider || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-white">Model</Label>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {editedAssistant.model || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-white">First Message</Label>
                      <p className="mt-1 text-white whitespace-pre-wrap">
                        {editedAssistant.firstMessage}
                      </p>
                    </div>
                    <div>
                      <Label className="text-white">System Prompt</Label>
                      <p className="mt-1 text-white whitespace-pre-wrap">
                        {editedAssistant.systemPrompt}
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                // Edit Mode
                <>
                  <ModelSelectionCard
                    models={models}
                    selectedProvider={editedAssistant.provider}
                    selectedModel={editedAssistant.model}
                    onProviderChange={(provider: string) => {
                      setEditedAssistant(prev => ({
                        ...prev,
                        provider,
                        model: '' // Reset model when provider changes
                      }));
                    }}
                    onModelChange={(model: string) => {
                      setEditedAssistant(prev => ({
                        ...prev,
                        model
                      }));
                    }}
                    disabled={!isEditing}
                    loading={isLoadingModels}
                    error={modelError}
                  />

                  <div>
                    <Label className="text-white">First Message</Label>
                    <Textarea
                      value={editedAssistant.firstMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedAssistant(prev => ({ ...prev, firstMessage: e.target.value }))}
                      className="mt-2 bg-gray-700 text-white border-gray-600 min-h-[100px]"
                      placeholder="Enter the first message your assistant will say..."
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label className="text-white">System Prompt</Label>
                    <Textarea
                      value={editedAssistant.systemPrompt}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedAssistant(prev => ({ ...prev, systemPrompt: e.target.value }))}
                      className="mt-2 bg-gray-700 text-white border-gray-600 min-h-[100px]"
                      placeholder="Enter the system prompt that defines your assistant's behavior..."
                      disabled={!isEditing}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              {isLoadingVoices ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Spinner />
                  <span className="ml-2 text-gray-400">Loading voices...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {!isEditing ? (
                    // View Mode - Show current voice configuration
                    <Card className="p-4 bg-gray-700">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white">Voice Provider</Label>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {editedAssistant.voice?.provider || 'Not set'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-white">Voice</Label>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {selectedVoice ? selectedVoice.name : (editedAssistant.voice?.voiceId || 'Not set')}
                          </p>
                          {selectedVoice && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary">{selectedVoice.language}</Badge>
                              {selectedVoice.gender && (
                                <Badge variant="outline" className="text-xs">{selectedVoice.gender}</Badge>
                              )}
                              {selectedVoice.traits?.map((trait) => (
                                <Badge key={trait} variant="outline" className="text-xs">{trait}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {editedAssistant.voice?.settings && (
                          <div className="space-y-3">
                            <Label className="text-white">Voice Settings</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-gray-400">Speed</span>
                                <p className="text-white">{editedAssistant.voice.settings.speed}x</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-400">Pitch</span>
                                <p className="text-white">{editedAssistant.voice.settings.pitch}x</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-400">Stability</span>
                                <p className="text-white">{(editedAssistant.voice.settings.stability * 100).toFixed(0)}%</p>
                              </div>
                              <div>
                                <span className="text-sm text-gray-400">Volume</span>
                                <p className="text-white">{editedAssistant.voice.settings.volume}%</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Voice Provider</Label>
                        <Select
                          value={editedAssistant.voice?.provider || ''}
                          onValueChange={(provider: string) => {
                            setEditedAssistant(prev => ({
                              ...prev,
                              voice: {
                                ...prev.voice,
                                provider,
                                voiceId: '', // Reset voice when provider changes
                                settings: prev.voice?.settings || {
                                  speed: 1,
                                  pitch: 1,
                                  stability: 0.75,
                                  volume: 100
                                }
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                            <SelectValue placeholder="Select provider">
                              {editedAssistant.voice?.provider || 'Select provider'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(voicesByProvider).map((provider) => (
                              <SelectItem key={provider} value={provider}>
                                {provider}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {editedAssistant.voice?.provider && (
                        <div>
                          <Label className="text-white">Voice</Label>
                          <Select
                            value={editedAssistant.voice.voiceId}
                            onValueChange={(voiceId: string) => handleVoiceChange(voiceId, editedAssistant.voice!.provider)}
                          >
                            <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                              <SelectValue placeholder="Select voice">
                                {selectedVoice?.name || editedAssistant.voice.voiceId || 'Select voice'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-[200px]">
                                {voicesByProvider[editedAssistant.voice.provider]?.map((voice: Voice) => (
                                  <SelectItem key={voice.id} value={voice.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{voice.name}</span>
                                      <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span>{voice.language}</span>
                                        <Badge variant="secondary" className="text-xs">{voice.gender}</Badge>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {editedAssistant.voice?.voiceId && (
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center">
                              <Label className="text-white">Speed</Label>
                              <span className="text-sm text-gray-400">
                                {editedAssistant.voice.settings.speed}x
                              </span>
                            </div>
                            <Slider
                              value={[editedAssistant.voice.settings.speed]}
                              min={0.25}
                              max={4.0}
                              step={0.25}
                              onValueChange={([value]: number[]) => handleVoiceSettingChange('speed', value)}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center">
                              <Label className="text-white">Pitch</Label>
                              <span className="text-sm text-gray-400">
                                {editedAssistant.voice.settings.pitch}x
                              </span>
                            </div>
                            <Slider
                              value={[editedAssistant.voice.settings.pitch]}
                              min={0.5}
                              max={2.0}
                              step={0.1}
                              onValueChange={([value]: number[]) => handleVoiceSettingChange('pitch', value)}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center">
                              <Label className="text-white">Stability</Label>
                              <span className="text-sm text-gray-400">
                                {(editedAssistant.voice.settings.stability * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Slider
                              value={[editedAssistant.voice.settings.stability]}
                              min={0}
                              max={1}
                              step={0.1}
                              onValueChange={([value]: number[]) => handleVoiceSettingChange('stability', value)}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center">
                              <Label className="text-white">Volume</Label>
                              <span className="text-sm text-gray-400">
                                {editedAssistant.voice.settings.volume}% 
                              </span>
                            </div>
                            <Slider
                              value={[editedAssistant.voice.settings.volume || 0]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={([value]: number[]) => handleVoiceSettingChange('volume', value)}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              {!isEditing ? (
                // View Mode - Show current tools
                <div className="space-y-4">
                  {editedAssistant.tools && editedAssistant.tools.length > 0 ? (
                    editedAssistant.tools.map((tool: any, index: number) => (
                      <Card key={index} className="bg-gray-700 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                            {tool.config && (
                              <div className="mt-2 space-y-2">
                                {Object.entries(tool.config).map(([key, value]) => (
                                  <div key={key} className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-400 capitalize">{key}:</span>
                                    <span className="text-sm text-white">{value as ReactNode}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">{tool.type}</Badge>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Command className="w-12 h-12 mx-auto mb-4" />
                      <p>No tools configured</p>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode - Allow tool configuration
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'calendar', name: 'Calendar Integration', type: 'calendar' },
                      { id: 'scraping', name: 'Web Scraping', type: 'scraping' },
                      { id: 'sms', name: 'SMS Messaging', type: 'sms' }
                    ].map((tool) => (
                      <Card
                        key={tool.id}
                        className={`p-4 cursor-pointer transition-colors ${
                          editedAssistant.tools?.some(t => t.type === tool.type)
                            ? 'bg-teal-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => {
                          setEditedAssistant(prev => {
                            const tools = prev.tools || [];
                            const hasType = tools.some(t => t.type === tool.type);

                            return {
                              ...prev,
                              tools: hasType
                                ? tools.filter(t => t.type !== tool.type)
                                : [...tools, { type: tool.type, name: tool.name, config: {}, id: crypto.randomUUID(), isEnabled: true } as AssistantTool]
                            };
                          });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                          <Badge variant="secondary">{tool.type}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {editedAssistant.tools?.map((tool: any, index: number) => (
                    <Card key={index} className="bg-gray-700 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditedAssistant(prev => ({
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
                                onValueChange={(value: string) => {
                                  setEditedAssistant(prev => ({
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  setEditedAssistant(prev => ({
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
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setEditedAssistant(prev => ({
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
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setEditedAssistant(prev => ({
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
                </div>
              )}
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Button
                    variant={isInCall ? "destructive" : "default"}
                    className="rounded-full w-16 h-16 flex items-center justify-center p-0"
                    onClick={toggleCall}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isInCall ? (
                        <PhoneOff className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </div>
                  </Button>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                  <Mic className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-center">
                    {isInCall 
                      ? "Listening... Start speaking to your assistant"
                      : "Click the microphone button to start a conversation"}
                  </p>
                </div>
              </div>

              {isInCall && (
                <div className="text-center text-sm text-gray-400">
                  <p>Voice Recognition Active</p>
                  <p>Using {editedAssistant.voice?.provider || 'Default'} Voice</p>
                </div>
              )}
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
