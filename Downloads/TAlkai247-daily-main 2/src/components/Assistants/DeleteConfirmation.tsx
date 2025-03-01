import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Assistant } from '@/types/schema';

interface DeleteConfirmationProps {
  assistant: Assistant | null;
  onClose: () => void;
  onConfirm: (assistant: Assistant) => void;
  onCancel: () => void;
  title: string;
  description: string;
  isOpen: boolean;
}

export default function DeleteConfirmation({ isOpen, assistant, onClose, onCancel, onConfirm, title, description }: DeleteConfirmationProps) {
  if (!assistant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-300">
            {description} 
            This action cannot be undone.
          </p>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(assistant)}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete Assistant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}