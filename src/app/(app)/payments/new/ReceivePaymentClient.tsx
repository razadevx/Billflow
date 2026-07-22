"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Loader2, 
  Banknote, 
  CreditCard, 
  Building2, 
  FileText, 
  QrCode, 
  CircleEllipsis, 
  CheckCircle2, 
  User, 
  Receipt,
  Sparkles,
  DollarSign,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash", icon: Banknote, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { id: "UPI", label: "UPI / Wallet", icon: QrCode, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { id: "CREDIT_CARD", label: "Credit Card", icon: CreditCard, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "CHEQUE", label: "Cheque", icon: FileText, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  { id: "OTHER", label: "Other", icon: CircleEllipsis, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30" },
];

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
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: initialCustomerId,
    invoiceId: initialInvoiceId,
    workOrderId: initialWorkOrderId,
    amount: initialAmount,
    method: "CASH",
    referenceNumber: "",
    notes: ""
  });

  // Fetch Customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/customers`);
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || data.items || [];
    }
  });

  // Fetch Customer Khata Statement & Balance
  const { data: customerKhata, isLoading: isLoadingKhata } = useQuery({
    queryKey: ["khata", formData.customerId],
    queryFn: async () => {
      if (!formData.customerId) return null;
      const res = await fetch(`/api/v1/khata/${formData.customerId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!formData.customerId
  });

  // Fetch Unpaid Invoices for Selected Customer
  const { data: customerInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", formData.customerId],
    queryFn: async () => {
      if (!formData.customerId) return [];
      const res = await fetch(`/api/v1/invoices`);
      if (!res.ok) return [];
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      return list.filter((inv: any) => 
        inv.customerId === formData.customerId && 
        inv.status !== "PAID" && 
        inv.status !== "CANCELLED"
      );
    },
    enabled: !!formData.customerId
  });

  const selectedCustomer = customers.find((c: any) => c.id === formData.customerId);
  const currentBalance = customerKhata?.currentBalance ?? 0;
  const selectedInvoice = customerInvoices.find((inv: any) => inv.id === formData.invoiceId);

  // Auto-fill amount if initialInvoiceId or invoiceId selected and amount empty
  useEffect(() => {
    if (selectedInvoice && (!formData.amount || formData.amount === "0")) {
      setFormData(prev => ({ ...prev, amount: selectedInvoice.balanceDue.toString() }));
    }
  }, [formData.invoiceId, selectedInvoice]);

  const handleInvoiceChange = (invoiceId: string | null) => {
    if (!invoiceId || invoiceId === "none") {
      setFormData(prev => ({ ...prev, invoiceId: "", workOrderId: "" }));
      return;
    }
    const inv = customerInvoices.find((i: any) => i.id === invoiceId);
    setFormData(prev => ({
      ...prev,
      invoiceId,
      workOrderId: inv?.workOrderId || prev.workOrderId,
      amount: inv ? inv.balanceDue.toString() : prev.amount
    }));
  };

  const handleQuickAmount = (percentage: number) => {
    let targetAmount = currentBalance;
    if (selectedInvoice) {
      targetAmount = selectedInvoice.balanceDue;
    }
    if (targetAmount > 0) {
      const calculated = (targetAmount * percentage).toFixed(2);
      setFormData(prev => ({ ...prev, amount: calculated }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error("Please select a customer");
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than zero");
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
          amount: numAmount,
          method: formData.method,
          referenceNumber: formData.referenceNumber || undefined,
          notes: formData.notes || undefined,
          paymentDate: new Date().toISOString()
        })
      });

      if (res.ok) {
        toast.success("Payment recorded successfully!");
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        queryClient.invalidateQueries({ queryKey: ["khata"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "kpis"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "activity"] });
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

  const numAmount = parseFloat(formData.amount) || 0;
  const newBalance = currentBalance - numAmount;

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center space-x-3">
          <Link href="/payments" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Receive Payment
            </h2>
            <p className="text-sm text-muted-foreground">
              Record an incoming payment to credit a customer balance or clear an open invoice.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-lg bg-card/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  Payment Details
                  {formData.customerId && (
                    <Badge variant="outline" className="font-normal text-xs bg-primary/10 text-primary border-primary/20">
                      Customer Selected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Select the customer, specify amount, payment channel, and optional allocation.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-medium flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" /> Customer <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={(val) => {
                      setFormData({ ...formData, customerId: val || "", invoiceId: "", workOrderId: "", amount: "" });
                    }}
                  >
                    <SelectTrigger className="h-11 bg-background/60">
                      <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Search or select a customer..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">No customers found</div>
                      ) : (
                        customers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id} className="py-2">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{c.name}</span>
                              {c.customerCode && (
                                <span className="text-xs text-muted-foreground ml-2">({c.customerCode})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Balance Banner */}
                {formData.customerId && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Current Outstanding (Khata)
                      </p>
                      <div className="text-xl font-bold">
                        {isLoadingKhata ? (
                          <span className="text-muted-foreground text-sm flex items-center gap-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching balance...
                          </span>
                        ) : (
                          <span className={currentBalance > 0 ? "text-amber-500 font-mono" : "text-emerald-500 font-mono"}>
                            Rs {currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    {currentBalance > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          className="text-xs h-8"
                          onClick={() => handleQuickAmount(1.0)}
                        >
                          Pay Full Balance
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-8"
                          onClick={() => handleQuickAmount(0.5)}
                        >
                          Pay 50%
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Unpaid Invoice Selector (If customer has unpaid invoices) */}
                {formData.customerId && (
                  <div className="space-y-2">
                    <Label htmlFor="invoice" className="text-sm font-medium flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" /> Link to Invoice (Optional)
                    </Label>
                    <Select 
                      value={formData.invoiceId || "none"} 
                      onValueChange={handleInvoiceChange}
                    >
                      <SelectTrigger className="h-11 bg-background/60">
                        <SelectValue placeholder={isLoadingInvoices ? "Loading invoices..." : "Select an invoice to apply payment..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General Account Credit (No specific invoice)</SelectItem>
                        {customerInvoices.map((inv: any) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-medium">#{inv.invoiceNumber}</span>
                              <span className="text-xs text-amber-500 font-mono font-semibold">
                                Due: Rs {inv.balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Amount and Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-muted-foreground" /> Amount (Rs) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">Rs</span>
                      <Input 
                        id="amount" 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        className="pl-10 h-11 text-lg font-mono font-medium bg-background/60" 
                        placeholder="0.00" 
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referenceNumber" className="text-sm font-medium">
                      Reference / Txn ID (Optional)
                    </Label>
                    <Input 
                      id="referenceNumber" 
                      className="h-11 bg-background/60"
                      placeholder="Cheque No, UPI Ref, UTR..." 
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Payment Method Selector Grid */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Channel <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PAYMENT_METHODS.map((m) => {
                      const IconComponent = m.icon;
                      const isSelected = formData.method === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, method: m.id })}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left font-medium text-xs sm:text-sm ${
                            isSelected 
                              ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30" 
                              : "border-border/60 bg-background/40 hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg border ${m.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Notes & Remarks (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    rows={2}
                    className="bg-background/60 resize-none text-sm"
                    placeholder="Enter any additional details or remarks..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 pt-2 pb-6 border-t border-border/40 mt-4">
                <Link href="/payments" className={buttonVariants({ variant: "ghost" })}>
                  Cancel
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading || !formData.customerId || !formData.amount}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-lg shadow-blue-600/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Recording...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Confirm Payment
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Live Payment Summary Card (1 col) */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-lg bg-card/40 backdrop-blur-sm sticky top-6">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" /> Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium truncate max-w-[160px] text-right">
                    {selectedCustomer ? selectedCustomer.name : "Not selected"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Current Outstanding</span>
                  <span className="font-mono font-medium">
                    Rs {currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {selectedInvoice && (
                  <div className="flex justify-between items-center text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span>Target Invoice</span>
                    <span className="font-mono font-semibold">#{selectedInvoice.invoiceNumber}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center text-sm py-1">
                  <span className="font-medium text-foreground">Receiving Amount</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    Rs {numAmount > 0 ? numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Payment Channel</span>
                  <Badge variant="outline" className="text-xs uppercase font-mono">
                    {formData.method}
                  </Badge>
                </div>

                {formData.referenceNumber && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Reference No</span>
                    <span className="font-mono text-right">{formData.referenceNumber}</span>
                  </div>
                )}

                <Separator />

                {formData.customerId && (
                  <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Expected New Balance</span>
                      <span className={`font-mono font-semibold ${newBalance <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        Rs {newBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {newBalance <= 0 && currentBalance > 0 && numAmount >= currentBalance && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" /> Customer balance fully cleared!
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
