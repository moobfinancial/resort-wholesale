import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plan, BillingCycle, plans } from './plans';

interface AvailablePlansProps {
  currentPlan: Plan;
  billingCycle: BillingCycle;
  onUpgrade: (plan: Plan) => void;
}

export function AvailablePlans({ currentPlan, billingCycle, onUpgrade }: AvailablePlansProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Available Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(plans) as Plan[]).map((plan) => (
            <div
              key={plan}
              className={`p-6 rounded-lg border ${
                currentPlan === plan
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-gray-700 bg-gray-700/50'
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{plan}</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold">${plans[plan][billingCycle]}</span>
                <span className="text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              {currentPlan !== plan && (
                <Button
                  onClick={() => onUpgrade(plan)}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Upgrade to {plan}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}