import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface TemplateDetailsProps {
  template: any | null;
  contacts: any[];
}

export function TemplateDetails({ template, contacts }: TemplateDetailsProps) {
  if (!template) {
    return (
      <Card className="bg-gray-800 border-gray-700 col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Select a Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Select a template from the list to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700 col-span-2">
      <CardHeader>
        <CardTitle className="text-white">Template Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-white">Name</Label>
            <Input value={template.name} readOnly className="bg-gray-700 text-white border-gray-600" />
          </div>
          <div>
            <Label className="text-white">Type</Label>
            <Input value={template.type} readOnly className="bg-gray-700 text-white border-gray-600" />
          </div>
          <div>
            <Label className="text-white">Prompt</Label>
            <Textarea value={template.prompt} readOnly className="bg-gray-700 text-white border-gray-600" rows={4} />
          </div>
          <div>
            <Label className="text-white">Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {template.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-gray-600 text-white">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-white">Template Type</Label>
            <Badge variant="outline" className={template.isSystem ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}>
              {template.isSystem ? "System Goal Template" : "User Created Goal"}
            </Badge>
          </div>
          <div>
            <Label className="text-white">Assigned Contacts</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {template.assignedContacts.length > 0 ? (
                contacts
                  .filter(contact => template.assignedContacts.includes(contact.id))
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
        </div>
      </CardContent>
    </Card>
  );
}