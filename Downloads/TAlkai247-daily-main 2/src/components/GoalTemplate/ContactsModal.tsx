import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContacts: any[];
  assignedContacts: number[];
  onToggleContact: (contactId: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ContactsModal({
  isOpen,
  onClose,
  currentContacts,
  assignedContacts,
  onToggleContact,
  searchTerm,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange
}: ContactsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle>Assign Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 gap-4">
              {currentContacts.map(contact => (
                <div key={contact.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`contact-${contact.id}`}
                    checked={assignedContacts.includes(contact.id)}
                    onCheckedChange={() => onToggleContact(contact.id)}
                    className="border-white"
                  />
                  <Label htmlFor={`contact-${contact.id}`} className="text-sm">
                    {contact.name}
                    <span className="block text-xs text-gray-400">{contact.email}</span>
                    <span className="block text-xs text-gray-400">{contact.phone}</span>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex items-center justify-between">
            <Button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-700 hover:bg-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-gray-700 hover:bg-gray-600"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700 text-white">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}