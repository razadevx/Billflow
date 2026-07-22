"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, ArrowLeftRight, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function PaymentListClient() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = () => {
    fetch(`/api/v1/payments`)
      .then(res => res.json())
      .then(data => {
        setPayments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleVoid = async (id: string) => {
    if (!confirm("Are you sure you want to void this payment? This will reverse the transaction in the ledger.")) return;
    
    try {
      const res = await fetch(`/api/v1/payments/${id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Voided by user" })
      });
      if (res.ok) {
        fetchPayments();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to void payment");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to void payment");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        <div className="flex items-center space-x-2">
          <Link href="/payments/new" className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Receive Payment
          </Link>
          <Link href="/khata" className={buttonVariants({ variant: "outline" })}>
            View Ledger
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading payments...</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments found.</p>
            ) : (
              payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${payment.status === 'REFUNDED' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {payment.status === 'REFUNDED' ? <XCircle className="h-4 w-4" /> : <ArrowLeftRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        Receipt: {payment.receiptNumber || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                      {payment.customer?.name || "Unknown Customer"} &middot; {new Date(payment.paymentDate).toLocaleDateString()} &middot; {payment.method}
                      </p>
                      {(payment.invoice?.invoiceNumber || payment.workOrder?.orderNumber) && (
                        <p className="text-xs text-muted-foreground">
                          {payment.invoice?.invoiceNumber ? `Invoice ${payment.invoice.invoiceNumber}` : ""}
                          {payment.invoice?.invoiceNumber && payment.workOrder?.orderNumber ? " · " : ""}
                          {payment.workOrder?.orderNumber ? `WO ${payment.workOrder.orderNumber}` : ""}
                        </p>
                      )}
                      {payment.referenceNumber && (
                        <p className="text-xs text-muted-foreground">Ref: {payment.referenceNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-4">
                    <div>
                      <div className="font-bold text-lg">{formatCurrency(payment.amount)}</div>
                      <Badge variant={payment.status === 'REFUNDED' ? 'destructive' : 'default'} className="mt-1">
                        {payment.status}
                      </Badge>
                    </div>
                    {payment.status !== 'REFUNDED' && (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-100" onClick={() => handleVoid(payment.id)}>
                        Void
                      </Button>
                    )}
                    <Link href={`/customers/${payment.customerId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Customer
                    </Link>
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
