import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CallLog {
  id: string;
  date: string;
  time: string;
  phoneNumber: string;
  assistant: string;
  duration: string;
  status: 'Completed' | 'Missed';
}

export default function CallLogs() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState('All Assistants');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  const callLogs: CallLog[] = [
    { id: '1', date: '2023-06-15', time: '14:30', phoneNumber: '+1 (123) 456-7890', assistant: 'Elenya', duration: '5m 23s', status: 'Completed' },
    { id: '2', date: '2023-06-15', time: '15:45', phoneNumber: '+1 (234) 567-8901', assistant: 'SalesBot', duration: '3m 12s', status: 'Missed' },
    { id: '3', date: '2023-06-16', time: '09:15', phoneNumber: '+1 (345) 678-9012', assistant: 'Elenya', duration: '8m 47s', status: 'Completed' },
    { id: '4', date: '2023-06-16', time: '11:30', phoneNumber: '+1 (456) 789-0123', assistant: 'SalesBot', duration: '2m 55s', status: 'Completed' },
    { id: '5', date: '2023-06-17', time: '10:00', phoneNumber: '+1 (567) 890-1234', assistant: 'Elenya', duration: '6m 18s', status: 'Completed' },
  ];

  const handleViewTranscript = (call: CallLog) => {
    setSelectedCall(call);
    setShowTranscript(true);
  };

  const handleExportLogs = () => {
    // Implementation for exporting logs
    console.log('Exporting logs...');
  };

  const filteredLogs = callLogs.filter(log => {
    const matchesSearch = log.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.assistant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAssistant = selectedAssistant === 'All Assistants' || log.assistant === selectedAssistant;
    const matchesStatus = selectedStatus === 'All Statuses' || log.status === selectedStatus;
    return matchesSearch && matchesAssistant && matchesStatus;
  });

  return (
    <div className="p-8 bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Call Logs</h1>
        <Button 
          onClick={handleExportLogs}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Date Range</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Assistant</label>
          <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Assistants">All Assistants</SelectItem>
              <SelectItem value="Elenya">Elenya</SelectItem>
              <SelectItem value="SalesBot">SalesBot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Status</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Statuses">All Statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Missed">Missed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Search</label>
          <Input
            placeholder="Search by phone number or assistant"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Call Log Results</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-teal-400">Date</TableHead>
              <TableHead className="text-teal-400">Time</TableHead>
              <TableHead className="text-teal-400">Phone Number</TableHead>
              <TableHead className="text-teal-400">Assistant</TableHead>
              <TableHead className="text-teal-400">Duration</TableHead>
              <TableHead className="text-teal-400">Status</TableHead>
              <TableHead className="text-teal-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.date}</TableCell>
                <TableCell>{log.time}</TableCell>
                <TableCell>{log.phoneNumber}</TableCell>
                <TableCell>{log.assistant}</TableCell>
                <TableCell>{log.duration}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    log.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {log.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTranscript(log)}
                    className="text-teal-400 hover:text-teal-300"
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Date: {selectedCall.date} {selectedCall.time}</span>
                <span>Duration: {selectedCall.duration}</span>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg space-y-2">
                <p className="text-gray-300">AI: Hello, how can I assist you today?</p>
                <p className="text-blue-400">User: I'd like to schedule an appointment.</p>
                <p className="text-gray-300">AI: I can help you with that. What time works best for you?</p>
                <p className="text-blue-400">User: How about tomorrow at 2 PM?</p>
                <p className="text-gray-300">AI: Let me check the availability...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}