import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Contact, Goal } from '@/types/contact';
import { Trash2, Plus } from 'lucide-react';

interface GoalManagerProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: Goal[]) => void;
}

export function GoalManager({ contact, isOpen, onClose, onSave }: GoalManagerProps) {
  const [goals, setGoals] = useState<Goal[]>(contact.goals || []);
  const [currentGoal, setCurrentGoal] = useState<Goal>({
    id: '',
    title: '',
    callType: 'Personal',
    template: '',
    aiPrompt: '',
    urls: [],
    files: []
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddGoal = () => {
    const newGoal = {
      ...currentGoal,
      id: Date.now().toString()
    };
    setGoals([...goals, newGoal]);
    setCurrentGoal({
      id: '',
      title: '',
      callType: 'Personal',
      template: '',
      aiPrompt: '',
      urls: [],
      files: []
    });
    setShowAddForm(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const handleSave = () => {
    onSave(goals);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Goals for {contact.name}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    <Badge variant="outline" className="mt-1">{goal.callType}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-300">Template: {goal.template}</p>
                  <p className="text-sm text-gray-300">AI Prompt: {goal.aiPrompt}</p>
                </div>
              </div>
            ))}

            {showAddForm ? (
              <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input
                    id="title"
                    value={currentGoal.title}
                    onChange={(e) => setCurrentGoal({ ...currentGoal, title: e.target.value })}
                    className="col-span-3 bg-gray-600 text-white border-gray-500"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="callType" className="text-right">Call Type</Label>
                  <Select
                    value={currentGoal.callType}
                    onValueChange={(value) => setCurrentGoal({ ...currentGoal, callType: value as 'Business' | 'Personal' })}
                  >
                    <SelectTrigger className="col-span-3 bg-gray-600 text-white border-gray-500">
                      <SelectValue placeholder="Select call type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template" className="text-right">Template</Label>
                  <Input
                    id="template"
                    value={currentGoal.template}
                    onChange={(e) => setCurrentGoal({ ...currentGoal, template: e.target.value })}
                    className="col-span-3 bg-gray-600 text-white border-gray-500"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="aiPrompt" className="text-right">AI Prompt</Label>
                  <Textarea
                    id="aiPrompt"
                    value={currentGoal.aiPrompt}
                    onChange={(e) => setCurrentGoal({ ...currentGoal, aiPrompt: e.target.value })}
                    className="col-span-3 bg-gray-600 text-white border-gray-500"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddGoal}
                    disabled={!currentGoal.title}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Add Goal
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-gray-700 hover:bg-gray-600"
              >
                <Plus className="h-4 w-4 mr-2" /> Add New Goal
              </Button>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}