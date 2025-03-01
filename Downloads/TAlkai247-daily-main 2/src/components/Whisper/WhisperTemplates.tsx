import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';
import { businessTemplates, personalTemplates } from './data/templates';

export function WhisperTemplates() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Whisper Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Business Templates</h3>
            <div className="space-y-4">
              {businessTemplates.map((template, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium">{template.name}</h4>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{template.editablePrompt}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Personal Templates</h3>
            <div className="space-y-4">
              {personalTemplates.map((template, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium">{template.name}</h4>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{template.editablePrompt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}