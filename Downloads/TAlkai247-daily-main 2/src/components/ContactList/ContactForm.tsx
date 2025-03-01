import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Contact, TransparencyLevel, Subcategory } from '@/types/contact';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => void;
  contact?: Contact;
}

export function ContactForm({ isOpen, onClose, onSave, contact }: ContactFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const contactData: Partial<Contact> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      type: formData.get('type') as 'business' | 'personal',
      transparencyLevel: formData.get('transparencyLevel') as TransparencyLevel,
      subcategory: formData.get('subcategory') as Subcategory,
      customSubcategory: formData.get('customSubcategory') as string,
    } as Partial<Contact>;

    if (contact?.id) {
      contactData.id = contact.id;
      contactData.goals = contact.goals;
      contactData.tags = contact.tags;
    }

    onSave(contactData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={contact?.name}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={contact?.email}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={contact?.phone}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select name="type" defaultValue={contact?.type || 'business'}>
                <SelectTrigger className="col-span-3 bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
<SelectItem value="business">Business</SelectItem>
<SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transparencyLevel" className="text-right">Transparency Level</Label>
              <RadioGroup
                defaultValue={contact?.transparencyLevel || 'Full Disclosure'}
                className="col-span-3"
                name="transparencyLevel"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Full Disclosure" id="full-disclosure" />
                  <Label htmlFor="full-disclosure">Full Disclosure</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Partial Disclosure" id="partial-disclosure" />
                  <Label htmlFor="partial-disclosure">Partial Disclosure</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No Disclosure" id="no-disclosure" />
                  <Label htmlFor="no-disclosure">No Disclosure</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subcategory" className="text-right">Subcategory</Label>
              <Select name="subcategory" defaultValue={contact?.subcategory}>
                <SelectTrigger className="col-span-3 bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="Stranger">Stranger</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Friends">Friends</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customSubcategory" className="text-right">Custom Subcategory</Label>
              <Input
                id="customSubcategory"
                name="customSubcategory"
                defaultValue={contact?.customSubcategory}
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaignName" className="text-right">Campaign Name</Label>
              <Input
                id="campaignName"
                name="campaignName"
                className="col-span-3 bg-gray-700 text-white border-gray-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
              {contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
