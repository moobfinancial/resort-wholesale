import { Button } from "@/components/ui/button";
import { Contact } from '@/types/schema';

interface GoalsCellProps {
  contact: Contact;
  onEdit: () => void;
}

export default function GoalsCell({ onEdit }: GoalsCellProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Manage Goals
      </Button>
    </div>
  );
}
