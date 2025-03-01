import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact } from '@/types/contact';
import { Download, Upload } from 'lucide-react';

interface ExportImportProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void;
}

export function ExportImport({ contacts, onImport }: ExportImportProps) {
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [importFormat, setImportFormat] = React.useState<'csv' | 'json'>('csv');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = (format: 'csv' | 'json') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      const headers = ['name', 'email', 'phone', 'type', 'transparencyLevel', 'subcategory', 'tags'];
      const csvContent = [
        headers.join(','),
        ...contacts.map(contact => [
          contact.name,
          contact.email,
          contact.phone,
          contact.type,
          contact.transparencyLevel,
          contact.subcategory || '',
          (contact.tags || []).join(';')
        ].join(','))
      ].join('\n');
      
      content = csvContent;
      filename = 'contacts.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(contacts, null, 2);
      filename = 'contacts.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      if (importFormat === 'csv') {
        const text = await file.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        
        const importedContacts = rows.slice(1).map(row => {
          const values = row.split(',');
          const contact: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            if (header === 'tags') {
              contact[header] = values[index] ? values[index].split(';') : [];
            } else {
              contact[header] = values[index];
            }
          });

          return {
            ...contact,
            id: Date.now().toString(),
          } as Contact;
        });

        onImport(importedContacts);
      } else {
        const text = await file.text();
        const importedContacts = JSON.parse(text);
        onImport(importedContacts.map((contact: Contact) => ({
          ...contact,
          id: Date.now().toString(),
        })));
      }
      
      setShowImportDialog(false);
    } catch (error) {
      console.error('Error importing contacts:', error);
      // Handle error (show toast notification, etc.)
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={() => handleExport('csv')}
          className="bg-gray-700 hover:bg-gray-600"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport('json')}
          className="bg-gray-700 hover:bg-gray-600"
        >
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowImportDialog(true)}
          className="bg-gray-700 hover:bg-gray-600"
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </div>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Select
                value={importFormat}
                onValueChange={(value: 'csv' | 'json') => setImportFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              type="file"
              accept={importFormat === 'csv' ? '.csv' : '.json'}
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImportFile(file);
                }
              }}
              className="bg-gray-700"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}