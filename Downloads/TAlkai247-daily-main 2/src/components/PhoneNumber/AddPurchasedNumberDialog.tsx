import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneIncoming } from 'lucide-react';

interface AddPurchasedNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: any) => void;
}

export function AddPurchasedNumberDialog({
  open,
  onOpenChange,
  onAdd,
}: AddPurchasedNumberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Add Purchased Number</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Phone Number</Label>
            <Input
              placeholder="Enter phone number..."
              className="bg-gray-700 border-gray-600"
            />
          </div>

          <div>
            <Label>Authentication Token</Label>
            <Input
              type="password"
              placeholder="Enter token..."
              className="bg-gray-700 border-gray-600"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onAdd({})}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <PhoneIncoming className="h-4 w-4 mr-2" />
            Add Number
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}