import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { ContactTable } from './ContactTable';
import { ContactForm } from './ContactForm';
import { Contact } from '@/types/schema.ts';
import { useToast } from "@/components/ui/use-toast";
import { ExportImport } from './ExportImport';

export default function ContactList() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | undefined>(undefined);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const handleSaveContact = (contact: Partial<Contact>) => {
    if (contact.id) {
      setContacts(contacts.map(c => c.id === contact.id ? { ...c, ...contact } as Contact : c));
      toast({
        title: "Contact Updated",
        description: "Contact information has been successfully updated."
      });
    } else {
      const newContact = { ...contact, id: Date.now().toString() } as Contact;
      setContacts([...contacts, newContact]);
      toast({
        title: "Contact Added",
        description: "New contact has been successfully added."
      });
    }
    setShowForm(false);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    setSelectedContacts(selectedContacts.filter(contactId => contactId !== id));
    toast({
      title: "Contact Deleted",
      description: "Contact has been successfully removed."
    });
  };

  const handleImport = (importedContacts: Contact[]) => {
    setContacts([...contacts, ...importedContacts]);
    toast({
      title: "Contacts Imported",
      description: `${importedContacts.length} contacts have been successfully imported.`
    });
  };

  const filteredContacts = contacts.filter(contact => 
    contact.type === 'personal'
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <div className="flex space-x-2">
          <ExportImport contacts={contacts} onImport={handleImport} />
          <Button
            onClick={() => setShowForm(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Contact
          </Button>
        </div>
      </div>

      <ContactTable 
        contacts={filteredContacts}
        selectedContacts={selectedContacts}
        onEdit={contact => {
          setCurrentContact(contact);
          setShowForm(true);
        }}
        onDelete={handleDeleteContact}
        onSelect={(id: string) => 
          setSelectedContacts(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
          )
        }
      />

      {showForm && (
        <ContactForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setCurrentContact(undefined);
          }}
          contact={currentContact}
          onSave={handleSaveContact}
        />
      )}
    </div>
  );
}
