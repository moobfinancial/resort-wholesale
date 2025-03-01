import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Users, X } from 'lucide-react';

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
  onSave: () => void;
  onTemplateChange: (template: any) => void;
  onShowContactsModal: () => void;
  newTag: string;
  onNewTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export function EditTemplateModal({
  isOpen,
  onClose,
  template,
  onSave,
  onTemplateChange,
  onShowContactsModal,
  newTag,
  onNewTagChange,
  onAddTag,
  onRemoveTag
}: EditTemplateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>
            {template.id ? (template.isSystem ? 'Create User Template from System Template' : 'Edit User Template') : 'Create New Goal Template'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="template-type">Call Type</Label>
            <RadioGroup
              id="template-type"
              value={template.type}
              onValueChange={(value) => onTemplateChange({ ...template, type: value })}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" className="border-2 border-green-500 text-green-500" />
                <Label htmlFor="business">Business</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="personal" className="border-2 border-green-500 text-green-500" />
                <Label htmlFor="personal">Personal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" className="border-2 border-green-500 text-green-500" />
                <Label htmlFor="both">Both</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="template-name">Goal Title</Label>
            <Input
              id="template-name"
              value={template.name}
              onChange={(e) => onTemplateChange({ ...template, name: e.target.value })}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="Enter a concise, descriptive title for your goal"
            />
          </div>
          <div>
            <Label htmlFor="template-prompt">AI Prompt</Label>
            <Textarea
              id="template-prompt"
              value={template.prompt}
              onChange={(e) => onTemplateChange({ ...template, prompt: e.target.value })}
              className="bg-gray-700 text-white border-gray-600"
              rows={4}
              placeholder="Enter the AI prompt here. Start with 'Whisper:' followed by the instruction in quotes."
            />
          </div>
          <div>
            <Label htmlFor="template-tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {template.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-gray-600 text-white">
                  {tag}
                  <Button variant="ghost" size="sm" onClick={() => onRemoveTag(tag)} className="ml-1 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                id="template-tags"
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
                placeholder="Add a new tag"
              />
              <Button onClick={onAddTag} className="bg-teal-600 hover:bg-teal-700 text-white">
                Add Tag
              </Button>
            </div>
          </div>
          <div>
            <Label>Assign Contacts</Label>
            <Button onClick={onShowContactsModal} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Users className="mr-2 h-4 w-4" />
              Manage Assigned Contacts
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave} className="bg-teal-600 hover:bg-teal-700 text-white">
            {template.id ? (template.isSystem ? 'Create User Template' : 'Update User Template') : 'Save New Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}