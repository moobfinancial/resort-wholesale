import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tag, Trash2, FolderInput } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
}

export function BulkActions({ selectedCount, onAction }: BulkActionsProps) {
  return (
    <div className="flex items-center justify-between p-4 mb-4 bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-400">
          {selectedCount} {selectedCount === 1 ? 'contact' : 'contacts'} selected
        </span>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('delete')}
            className="bg-red-600/10 hover:bg-red-600/20 text-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('move')}
            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-500"
          >
            <FolderInput className="h-4 w-4 mr-2" />
            Move to Campaign
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('tag')}
            className="bg-green-600/10 hover:bg-green-600/20 text-green-500"
          >
            <Tag className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </div>
      </div>
      
      <Select onValueChange={onAction}>
        <SelectTrigger className="w-[180px] bg-gray-700">
          <SelectValue placeholder="More Actions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="export">Export Selected</SelectItem>
          <SelectItem value="merge">Merge Contacts</SelectItem>
          <SelectItem value="transparency">Update Transparency</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}