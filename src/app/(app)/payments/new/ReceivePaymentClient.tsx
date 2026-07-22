"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReceivePaymentClient({
  initialCustomerId = "",
  initialInvoiceId = "",
  initialWorkOrderId = "",
  initialAmount = "",
}: {
  initialCustomerId?: string;
  initialInvoiceId?: string;
  initialWorkOrderId?: string;
  initialAmount?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customerId: initialCustomerId,
    invoiceId: initialInvoiceId,
    workOrderId: initialWorkOrderId,
    amount: initialAmount,
    method: "CASH",
    referenceNumber: "",
    notes: ""
  });

  useEffect(() => {
    fetch(`/api/v1/customers`)
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : data.data || data.items || []))
      .catch(() => toast.error("Failed to load customers"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/v1/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId,
          invoiceId: formData.invoiceId || undefined,
          workOrderId: formData.workOrderId || undefined,
          amount: parseFloat(formData.amount),
          method: formData.method,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
          paymentDate: new Date().toISOString()
        })
      });

      if (res.ok) {
        router.push("/payments");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save payment");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving the payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-2 mb-4">
        <Link href="/payments" className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Receive Payment</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            {(formData.invoiceId || formData.workOrderId) && (
              <p className="text-sm text-muted-foreground">
                Linked to {formData.invoiceId ? "invoice" : "work order"} from the previous screen.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={(val) => setFormData({ ...formData, customerId: val || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">Rs</span>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    className="pl-9" 
                    placeholder="0.00" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="method">Payment Method *</Label>
                <Select 
                  value={formData.method} 
                  onValueChange={(val) => setFormData({ ...formData, method: val || "CASH" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="UPI">UPI / Wallet</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
              <Input 
                id="referenceNumber" 
                placeholder="Cheque No, Transaction ID, etc." 
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional details..." 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Link href="/payments" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Payment
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
