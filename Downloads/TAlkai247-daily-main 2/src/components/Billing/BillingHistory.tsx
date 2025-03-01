import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from 'lucide-react';

interface BillingHistoryItem {
  date: string;
  amount: string;
  status: string;
  invoiceId: string;
}

const billingHistory: BillingHistoryItem[] = [
  { date: '2024-02-01', amount: '$68.00', status: 'Paid', invoiceId: 'INV-2024-001' },
  { date: '2024-01-01', amount: '$68.00', status: 'Paid', invoiceId: 'INV-2024-002' },
];

export function BillingHistory() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Billing History</CardTitle>
          <Button variant="outline" className="bg-gray-700 hover:bg-gray-600">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-400">Date</TableHead>
              <TableHead className="text-gray-400">Amount</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingHistory.map((item) => (
              <TableRow key={item.invoiceId}>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.amount}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-teal-400 hover:text-teal-300">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}