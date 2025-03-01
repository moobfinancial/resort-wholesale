import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plan, BillingCycle, plans } from './plans';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: Plan;
  billingCycle: BillingCycle;
  onConfirm: () => void;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  selectedPlan,
  billingCycle,
  onConfirm
}: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Upgrade to {selectedPlan} Plan</DialogTitle>
          <DialogDescription className="text-gray-400">
            You will be charged ${plans[selectedPlan][billingCycle]} for the {selectedPlan} plan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Card Number</Label>
            <Input className="bg-gray-700 border-gray-600" placeholder="4242 4242 4242 4242" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>Expiration Date</Label>
              <Input className="bg-gray-700 border-gray-600" placeholder="MM/YY" />
            </div>
            <div>
              <Label>CVC</Label>
              <Input className="bg-gray-700 border-gray-600" placeholder="123" />
            </div>
          </div>
          <Button onClick={onConfirm} className="w-full bg-teal-600 hover:bg-teal-700">
            Confirm Upgrade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}