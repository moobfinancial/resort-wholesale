import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from 'lucide-react';

export function PaymentMethod() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CreditCard className="h-6 w-6 text-gray-400" />
            <div>
              <p className="text-white">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-400">Expires 12/24</p>
            </div>
          </div>
          <Button variant="outline" className="bg-gray-700 hover:bg-gray-600">
            Update
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}