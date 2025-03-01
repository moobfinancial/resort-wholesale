import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from 'lucide-react';

interface GetNewNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: (data: any) => void;
}

export function GetNewNumberDialog({
  open,
  onOpenChange,
  onPurchase,
}: GetNewNumberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Get New Phone Number</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Country</Label>
            <Select defaultValue="US">
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Area Code or City</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search area codes..."
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>
          </div>

          <div>
            <Label>Available Numbers</Label>
            <ScrollArea className="h-[200px] bg-gray-700 rounded-md p-4">
              {['+1 (217) 123-4567', '+1 (217) 234-5678', '+1 (217) 345-6789'].map((number) => (
                <div
                  key={number}
                  className="flex items-center justify-between p-2 hover:bg-gray-600 rounded-md"
                >
                  <span>{number}</span>
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => onPurchase({ number })}
                  >
                    Purchase
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}