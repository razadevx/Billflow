"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  UserPlus, 
  User, 
  FileText, 
  Package, 
  Sparkles, 
  CheckCircle2,
  Box,
  AlertTriangle,
  Keyboard,
  Calculator,
  CornerDownLeft
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

  // Fetch Customers
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/v1/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || data.items || [];
    }
  });

  // Fetch Inventory items with stock levels
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/v1/inventory?limit=200");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || data.data || [];
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
      notifyDataChanged("inventory");
      toast.success("Work order created successfully!");
      router.push(`/workorders/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
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
    setLineItems(prev => prev.filter(li => li.id !== id));
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    setLineItems(prev => prev.map(li => {
      if (li.id !== id) return li;
      const updated = { ...li, [field]: value };
      
      if (field === "inventoryItemId" && value !== "custom") {
        const item = inventory.find((i: any) => i.id === value);
        if (item) {
          const unit = String(item.unit || "").toLowerCase();
          const isSquareFootMaterial = ["sqft", "sq ft", "ft2", "sq.ft"].includes(unit);
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
      toast.error("Please select a customer first.");
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

  // Keyboard Shortcuts Listener (Ctrl+Enter to save, Alt+N to add item)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        addLineItem();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customerId, title, lineItems]);

  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  // Line Items Calculation Breakdown
  const calculatedItems = lineItems.map(li => {
    let lineTotal = 0;
    let sqftPerItem = 0;
    let totalSqFt = 0;

    if (li.isSqFt) {
      sqftPerItem = SquareFootCalculator.calculateSqFt(li.width || 0, li.height || 0);
      const calc = SquareFootCalculator.calculateFull(li.width || 0, li.height || 0, li.quantity || 1, li.rate || 0);
      lineTotal = calc.lineTotal;
      totalSqFt = sqftPerItem * (li.quantity || 1);
    } else {
      lineTotal = (li.quantity || 1) * (li.unitPrice || 0);
    }

    const matchedInventory = inventory.find((i: any) => i.id === li.inventoryItemId);

    return {
      ...li,
      sqftPerItem,
      totalSqFt,
      lineTotal,
      matchedInventory
    };
  });

  const subtotal = calculatedItems.reduce((acc, item) => acc + item.lineTotal, 0);
  const canCreate = Boolean(customerId && title.trim() && lineItems.every((li) => li.description.trim()));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Customer Quick Modal */}
      <CustomerForm 
        open={isCustomerModalOpen} 
        onOpenChange={setIsCustomerModalOpen}
        redirectOnCreate={false}
        onSuccess={() => {
          notifyDataChanged("customer");
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
              Select customer, specify printing dimensions (sqft), and review live inventory deduction.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-xs py-1.5 px-3 bg-muted/40">
            <Keyboard className="h-3.5 w-3.5 text-blue-400" /> Ctrl + Enter to Save
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: CUSTOMER SELECTION (Starts with customer) */}
          <Card className="border-border/60 shadow-lg bg-card/50 backdrop-blur-sm ring-1 ring-blue-500/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" /> 1. Customer Selection
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs flex items-center gap-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <UserPlus className="h-3.5 w-3.5" /> + Create New Customer
                </Button>
              </div>
              <CardDescription>
                Select an existing customer or create a new profile.
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
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="font-medium">{c.name}</span>
                            {c.customerCode && <span className="text-xs text-muted-foreground">({c.customerCode})</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <span>{selectedCustomer.name}</span>
                      {selectedCustomer.customerCode && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {selectedCustomer.customerCode}
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {selectedCustomer.phone || "No phone"} &middot; {selectedCustomer.email || "No email"}
                    </div>
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
                <FileText className="h-5 w-5 text-blue-500" /> 2. Job Title & Instructions
              </CardTitle>
              <CardDescription>
                Define the job name, priority, and special notes.
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
                    placeholder="e.g. Front Store Flex Signage (10x20 ft)" 
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
                  placeholder="Enter design specifications, eyelet placement, lamination, color codes..." 
                  className="bg-background/60 resize-none text-sm"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP 3: ITEMS & SERVICES (WITH LIVE SQFT INVENTORY DEDUCTION COUNTER) */}
          <Card className="border-border/60 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" /> 3. Items & Services
                </CardTitle>
                <CardDescription>
                  Configure printing materials, sqft dimensions, rates, and custom services.
                </CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addLineItem} 
                className="text-xs flex items-center gap-1"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item <span className="text-[10px] text-muted-foreground ml-1">(Alt+N)</span>
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {calculatedItems.map((li, index) => (
                <div key={li.id} className="p-4 border border-border/60 rounded-xl space-y-4 relative bg-background/40">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {li.isSqFt && li.totalSqFt > 0 && (
                        <Badge variant="outline" className="text-[11px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/30">
                          <Calculator className="h-3 w-3 mr-1" /> {li.totalSqFt} total sqft
                        </Badge>
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10" 
                      onClick={() => removeLineItem(li.id)} 
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Inventory Product / Material</Label>
                      <Select value={li.inventoryItemId} onValueChange={(v) => updateLineItem(li.id, "inventoryItemId", v)}>
                        <SelectTrigger className="h-10 bg-background/60">
                          <SelectValue placeholder="Select material or custom..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">-- Custom Item / Service --</SelectItem>
                          {inventoryLoading && <SelectItem value="loading" disabled>Loading inventory...</SelectItem>}
                          {inventory.map((inv: any) => (
                            <SelectItem key={inv.id} value={inv.id}>
                              <div className="flex items-center justify-between w-full gap-3">
                                <span>{inv.name}</span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  ({inv.currentStock ?? inv.availableQuantity ?? 0} {inv.unit})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Description <span className="text-red-500">*</span></Label>
                      <Input 
                        value={li.description} 
                        onChange={e => updateLineItem(li.id, "description", e.target.value)} 
                        placeholder="e.g. Flex Printing, Gloss Lamination..." 
                        className="h-10 bg-background/60 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                    <Switch checked={li.isSqFt} onCheckedChange={(v) => updateLineItem(li.id, "isSqFt", v)} />
                    <Label className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                      <span>Enable Square Foot Pricing (Width × Height)</span>
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {li.isSqFt ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Width (ft)</Label>
                          <Input type="number" min="0" value={li.width || ""} onChange={e => updateLineItem(li.id, "width", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Height (ft)</Label>
                          <Input type="number" min="0" value={li.height || ""} onChange={e => updateLineItem(li.id, "height", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" placeholder="0" />
                        </div>
                      </>
                    ) : null}
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <Input type="number" min="1" value={li.quantity || 1} onChange={e => updateLineItem(li.id, "quantity", parseFloat(e.target.value) || 1)} className="h-9 font-mono text-sm bg-background/60" />
                    </div>
                    {li.isSqFt ? (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Rate (Rs / sqft)</Label>
                        <Input type="number" min="0" step="0.01" value={li.rate || ""} onChange={e => updateLineItem(li.id, "rate", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" placeholder="0.00" />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Unit Price (Rs)</Label>
                        <Input type="number" min="0" step="0.01" value={li.unitPrice || ""} onChange={e => updateLineItem(li.id, "unitPrice", parseFloat(e.target.value) || 0)} className="h-9 font-mono text-sm bg-background/60" placeholder="0.00" />
                      </div>
                    )}
                  </div>

                  {/* LIVE INVENTORY STOCK DEDUCTION COUNTER */}
                  {li.matchedInventory && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1">
                      <div className="flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Box className="h-3.5 w-3.5 text-blue-400" /> Stock Impact ({li.matchedInventory.name})
                        </span>
                        <span className="font-mono">
                          Available: <strong className="text-foreground">{li.matchedInventory.currentStock ?? li.matchedInventory.availableQuantity ?? 0} {li.matchedInventory.unit}</strong>
                        </span>
                      </div>
                      
                      {li.isSqFt ? (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Calculation: {li.width} × {li.height} ft = {li.sqftPerItem} sqft × {li.quantity} qty
                          </span>
                          <span className="font-mono text-amber-400 font-semibold">
                            - {li.totalSqFt} {li.matchedInventory.unit} reserved
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Calculation: {li.quantity} qty
                          </span>
                          <span className="font-mono text-amber-400 font-semibold">
                            - {li.quantity} {li.matchedInventory.unit} reserved
                          </span>
                        </div>
                      )}

                      {/* Stock Warning if requested exceeds available */}
                      {((li.isSqFt ? li.totalSqFt : li.quantity) > (li.matchedInventory.currentStock ?? li.matchedInventory.availableQuantity ?? 0)) && (
                        <div className="text-[11px] text-amber-400 flex items-center gap-1 pt-1 border-t border-amber-500/20 font-medium">
                          <AlertTriangle className="h-3 w-3" /> Warning: Requested quantity exceeds current available stock!
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live Order Summary Card with Detailed Bill Breakdown (1 col) */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-lg bg-card/40 backdrop-blur-sm sticky top-6">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" /> Live Order Summary
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

                <Separator />

                {/* DETAILED LINE-BY-LINE BILL BREAKDOWN */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Line Item Breakdown</span>
                    <span>{calculatedItems.length} item(s)</span>
                  </p>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {calculatedItems.map((item, idx) => (
                      <div key={item.id} className="p-2 rounded-lg bg-background/50 text-xs space-y-0.5 border border-border/30">
                        <div className="flex justify-between font-medium">
                          <span className="truncate max-w-[140px]">
                            {idx + 1}. {item.description.trim() || "Item"}
                          </span>
                          <span className="font-mono text-emerald-400">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                        {item.isSqFt ? (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.width} × {item.height} ft = {item.sqftPerItem} sqft @ Rs {item.rate}/sqft × {item.quantity} qty
                          </p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.quantity} qty × Rs {item.unitPrice}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax (0%)</span>
                    <span className="font-mono font-medium">Rs 0</span>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-foreground">Estimated Total</span>
                  <span className="text-xl font-bold font-mono text-blue-400">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {!canCreate && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 space-y-1">
                    <p className="font-semibold">Missing required fields:</p>
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
                  {createMutation.isPending ? (
                    "Creating Work Order..."
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Create Work Order <CornerDownLeft className="h-3.5 w-3.5 text-blue-200 ml-1" />
                    </span>
                  )}
                </Button>

                {/* Keyboard Shortcuts Helper */}
                <div className="pt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-3 border-t border-border/30">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Ctrl+Enter</kbd> Save
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Alt+N</kbd> Add Item
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
