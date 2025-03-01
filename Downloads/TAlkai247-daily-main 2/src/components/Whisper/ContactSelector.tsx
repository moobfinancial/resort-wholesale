import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export interface Contact {
  id: string;
  name: string;
  number: string;
  email: string;
  type: "personal" | "business";
}

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
}

export function ContactSelector({ contacts, selectedContact, onSelectContact }: ContactSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex justify-between items-center">
          <span>Select Contact</span>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id
                      ? 'bg-teal-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      <p className="text-sm text-gray-300">{contact.number}</p>
                    </div>
                    <Badge variant={contact.type === 'business' ? 'default' : 'secondary'}>
                      {contact.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}