import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact } from '@/types/contact'; 
import { BarChart, Download } from 'lucide-react';

interface ActivityReportProps {
  contacts: Contact[];
}

interface ActivityStats {
  totalContacts: number;
  activeContacts: number;
  totalInteractions: number;
  interactionsByType: Record<string, number>;
  contactsByType: Record<string, number>;
}

export function ActivityReport({ contacts }: ActivityReportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<ActivityStats | null>(null);

  React.useEffect(() => {
    if (showDialog) {
      const stats: ActivityStats = {
        totalContacts: contacts.length,
        activeContacts: contacts.length,
        totalInteractions: 0,
        interactionsByType: {},
        contactsByType: contacts.reduce((acc, contact) => ({
          ...acc,
          [contact.type]: (acc[contact.type] || 0) + 1
        }), {} as Record<string, number>),
      };

      setStats(stats);
    }
  }, [contacts, timeRange, showDialog]);

  const exportReport = () => {
    if (!stats) return;

    const content = `Activity Report (${timeRange})
${'-'.repeat(50)}

Summary:
- Total Contacts: ${stats.totalContacts}
- Active Contacts: ${stats.activeContacts}
- Total Interactions: ${stats.totalInteractions}

Contact Types:
${Object.entries(stats.contactsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

Interaction Types:
${Object.entries(stats.interactionsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-report-${timeRange}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="bg-gray-700 hover:bg-gray-600"
      >
        <BarChart className="mr-2 h-4 w-4" />
        Activity Report
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={exportReport}
                className="bg-gray-700 hover:bg-gray-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>

            {stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Contacts</h3>
                    <p>Total: {stats.totalContacts}</p>
                    <p>Active: {stats.activeContacts}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Interactions</h3>
                    <p>Total: {stats.totalInteractions}</p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                  <div className="space-y-2">
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}