import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Contact } from '@/types/contact';

interface TableActionsProps {
  contact: Contact;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export function TableActions({ contact, onView, onEdit, onDelete }: TableActionsProps) {
  return (
    <div className="flex space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(contact)}
              className="hover:bg-gray-700"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Quick View</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(contact)}
              className="hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit Contact</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(contact.id)}
              className="hover:bg-gray-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete Contact</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}