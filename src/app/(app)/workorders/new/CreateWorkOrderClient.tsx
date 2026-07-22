"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, UserPlus, User, FileText, Package, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SquareFootCalculator } from "@/domain/workorder/square-foot-calculator";
import { formatCurrency } from "@/lib/utils";
import { CustomerForm } from "@/app/(app)/customers/components/CustomerForm";
import { notifyDataChanged } from "@/lib/realtime-sync";

export default function CreateWorkOrderClient({ initialCustomerId = "" }: { initialCustomerId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("0");
  
  const [lineItems, setLineItems] = useState<any[]>([{
    id: Date.now().toString(),
    inventoryItemId: "custom",
    description: "",
    isSqFt: false,
    width: 0,
    height: 0,
    quantity: 1,
    unitPrice: 0, // Used if !isSqFt
    rate: 0,      // Used if isSqFt
    taxRate: 0,
  }]);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/v1/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/v1/inventory");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/v1/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create work order");
      }
      return res.json();
    },
    onSuccess: (data) => {
      notifyDataChanged("workorder");
      toast.success("Work order created!");
      router.push(`/workorders/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now().toString(),
      inventoryItemId: "custom",
      description: "",
      isSqFt: false,
      width: 0,
      height: 0,
      quantity: 1,
      unitPrice: 0,
      rate: 0,
      taxRate: 0,
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(li => li.id !== id));
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(lineItems.map(li => {
      if (li.id !== id) return li;
      const updated = { ...li, [field]: value };
      
      if (field === "inventoryItemId" && value !== "custom") {
        const item = inventory.find((i: any) => i.id === value);
        if (item) {
          const unit = String(item.unit || "").toLowerCase();
          const isSquareFootMaterial = ["sqft", "sq ft", "ft2"].includes(unit);
          updated.description = item.name;
          updated.unitPrice = item.unitPrice || 0;
          updated.isSqFt = isSquareFootMaterial;
          updated.rate = isSquareFootMaterial ? item.unitPrice || 0 : updated.rate;
          if (isSquareFootMaterial) {
            updated.width = updated.width || 1;
            updated.height = updated.height || 1;
          }
        }
      }
      return updated;
    }));
  };

  const handleSave = () => {
    if (!customerId) {
      toast.error("Please select or create a customer first.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a job title.");
      return;
    }

    const invalidItems = lineItems.filter(li => !li.description.trim());
    if (invalidItems.length > 0) {
      toast.error("All line items must have a description.");
      return;
    }

    const payload = {
      customerId,
      title,
      description,
      priority: parseInt(priority),
      lineItems: lineItems.map(li => {
        if (li.isSqFt) {
          return {
            inventoryItemId: li.inventoryItemId === "custom" ? undefined : li.inventoryItemId,
            description: li.description,
            isSqFt: true,
            width: li.width,
            height: li.height,
            quantity: li.quantity,
            rate: li.rate,
            taxRate: li.taxRate,
          };
        } else {
          return {
            inventoryItemId: li.inventoryItemId === "custom" ? undefined : li.inventoryItemId,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            taxRate: li.taxRate,
          };
        }
      })
    };

    createMutation.mutate(payload);
  };

  const subtotal = lineItems.reduce((acc, li) => {
    if (li.isSqFt) {
      const calc = SquareFootCalculator.calculateFull(li.width, li.height, li.quantity, li.rate);
      return acc + calc.lineTotal;
    }
    return acc + (li.quantity * li.unitPrice);
  }, 0);
  
  const selectedCustomer = customers.find((customer: any) => customer.id === customerId);
  const canCreate = Boolean(customerId && title.trim() && lineItems.every((li) => li.description.trim()));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Customer Quick Modal */}
      <CustomerForm 
        open={isCustomerModalOpen} 
        onOpenChange={setIsCustomerModalOpen}
        redirectOnCreate={false}
        onSuccess={() => {
          notifyDataChanged("customer");
          // Re-query will trigger and new customer can be selected
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-border/40 pb-5">
        <div className="flex items-start gap-4">
          <Link href="/workorders" className={buttonVariants({ variant: "outline", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              Create Work Order
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a customer, enter job details, and configure items to generate a work order.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/customers" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View Customers
          </Link>
          <Link href="/inventory" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View Inventory
          </Link>
        </div>
      </div>

      {/* Workflow Step Indicator */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className={`rounded-xl border p-4 transition-all ${customerId ? "border-blue-500/40 bg-blue-500/10" : "bg-card/50"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1</div>
          <div className="mt-1 font-semibold flex items-center gap-1.5">
            <User className="h-4 w-4 text-blue-400" /> 1. Select Customer
          </div>
          <div className="text-sm text-muted-foreground truncate">{selectedCustomer?.name || "Required first step"}</div>
        </div>
        <div className={`rounded-xl border p-4 transition-all ${title.trim() ? "border-blue-500/40 bg-blue-500/10" : "bg-card/50"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2</div>
          <div className="mt-1 font-semibold flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-400" /> 2. Job Details
          </div>
          <div className="text-sm text-muted-foreground truncate">{title.trim() || "Title & Priority"}</div>
        </div>
        <div className={`rounded-xl border p-4 transition-all ${lineItems.every((li) => li.description.trim()) ? "border-blue-500/40 bg-blue-500/10" : "bg-card/50"}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 3</div>
          <div className="mt-1 font-semibold flex items-center gap-1.5">
            <Package className="h-4 w-4 text-blue-400" /> 3. Items & Services
          </div>
          <div className="text-sm text-muted-foreground">{lineItems.length} item(s), {formatCurrency(subtotal)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: CUSTOMER SELECTION (Top priority per directive) */}
          <Card className="border-border/60 shadow-lg bg-card/50 backdrop-blur-sm ring-1 ring-blue-500/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" /> 1. Select Customer
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs flex items-center gap-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <UserPlus className="h-3.5 w-3.5" /> + New Customer
                </Button>
              </div>
              <CardDescription>
                Search or select an existing customer, or add a new customer on the spot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer" className="text-sm font-medium">Customer <span className="text-red-500">*</span></Label>
                <Select value={customerId} onValueChange={(val) => setCustomerId(val || "")}>
                  <SelectTrigger className="h-11 bg-background/60">
                    <SelectValue placeholder={customersLoading ? "Loading customers..." : "Search or select a customer..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {customersLoading ? (
                      <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                    ) : customers.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">No customers found</div>
                    ) : (
                      customers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{c.name}</span>
                            {c.customerCode && <span className="text-xs text-muted-foreground ml-2">({c.customerCode})</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">{selectedCustomer.name}</span>
                    {selectedCustomer.phone && <span className="text-muted-foreground ml-2">&middot; {selectedCustomer.phone}</span>}
                    {selectedCustomer.email && <span className="text-muted-foreground ml-2">&middot; {selectedCustomer.email}</span>}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 2: JOB DETAILS */}
          <Card className="border-border/60 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" /> 2. Job Details & Priority
              </CardTitle>
              <CardDescription>
                Specify the work order title, priority level, and detailed job instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Job Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title"
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Front Store Acrylic Signage" 
                    className="h-11 bg-background/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val || "0")}>
                    <SelectTrigger id="priority" className="h-11 bg-background/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="1">High Priority</SelectItem>
                      <SelectItem value="2">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Project Notes / Instructions</Label>
                <Textarea 
                  id="description"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Enter design specifications, installation notes, color codes..." 
                  className="bg-background/60 resize-none text-sm"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP 3: PRINTING ITEMS & SERVICES */}
          <Card className="border-border/60 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" /> 3. Items & Services
                </CardTitle>
                <CardDescription>
                  Add materials, printing dimensions (sqft), or custom service line items.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addLineItem} className="text-xs flex items-center gap-1">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {lineItems.map((li, index) => (
                <div key={li.id} className="p-4 border border-border/60 rounded-xl space-y-4 relative bg-background/40">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Item #{index + 1}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => removeLineItem(li.id)} disabled={lineItems.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Inventory Product / Material</Label>
                      <Select value={li.inventoryItemId} onValueChange={(v) => updateLineItem(li.id, "inventoryItemId", v)}>
                        <SelectTrigger className="h-10 bg-background/60">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">-- Custom Item / Service --</SelectItem>
                          {inventoryLoading && <SelectItem value="loading" disabled>Loading inventory...</SelectItem>}
                          {inventory.map((inv: any) => (
                            <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Description <span className="text-red-500">*</span></Label>
                      <Input 
                        value={li.description} 
                        onChange={e => updateLineItem(li.id, "description", e.target.value)} 
                        placeholder="Item specification or name" 
                        className="h-10 bg-background/60 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                    <Switch checked={li.isSqFt} onCheckedChange={(v) => updateLineItem(li.id, "isSqFt", v)} />
                    <Label className="text-xs font-medium cursor-pointer">Enable Square Foot Pricing (Width × Height)</Label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {li.isSqFt ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Width (ft)</Label>
                          <Input type="number" min="0" value={li.width} onChange={e => updateLineItem(li.id, "width", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Height (ft)</Label>
                          <Input type="number" min="0" value={li.height} onChange={e => updateLineItem(li.id, "height", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" />
                        </div>
                      </>
                    ) : null}
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <Input type="number" min="1" value={li.quantity} onChange={e => updateLineItem(li.id, "quantity", parseFloat(e.target.value) || 1)} className="h-9 font-mono text-sm bg-background/60" />
                    </div>
                    {li.isSqFt ? (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Rate (Rs / sqft)</Label>
                        <Input type="number" min="0" step="0.01" value={li.rate} onChange={e => updateLineItem(li.id, "rate", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Unit Price (Rs)</Label>
                        <Input type="number" min="0" step="0.01" value={li.unitPrice} onChange={e => updateLineItem(li.id, "unitPrice", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live Summary Card (1 col) */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-lg bg-card/40 backdrop-blur-sm sticky top-6">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" /> Order Summary
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
                  <span className="text-muted-foreground">Job Title</span>
                  <span className="font-medium truncate max-w-[160px] text-right">
                    {title.trim() ? title : "Untitled Job"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Line Items</span>
                  <span className="font-mono">{lineItems.length} item(s)</span>
                </div>

                <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                  <span className="font-medium text-foreground">Estimated Total</span>
                  <span className="text-xl font-bold font-mono text-blue-400">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {!canCreate && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 space-y-1">
                    <p className="font-semibold">Action Required:</p>
                    {!customerId && <p>&bull; Select a customer</p>}
                    {!title.trim() && <p>&bull; Enter a job title</p>}
                    {!lineItems.every((li) => li.description.trim()) && <p>&bull; Enter description for line items</p>}
                  </div>
                )}

                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 shadow-lg shadow-blue-600/20" 
                  onClick={handleSave} 
                  disabled={createMutation.isPending || !canCreate}
                >
                  {createMutation.isPending ? "Creating Work Order..." : "Create Work Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
