import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Plus, Edit, Copy, Eye, X, Trash2, EyeOff, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Template {
  id: number;
  type: string;
  name: string;
  prompt: string;
  tags: string[];
  isSystem: boolean;
  isHidden: boolean;
  assignedContacts: number[];
}

export function GoalTemplateTab() {
  // State management for templates
  const [templates, setTemplates] = useState<Template[]>([
    { id: 1, type: 'business', name: 'Maintain Professional Tone', prompt: 'Whisper: "Remember to keep a calm and professional tone, even if the conversation becomes challenging. Focus on finding solutions, not problems."', tags: ['communication', 'professionalism'], isSystem: true, isHidden: false, assignedContacts: [] },
    { id: 2, type: 'business', name: 'Stay Focused on Key Metrics', prompt: 'Whisper: "Guide the conversation toward the KPIs that matter—mention revenue targets, customer acquisition, and cost savings. Don\'t get sidetracked."', tags: ['metrics', 'focus'], isSystem: true, isHidden: false, assignedContacts: [] },
    { id: 3, type: 'personal', name: 'Stay Calm and Composed', prompt: 'Whisper: "Take a deep breath. Keep your tone calm and centered, especially if the conversation becomes stressful."', tags: ['stress-management', 'composure'], isSystem: true, isHidden: false, assignedContacts: [] },
    { id: 4, type: 'personal', name: 'Practice Active Listening', prompt: 'Whisper: "Focus on truly listening. Don\'t interrupt—acknowledge what\'s being said before you respond to show empathy."', tags: ['communication', 'empathy'], isSystem: true, isHidden: false, assignedContacts: [] },
  ]);

  // UI state management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newTag, setNewTag] = useState('');
  const [showHiddenTemplates, setShowHiddenTemplates] = useState(false);

  // Contact management state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage] = useState(50);

  // Generate dummy contacts on component mount
  useEffect(() => {
    const generateContacts = () => {
      const newContacts: Contact[] = [];
      for (let i = 1; i <= 500; i++) {
        newContacts.push({
          id: i,
          name: `Contact ${i}`,
          email: `contact${i}@example.com`,
          phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        });
      }
      setContacts(newContacts);
    };
    generateContacts();
  }, []);

  // Filter templates based on search term and active tab
  const filteredTemplates = templates.filter(template => 
    (template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     template.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
     template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (activeTab === 'all' || template.type === activeTab) &&
    (!template.isHidden || showHiddenTemplates)
  );

  // Filter and paginate contacts
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);

  // Template management functions
  const handleEditTemplate = () => {
    if (editedTemplate && editedTemplate.id) {
      if (editedTemplate.isSystem) {
        // Create a new user template based on the edited system template
        const newUserTemplate: Template = {
          ...editedTemplate,
          id: Date.now(),
          isSystem: false,
          name: `${editedTemplate.name} (User Edit)`
        };
        setTemplates([newUserTemplate, ...templates]);
        setSelectedTemplate(newUserTemplate);
        toast({
          title: "Template Created",
          description: "A new user template has been created based on the system template.",
        });
      } else {
        // Update existing user template
        const updatedTemplates = templates.map(t => 
          t.id === editedTemplate.id ? editedTemplate : t
        );
        setTemplates(updatedTemplates);
        setSelectedTemplate(editedTemplate);
        toast({
          title: "Template Updated",
          description: "The template has been updated successfully.",
        });
      }
      setShowEditModal(false);
    }
  };

  const handleSaveTemplate = () => {
    if (editedTemplate) {
      const updatedTemplates = templates.map(t => 
        t.id === editedTemplate.id ? editedTemplate : t
      );
      setTemplates(updatedTemplates);
      setShowEditModal(false);
    }
  };

  const handleCopyTemplate = (template: Template) => {
    const newTemplate: Template = { ...template, id: Date.now(), name: `${template.name} (Copy)`, isSystem: false, assignedContacts: [] };
    setTemplates([...templates, newTemplate]);
    toast({
      title: "Template Copied",
      description: `A copy of "${template.name}" has been created as a user template.`,
    });
  };

  const handleDeleteTemplate = (templateId: number) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "The user template has been deleted successfully.",
    });
  };

  const handleToggleHideTemplate = (templateId: number) => {
    const templateToToggle = templates.find(t => t.id === templateId);
    if (templateToToggle) {
      setTemplates(templates.map(t => 
        t.id === templateId ? { ...t, isHidden: !t.isHidden } : t
      ));
      toast({
        title: "Template Visibility Updated",
        description: `The template has been ${templateToToggle.isHidden ? 'unhidden' : 'hidden'}.`,
      });
    }
  };

  // Tag management functions
  const handleAddTag = () => {
    if (newTag.trim() && editedTemplate) {
      setEditedTemplate({
        ...editedTemplate,
        tags: [...editedTemplate.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editedTemplate) {
      setEditedTemplate({
        ...editedTemplate,
        tags: editedTemplate.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const handleTemplateChange = (field: keyof Template, value: Template[keyof Template]) => {
    setEditedTemplate(prev => ({
      ...prev,
      [field]: value
    }) as Template);
  };

  return (
    <div className="p-8 bg-gray-900 text-white">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-teal-400">Goal Templates</h2>
        <p className="text-gray-400">Manage and customize your goal templates for AI-assisted calls</p>
      </div>

      {/* Search and Create */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Search className="text-gray-400" />
          <Input
            placeholder="Search templates or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 text-white border-gray-700"
          />
        </div>
        <Button onClick={() => {
          const newTemplate: Template = {
            id: Date.now(),
            type: 'business', 
            name: '', 
            prompt: '', 
            tags: [], 
            isSystem: false, 
            assignedContacts: [], 
            isHidden: false
          };
          setEditedTemplate(newTemplate);
          setShowEditModal(true);
        }} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Create New Goal / Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="all" className="data-[state=active]:bg-teal-600">All Templates</TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-teal-600">Business</TabsTrigger>
          <TabsTrigger value="personal" className="data-[state=active]:bg-teal-600">Personal</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Show Hidden Templates Toggle */}
      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="show-hidden"
          checked={showHiddenTemplates}
          onCheckedChange={setShowHiddenTemplates}
        />
        <Label htmlFor="show-hidden">Show Hidden Templates</Label>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Template List */}
        <Card className="bg-gray-800 border-gray-700 col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Template List</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)] template-list-scroll-area">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="flex flex-col p-2 mb-2 bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-white">{template.name}</span>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(template)}>
                        <Eye className="h-4 w-4 text-teal-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedTemplate(template);
                        setEditedTemplate(template);
                        setShowEditModal(true);
                      }}>
                        <Edit className="h-4 w-4 text-teal-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCopyTemplate(template)}>
                        <Copy className="h-4 w-4 text-blue-400" />
                      </Button>
                      {template.isSystem ? (
                        <Button variant="ghost" size="sm" onClick={() => handleToggleHideTemplate(template.id)}>
                          {template.isHidden ? <Eye className="h-4 w-4 text-yellow-400" /> : <EyeOff className="h-4 w-4 text-yellow-400" />}
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-800 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the template.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-700 text-white">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 text-white" onClick={() => handleDeleteTemplate(template.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-600 text-white">
                        {tag}
                      </Badge>
                    ))}
                    <Badge variant="outline" className={template.isSystem ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}>
                      {template.isSystem ? "System" : "User"}
                    </Badge>
                    {template.isHidden && (
                      <Badge variant="outline" className="border-gray-500 text-gray-500">
                        Hidden
                      </Badge>
                    )}
                    {template.assignedContacts.length > 0 && (
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        {template.assignedContacts.length} Contact{template.assignedContacts.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Template Details */}
        <Card className="bg-gray-800 border-gray-700 col-span-2">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedTemplate ? 'Template Details' : 'Select a Template'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Name</Label>
                  <Input 
                    value={editedTemplate?.name || ''}
                    onChange={(e) => handleTemplateChange('name', e.target.value)}
                    placeholder="Template Name"
                  />
                </div>
                <div>
                  <Label className="text-white">Type</Label>
                  <Input value={selectedTemplate.type} readOnly className="bg-gray-700 text-white border-gray-600" />
                </div>
                <div>
                  <Label className="text-white">Prompt</Label>
                  <Textarea value={selectedTemplate.prompt} readOnly className="bg-gray-700 text-white border-gray-600" rows={4} />
                </div>
                <div>
                  <Label className="text-white">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-600 text-white">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-white">Template Type</Label>
                  <Badge variant="outline" className={selectedTemplate.isSystem ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}>
                    {selectedTemplate.isSystem ? "System Goal Template" : "User Created Goal"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-white">Assigned Contacts</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.assignedContacts.length > 0 ? (
                      contacts
                        .filter(contact => selectedTemplate.assignedContacts.includes(contact.id))
                        .map(contact => (
                          <Badge key={contact.id} variant="secondary" className="bg-blue-600 text-white">
                            {contact.name}
                          </Badge>
                        ))
                    ) : (
                      <span className="text-gray-400">No contacts assigned</span>
                    )}
                  </div>
                </div>
                <Button onClick={handleSaveTemplate} className="bg-teal-600 hover:bg-teal-700 text-white">
                  Save Template
                </Button>
              </div>
            ) : (
              <p className="text-gray-400">Select a template from the list to view details</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{editedTemplate && editedTemplate.id ? (editedTemplate.isSystem ? 'Create User Template from System Template' : 'Edit User Template') : 'Create New Goal Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-type">Call Type</Label>
              <RadioGroup
                id="template-type"
                value={editedTemplate ? editedTemplate.type : 'business'}
                onValueChange={(value) => {
                  if (editedTemplate) {
                    setEditedTemplate({ ...editedTemplate, type: value });
                  }
                }}
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
                value={editedTemplate ? editedTemplate.name : ''}
                onChange={(e) => {
                  if (editedTemplate) {
                    setEditedTemplate({ ...editedTemplate, name: e.target.value });
                  }
                }}
                className="bg-gray-700 text-white border-gray-600"
                placeholder="Enter a concise, descriptive title for your goal"
              />
            </div>
            <div>
              <Label htmlFor="template-prompt">AI Prompt</Label>
              <Textarea
                id="template-prompt"
                value={editedTemplate ? editedTemplate.prompt : ''}
                onChange={(e) => {
                  if (editedTemplate) {
                    setEditedTemplate({ ...editedTemplate, prompt: e.target.value });
                  }
                }}
                className="bg-gray-700 text-white border-gray-600"
                rows={4}
                placeholder="Enter the prompt that will be whispered to the AI during calls"
              />
            </div>
            <div>
              <Label htmlFor="template-tags">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editedTemplate && editedTemplate.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-600 text-white">
                    {tag}
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveTag(tag)} className="ml-1 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  id="template-tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="bg-gray-700 text-white border-gray-600"
                  placeholder="Add a new tag"
                />
                <Button onClick={handleAddTag} className="bg-teal-600 hover:bg-teal-700 text-white">
                  Add Tag
                </Button>
              </div>
            </div>
            <div>
              <Label>Assign Contacts</Label>
              <Button onClick={() => setShowContactsModal(true)} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Users className="mr-2 h-4 w-4" />
                Manage Assigned Contacts
              </Button>
            </div>
            <div>
              <Label htmlFor="scraping-url">URLs for Scraping</Label>
              <div className="flex space-x-2">
                <Input
                  id="scraping-url"
                  placeholder="Enter URL to scrape for additional context (e.g., https://example.com/product-info)"
                  className="bg-gray-700 text-white border-gray-600 flex-grow"
                />
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Scrape</Button>
              </div>
            </div>
            <div>
              <Label>Upload Files (PDF/CSV)</Label>
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="bg-gray-700 text-white border-gray-600">
                  Choose Files
                </Button>
                <span className="text-sm text-gray-400">No file(s) selected</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditTemplate} className="bg-teal-600 hover:bg-teal-700 text-white">
              {editedTemplate && editedTemplate.id ? (editedTemplate.isSystem ? 'Create User Template' : 'Update User Template') : 'Save New Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contacts Modal */}
      <Dialog open={showContactsModal} onOpenChange={setShowContactsModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assign Contacts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={contactSearchTerm}
                onChange={(e) => setContactSearchTerm(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-4">
                {currentContacts.map(contact => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={editedTemplate ? editedTemplate.assignedContacts.includes(contact.id) : false}
                      onCheckedChange={() => {
                        if (editedTemplate) {
                          const updatedContacts = editedTemplate.assignedContacts.includes(contact.id)
                            ? editedTemplate.assignedContacts.filter(id => id !== contact.id)
                            : [...editedTemplate.assignedContacts, contact.id];
                          setEditedTemplate({ ...editedTemplate, assignedContacts: updatedContacts });
                        }
                      }}
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-gray-700 hover:bg-gray-600"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowContactsModal(false)} className="bg-teal-600 hover:bg-teal-700 text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}