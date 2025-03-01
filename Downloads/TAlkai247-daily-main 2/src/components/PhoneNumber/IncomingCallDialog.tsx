import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneCall, PhoneOff } from 'lucide-react';

interface IncomingCall {
  id: number;
  number: string;
}

interface IncomingCallDialogProps {
  call: IncomingCall;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallDialog({ call, onAccept, onDecline }: IncomingCallDialogProps) {
  return (
    <Dialog open={true}>
      <DialogContent className="bg-gray-800 text-white">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <PhoneCall className="h-12 w-12 text-teal-400 mx-auto" />
          </div>
          <h2 className="text-xl font-bold mb-2">Incoming Call</h2>
          <p className="text-gray-400 mb-6">{call.number}</p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={onDecline}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Decline
            </Button>
            <Button
              onClick={onAccept}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <PhoneCall className="h-5 w-5 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}