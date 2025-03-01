import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from 'lucide-react';

interface ScheduleCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleDate: Date | undefined;
  scheduleTime: string;
  confirmationType: string;
  retryCount: string;
  onSchedule: (data: any) => void;
}

export function ScheduleCallDialog({
  open,
  onOpenChange,
  scheduleDate,
  scheduleTime,
  confirmationType,
  retryCount,
  onSchedule,
}: ScheduleCallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Schedule Call</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Calendar
              mode="single"
              selected={scheduleDate}
              onSelect={(_date) => {/* Will be handled by parent component */}}
              className="rounded-md border bg-gray-700"
            />
          </div>

          <div>
            <Label>Time</Label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={() => {}}
              className="bg-gray-700 border-gray-600"
            />
          </div>

          <div>
            <Label>Confirmation Type</Label>
            <Select value={confirmationType}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Retry Count</Label>
            <Select value={retryCount}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 time</SelectItem>
                <SelectItem value="2">2 times</SelectItem>
                <SelectItem value="3">3 times</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onSchedule({ scheduleDate, scheduleTime, confirmationType, retryCount })}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}