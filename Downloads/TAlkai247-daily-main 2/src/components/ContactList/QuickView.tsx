import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Contact } from '@/types/contact';

interface QuickViewProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickView({ contact, isOpen, onClose }: QuickViewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold text-gray-200">Name:</Label>
            <span className="col-span-3">{contact.name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold text-gray-200">Email:</Label>
            <span className="col-span-3">{contact.email}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold text-gray-200">Phone:</Label>
            <span className="col-span-3">{contact.phone}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold text-gray-200">Type:</Label>
            <span className="col-span-3">
              <Badge variant={contact.type === 'personal' ? 'default' : 'secondary'}>
                {contact.type}
              </Badge>
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold text-gray-200">Goals:</Label>
            <div className="col-span-3">
              {contact.goals && contact.goals.length > 0 ? (
                <ul className="list-disc pl-5">
                  {contact.goals.map((goal) => (
                    <li key={goal.id}>{goal.title}</li>
                  ))}
                </ul>
              ) : (
                <span>No goals set</span>
              )}
            </div>
          </div>
          {contact.type === 'personal' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-gray-200">Transparency Level:</Label>
                <span className="col-span-3">{contact.transparencyLevel}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-gray-200">Subcategory:</Label>
                <span className="col-span-3">{contact.subcategory}</span>
              </div>
            </>
          )}
          {contact.tags && contact.tags.length > 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-gray-200">Tags:</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {contact.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
