import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Copy, EyeOff, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TemplateListProps {
  templates: any[];
  onSelectTemplate: (template: any) => void;
  onEditTemplate: (template: any) => void;
  onCopyTemplate: (template: any) => void;
  onToggleHideTemplate: (templateId: number) => void;
  onDeleteTemplate: (templateId: number) => void;
}

export function TemplateList({
  templates,
  onSelectTemplate,
  onEditTemplate,
  onCopyTemplate,
  onToggleHideTemplate,
  onDeleteTemplate
}: TemplateListProps) {
  return (
    <Card className="bg-gray-800 border-gray-700 col-span-1">
      <CardHeader>
        <CardTitle className="text-white">Template List</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)] template-list-scroll-area">
          {templates.map((template) => (
            <div key={template.id} className="flex flex-col p-2 mb-2 bg-gray-700 rounded">
              <div className="flex items-center justify-between">
                <span className="text-white">{template.name}</span>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onSelectTemplate(template)}>
                    <Eye className="h-4 w-4 text-teal-400" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditTemplate(template)}>
                    <Edit className="h-4 w-4 text-teal-400" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onCopyTemplate(template)}>
                    <Copy className="h-4 w-4 text-blue-400" />
                  </Button>
                  {template.isSystem ? (
                    <Button variant="ghost" size="sm" onClick={() => onToggleHideTemplate(template.id)}>
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
                          <AlertDialogAction className="bg-red-600 text-white" onClick={() => onDeleteTemplate(template.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.map((tag: string, index: number) => (
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
  );
}