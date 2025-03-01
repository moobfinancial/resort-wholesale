import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plan, BillingCycle, plans } from './plans';

interface CurrentPlanProps {
  currentPlan: Plan;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

export function CurrentPlan({ currentPlan, billingCycle, onBillingCycleChange }: CurrentPlanProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Current Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-white">{currentPlan} Plan</h3>
            <p className="text-gray-400">
              ${plans[currentPlan][billingCycle]} / {billingCycle === 'monthly' ? 'month' : 'year'}
            </p>
          </div>
          <Select value={billingCycle} onValueChange={onBillingCycleChange}>
            <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly Billing</SelectItem>
              <SelectItem value="annual">Annual Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}