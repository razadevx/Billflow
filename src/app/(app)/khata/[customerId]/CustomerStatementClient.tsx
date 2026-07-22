"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft, FileText, ArrowUpRight, ArrowDownRight, CreditCard, Receipt } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function CustomerStatementClient({ customerId }: { customerId: string }) {
  const { data: statement, isLoading: loading } = useQuery({
    queryKey: ["khata", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/khata/${customerId}`);
      if (!res.ok) throw new Error("Failed to load statement");
      return res.json();
    }
  });

  if (loading) {
    return <div className="p-8">Loading statement...</div>;
  }

  if (!statement) {
    return <div className="p-8">Failed to load statement</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <Link href="/khata" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Customer Statement</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {statement.currentBalance > 0 && (
            <Link href={`/payments/new?customerId=${customerId}&amount=${statement.currentBalance}`} className={buttonVariants({ variant: "default" })}>
              Receive Payment
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statement.currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statement.currentBalance > 0 ? "Customer owes you" : statement.currentBalance < 0 ? "You owe customer" : "Settled"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {statement.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions found.</p>
            ) : (
              statement.entries.map((entry: any) => (
                <div key={entry.id} className="flex items-center">
                  <div className={`mt-1 bg-${entry.type === 'DEBIT' ? 'red' : 'green'}-100 p-2 rounded-full mr-4`}>
                    {entry.type === 'DEBIT' ? (
                      <ArrowUpRight className={`h-4 w-4 text-red-600`} />
                    ) : (
                      <ArrowDownRight className={`h-4 w-4 text-green-600`} />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {entry.type === 'DEBIT' ? 'Invoice / Charge' : 'Payment Received'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${entry.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>
                      {entry.type === 'DEBIT' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </div>
                    {entry.runningBalance !== null && (
                      <div className="text-xs text-muted-foreground">
                        Bal: {formatCurrency(entry.runningBalance)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
