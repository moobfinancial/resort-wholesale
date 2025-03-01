import { useState } from 'react';
import { CurrentPlan } from '@/components/Billing/CurrentPlan';
import { AvailablePlans } from '@/components/Billing/AvailablePlans';
import { PaymentMethod } from '@/components/Billing/PaymentMethod';
import { BillingHistory } from '@/components/Billing/BillingHistory';
import { UpgradeDialog } from '@/components/Billing/UpgradeDialog';
import { BillingCycle, Plan } from '@/components/Billing/plans';

export default function Billing() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('Free');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('Free');

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const confirmUpgrade = () => {
    setCurrentPlan(selectedPlan);
    setShowUpgradeDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-teal-400">Billing</h1>
        <p className="text-gray-400">Manage your subscription and billing information</p>
      </div>

      <div className="grid gap-6">
        <CurrentPlan
          currentPlan={currentPlan}
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />

        <AvailablePlans
          currentPlan={currentPlan}
          billingCycle={billingCycle}
          onUpgrade={handleUpgrade}
        />

        <PaymentMethod />

        <BillingHistory />

        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          selectedPlan={selectedPlan}
          billingCycle={billingCycle}
          onConfirm={confirmUpgrade}
        />
      </div>
    </div>
  );
}