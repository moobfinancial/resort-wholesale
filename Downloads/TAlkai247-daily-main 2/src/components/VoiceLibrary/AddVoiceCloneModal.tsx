import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Upload, X, AlertTriangle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface AddVoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoice: (voice: {
    id: string;
    name: string;
    description: string;
    provider: string;
    audioUrl?: string;
  }) => void;
}

export function AddVoiceCloneModal({ isOpen, onClose, onAddVoice }: AddVoiceCloneModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setIsRecording(false);
      };
      
      setIsRecording(true);
      mediaRecorder.start();
      
      // Stop recording after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 30000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioBlob(file);
        toast({
          title: "File Uploaded",
          description: "Audio file has been selected for voice cloning.",
        });
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload an audio file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = () => {
    if (!agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!voiceName) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your voice clone.",
        variant: "destructive",
      });
      return;
    }

    if (!audioBlob) {
      toast({
        title: "Audio Required",
        description: "Please provide an audio sample for cloning.",
        variant: "destructive",
      });
      return;
    }

    onAddVoice({
      id: '',
      name: voiceName,
      description: voiceDescription,
      provider: '',
      audioUrl: URL.createObjectURL(audioBlob),
    });

    // Reset form
    setVoiceName("");
    setVoiceDescription("");
    setAudioBlob(null);
    setAgreeToTerms(false);
    
    toast({
      title: "Voice Clone Created",
      description: "Your voice clone is being processed and will be available soon.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Voice Clone</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-yellow-900/50 border-yellow-600/50 border rounded-md p-3 flex items-start">
            <AlertTriangle className="text-yellow-500 mr-2 mt-1" />
            <p className="text-sm text-yellow-300">
              You are about to clone a voice. Ensure you have the authority to clone this voice and will use it for legitimate purposes only.
            </p>
          </div>
          <Input
            placeholder="Voice Clone Name"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="bg-gray-700 text-white border-gray-600"
          />
          <Textarea
            placeholder="Voice Clone Description"
            value={voiceDescription}
            onChange={(e) => setVoiceDescription(e.target.value)}
            className="bg-gray-700 text-white border-gray-600"
          />
          <div className="border-2 border-dashed border-gray-600 p-4 text-center">
            <p className="text-gray-400">Drag and drop your audio file here or click to upload</p>
            <Input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload">
              <Button variant="outline" className="mt-2 border-gray-600 text-white hover:bg-gray-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Audio for Cloning
              </Button>
            </label>
          </div>
          <Button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            variant={isRecording ? "destructive" : "default"}
            className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}
          >
            {isRecording ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Voice Recording for Cloning
              </>
            )}
          </Button>
          {audioBlob && (
            <div className="bg-gray-700 p-2 rounded">
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              className="border-gray-600"
            />
            <Label htmlFor="terms" className="text-sm text-gray-300">
              I confirm that I have the authority to clone this voice and will use it for legitimate purposes only.
            </Label>
          </div>
        </div>
        <Button 
          onClick={handleSubmit} 
          className="w-full bg-teal-600 hover:bg-teal-700 text-white" 
          disabled={!agreeToTerms}
        >
          Submit Voice Clone
        </Button>
      </DialogContent>
    </Dialog>
  );
}