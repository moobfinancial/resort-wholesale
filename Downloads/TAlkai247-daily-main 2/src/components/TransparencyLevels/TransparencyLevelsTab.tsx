import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Trash2, Plus, Search, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: number;
  name: string;
  transparencyLevel: number;
}

interface Level {
  id: number;
  name: string;
  description: string;
  customPrompt: string;
}

export function TransparencyLevelsTab() {
  const [showNotification, setShowNotification] = useState(true);
  const [transparencyLevels, setTransparencyLevels] = useState<Level[]>([
    { id: 1, name: 'Full Disclosure', description: 'The AI assistant fully discloses its nature at the beginning of the call.', customPrompt: '' },
    { id: 2, name: 'Partial Disclosure', description: 'The AI assistant partially discloses its nature if asked during the call.', customPrompt: '' },
    { id: 3, name: 'No Disclosure', description: 'The AI assistant does not disclose its nature unless explicitly instructed to do so.', customPrompt: '' },
  ]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Family', transparencyLevel: 1 },
    { id: 2, name: 'Friends', transparencyLevel: 2 },
    { id: 3, name: 'Business', transparencyLevel: 2 },
    { id: 4, name: 'Strangers', transparencyLevel: 3 },
  ]);
  const [contacts, setContacts] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 (123) 456-7890', category: 1, transparencyOverride: null },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 (234) 567-8901', category: 2, transparencyOverride: null },
    { id: 3, name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 (345) 678-9012', category: 3, transparencyOverride: 1 },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', transparencyLevel: 3 });
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [levelFormData, setLevelFormData] = useState({ name: '', description: '', customPrompt: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage] = useState(10);

  useEffect(() => {
    const notificationShown = localStorage.getItem('transparencyNotificationShown');
    if (notificationShown) {
      setShowNotification(false);
    }
  }, []);

  const handleDismissNotification = () => {
    setShowNotification(false);
    localStorage.setItem('transparencyNotificationShown', 'true');
  };

  const handleAddCategory = () => {
    setCategories([...categories, { ...newCategory, id: Date.now() }]);
    setShowAddCategoryModal(false);
    setNewCategory({ name: '', transparencyLevel: 3 });
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter(category => category.id !== id));
    if (selectedCategory && selectedCategory.id === id) {
      setSelectedCategory(null);
    }
  };

  const handleOpenLevelModal = (level: Level | null) => {
    if (level) {
      setEditingLevel(level.id);
      setLevelFormData({ name: level.name, description: level.description, customPrompt: level.customPrompt });
    } else {
      setEditingLevel(null);
      setLevelFormData({ name: '', description: '', customPrompt: '' });
    }
    setShowLevelModal(true);
  };

  const handleLevelFormSubmit = () => {
    if (editingLevel) {
      setTransparencyLevels(transparencyLevels.map(level =>
        level.id === editingLevel ? { ...level, ...levelFormData } : level
      ));
    } else {
      setTransparencyLevels([...transparencyLevels, { ...levelFormData, id: Date.now() }]);
    }
    setShowLevelModal(false);
    setEditingLevel(null);
    setLevelFormData({ name: '', description: '', customPrompt: '' });
  };

  const handleDeleteLevel = (id: number) => {
    setTransparencyLevels(transparencyLevels.filter(level => level.id !== id));
    setCategories(categories.map(category => 
      category.transparencyLevel === id ? { ...category, transparencyLevel: 3 } : category
    ));
    setContacts(contacts.map(contact => 
      contact.transparencyOverride === id ? { ...contact, transparencyOverride: null } : contact
    ));
  };

  const handleCategoryTransparencyChange = (categoryId: number, levelId: number) => {
    setCategories(categories.map(category =>
      category.id === categoryId ? { ...category, transparencyLevel: levelId } : category
    ));
  };

  const handleContactCategoryChange = (contactId: number, categoryId: number) => {
    setContacts(contacts.map(contact =>
      contact.id === contactId ? { ...contact, category: categoryId, transparencyOverride: null } : contact
    ));
  };

  const handleContactOverrideChange = (contactId: number, levelId: number | null) => {
    setContacts(contacts.map(contact =>
      contact.id === contactId ? { ...contact, transparencyOverride: levelId } : contact
    ));
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-8 bg-gray-900 text-gray-100">
      <h2 className="text-3xl font-bold text-teal-400 mb-2">Transparency Levels</h2>
      <p className="text-gray-300 mb-6">Manage AI disclosure levels for calls based on contact categories</p>
      
      {showNotification && (
        <Alert className="mb-6 bg-blue-900 border-blue-800">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-gray-100">Information</AlertTitle>
          <AlertDescription className="mt-2 text-gray-200">
            Transparency levels now support custom prompts and can be edited after creation. You can create and modify personalized AI disclosure messages for each level.
          </AlertDescription>
          <Button 
            variant="link" 
            className="text-teal-300 hover:text-teal-200 absolute top-2 right-2"
            onClick={handleDismissNotification}
          >
            Don't show this message anymore
          </Button>
        </Alert>
      )}

      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="levels">Transparency Levels</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="levels">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-teal-400">Transparency Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={() => handleOpenLevelModal(null)} className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add New Level
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Level Name</TableHead>
                    <TableHead className="text-gray-300">Description</TableHead>
                    <TableHead className="text-gray-300">Custom Prompt</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transparencyLevels.map(level => (
                    <TableRow key={level.id}>
                      <TableCell className="text-gray-100">{level.name}</TableCell>
                      <TableCell className="text-gray-100">{level.description}</TableCell>
                      <TableCell className="text-gray-100">
                        {level.customPrompt ? (
                          <span className="text-teal-400">Custom</span>
                        ) : (
                          <span className="text-gray-500">Default</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenLevelModal(level)} className="mr-2">
                          <Edit className="h-4 w-4 text-teal-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLevel(level.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-teal-400">Contact Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button onClick={() => setShowAddCategoryModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add New Category
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Category Name</TableHead>
                    <TableHead className="text-gray-300">Default Transparency Level</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="text-gray-100">{category.name}</TableCell>
                      <TableCell>
                        <Select
                          value={category.transparencyLevel.toString()}
                          onValueChange={(value) => handleCategoryTransparencyChange(category.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {transparencyLevels.map(level => (
                              <SelectItem key={level.id} value={level.id.toString()}>
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-teal-400">Contact Transparency Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center">
                <Search className="mr-2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-gray-100 border-gray-600"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Phone</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Transparency Override</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentContacts.map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell className="text-gray-100">{contact.name}</TableCell>
                      <TableCell className="text-gray-100">{contact.email}</TableCell>
                      <TableCell className="text-gray-100">{contact.phone}</TableCell>
                      <TableCell>
                        <Select
                          value={contact.category.toString()}
                          onValueChange={(value) => handleContactCategoryChange(contact.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={contact.transparencyOverride ? contact.transparencyOverride.toString() : "default"}
                          onValueChange={(value) => handleContactOverrideChange(contact.id, value === "default" ? null : parseInt(value))}
                        >
                          <SelectTrigger className="w-[180px] bg-gray-700 text-gray-100 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            {transparencyLevels.map(level => (
                              <SelectItem key={level.id} value={level.id.toString()}>
                                {level.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-gray-300">
                  Showing {indexOfFirstContact + 1} to {Math.min(indexOfLastContact, filteredContacts.length)} of {filteredContacts.length} contacts
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-gray-700 text-gray-100 border-gray-600"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={indexOfLastContact >= filteredContacts.length}
                    className="bg-gray-700 text-gray-100 border-gray-600"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-teal-400">Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name" className="text-gray-200">Category Name</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="bg-gray-700 text-gray-100 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="category-transparency" className="text-gray-200">Default Transparency Level</Label>
              <Select
                value={newCategory.transparencyLevel.toString()}
                onValueChange={(value) => setNewCategory({ ...newCategory, transparencyLevel: parseInt(value) })}
              >
                <SelectTrigger id="category-transparency" className="w-full bg-gray-700 text-gray-100 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transparencyLevels.map(level => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCategory} className="bg-teal-600 hover:bg-teal-700 text-white">Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLevelModal} onOpenChange={setShowLevelModal}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-teal-400">
              {editingLevel ? 'Edit Transparency Level' : 'Add New Transparency Level'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="level-name" className="text-gray-200">Level Name</Label>
              <Input
                id="level-name"
                value={levelFormData.name}
                onChange={(e) => setLevelFormData({ ...levelFormData, name: e.target.value })}
                className="bg-gray-700 text-gray-100 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="level-description" className="text-gray-200">Description</Label>
              <Textarea
                id="level-description"
                value={levelFormData.description}
                onChange={(e) => setLevelFormData({ ...levelFormData, description: e.target.value })}
                className="bg-gray-700 text-gray-100 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="level-custom-prompt" className="text-gray-200">Custom Prompt (Optional)</Label>
              <Textarea
                id="level-custom-prompt"
                value={levelFormData.customPrompt}
                onChange={(e) => setLevelFormData({ ...levelFormData, customPrompt: e.target.value })}
                className="bg-gray-700 text-gray-100 border-gray-600"
                placeholder="Enter a custom AI disclosure prompt..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleLevelFormSubmit} className="bg-teal-600 hover:bg-teal-700 text-white">
              {editingLevel ? 'Update Level' : 'Add Level'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}