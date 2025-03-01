"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Resources() {
  const resources = [
    { id: 1, title: 'Getting Started Guide', type: 'Documentation', link: '#' },
    { id: 2, title: 'API Documentation', type: 'Documentation', link: '#' },
    { id: 3, title: 'Best Practices for AI Calls', type: 'Guide', link: '#' },
    { id: 4, title: 'Integrating with CRM Systems', type: 'Tutorial', link: '#' },
    { id: 5, title: 'Understanding AI Ethics', type: 'Whitepaper', link: '#' },
    { id: 6, title: 'Talkai247 Feature Overview', type: 'Video', link: '#' },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const filteredResources = resources.filter(resource => 
    (resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     resource.type.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedType === 'All' || resource.type === selectedType)
  );

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-teal-400">Resources</h2>
        <p className="text-gray-400">Access helpful resources and documentation</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4 w-full">
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 text-white border-gray-700 flex-grow"
          />
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="bg-gray-800 text-white border-gray-700 w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Documentation">Documentation</SelectItem>
              <SelectItem value="Guide">Guide</SelectItem>
              <SelectItem value="Tutorial">Tutorial</SelectItem>
              <SelectItem value="Whitepaper">Whitepaper</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="mb-2">
                    {resource.type}
                  </Badge>
                  <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                    <a href={resource.link} target="_blank" rel="noopener noreferrer">
                      View Resource
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}