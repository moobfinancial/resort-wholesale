import { assistantApi } from '@/services/api';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import AssistantCard from './AssistantCard';
import AssistantWizard from '../AssistantWizard';
import DeleteConfirmation from './DeleteConfirmation';
import { useToast } from "@/components/ui/use-toast";

// Import the Assistant type from the API
import type { Assistant } from '@/services/api';

// Main component for the Assistants tab
export default function AssistantsTab() {
  const { toast } = useToast();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);

  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const response = await assistantApi.getAll();
        if (response.data) {
          setAssistants(response.data);
        }
      } catch (error) {
        console.error('Error fetching assistants:', error);
        toast({
          title: "Error",
          description: "Failed to load assistants. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchAssistants();
  }, [toast]);

  const handleCreateAssistant = async (assistantData: any) => {
    try {
      const assistantToCreate = {
        ...assistantData,
        isActive: true
      };

      const response = await assistantApi.create(assistantToCreate);
      if (response.data) {
        setAssistants([...assistants, response.data]);
        setShowWizard(false);
        toast({
          title: "Success",
          description: "Assistant created successfully!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error creating assistant:', error);
      toast({
        title: "Error",
        description: "Failed to create assistant. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAssistant = async () => {
    if (!selectedAssistant) return;

    try {
      const response = await assistantApi.delete(selectedAssistant.id);
      if (response.success) {
        setAssistants(assistants.filter(a => a.id !== selectedAssistant.id));
        setShowDeleteDialog(false);
        toast({
          title: "Success",
          description: "Assistant deleted successfully!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error deleting assistant:', error);
      toast({
        title: "Error",
        description: "Failed to delete assistant. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAssistant = async (updatedAssistant: Assistant) => {
    try {
      const response = await assistantApi.update(updatedAssistant.id, updatedAssistant as Partial<Assistant>);
      if (response.data) {
        // Update the assistant in the list
        const updatedWithModes = response.data;
        
        setAssistants(assistants.map(assistant => 
          assistant.id === updatedAssistant.id ? updatedWithModes : assistant
        ));
        
        toast({
          title: "Success",
          description: "Assistant updated successfully!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error updating assistant:', error);
      toast({
        title: "Error",
        description: "Failed to update assistant. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter assistants based on search query
  const filteredAssistants = assistants.filter(assistant => 
    assistant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Your Assistants</h1>
        <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Assistant
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssistants.map(assistant => (
          <AssistantCard
            key={assistant.id}
            assistant={assistant}
            onDelete={() => {
              setSelectedAssistant(assistant);
              setShowDeleteDialog(true);
            }}
            onUpdate={handleUpdateAssistant}
          />
        ))}
      </div>

      {showWizard && (
        <AssistantWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleCreateAssistant}
        />
      )}

      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAssistant}
        assistant={selectedAssistant}
        title="Delete Assistant"
        description="Are you sure you want to delete this assistant? This action cannot be undone."
      />
    </div>
  );
}
