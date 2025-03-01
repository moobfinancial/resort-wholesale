import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import type { Voice, Provider } from './types';

interface VoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voice: Voice | null;
  providers: Provider[];
}

export function VoiceDetailsModal({ voice, isOpen, onClose, providers }: VoiceDetailsModalProps) {
  if (!voice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white">
            Voice Details: {voice.name}
          </DialogTitle>
          <p className="text-sm text-gray-400">
            View and manage voice settings
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h4 className="font-semibold text-white mb-2">Characteristics</h4>
            <p className="text-gray-300">Gender: {voice.gender}</p>
            <p className="text-gray-300">Nationality: {voice.nationality}</p>
            <p className="text-gray-300">Language: {voice.language}</p>
            <p className="text-gray-300">
              Provider: {voice.provider}
              <Badge 
                variant={providers.find(p => p.name === voice.provider)?.status === "Included" ? "secondary" : "destructive"}
                className="ml-2"
              >
                {providers.find(p => p.name === voice.provider)?.status || "Custom"}
              </Badge>
            </p>
            {(voice.eleven_labs_id || voice.deepgram_id || voice.playht_id) && (
              <p className="text-gray-300">
                ID: {voice.eleven_labs_id || voice.deepgram_id || voice.playht_id}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {voice.traits.map((trait, index) => (
                <span key={index} className="px-2 py-0.5 bg-gray-700 text-gray-200 rounded-full text-xs">
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Actions</h4>
            <div className="space-y-2">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <Play className="w-4 h-4 mr-2" /> Play Sample
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}