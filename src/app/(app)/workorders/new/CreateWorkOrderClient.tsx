"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SquareFootCalculator } from "@/domain/workorder/square-foot-calculator";

export default function CreateWorkOrderClient() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
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

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/v1/customers");
      return res.json();
    }
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/v1/inventory");
      return res.json();
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
      
      // Auto-fill from inventory
      if (field === "inventoryItemId" && value !== "custom") {
        const item = inventory.find((i: any) => i.id === value);
        if (item) {
          updated.description = item.name;
          updated.unitPrice = item.unitPrice || 0;
        }
      }

      // Square foot logic doesn't strictly auto-calculate quantity anymore. 
      // Quantity is number of physical items (e.g., 5 banners).
      // The total calculation will be handled in the subtotal and on the backend.
      
      return updated;
    }));
  };

  const handleSave = () => {
    if (!customerId || !title) {
      toast.error("Customer and Title are required.");
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/workorders" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Create Work Order</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Front Store Signage" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Project notes..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {lineItems.map((li, index) => (
                <div key={li.id} className="p-4 border rounded-lg space-y-4 relative bg-slate-50/50">
                  <div className="absolute top-2 right-2">
                    <Button variant="ghost" size="icon" onClick={() => removeLineItem(li.id)} disabled={lineItems.length === 1}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product / Material</Label>
                      <Select value={li.inventoryItemId} onValueChange={(v) => updateLineItem(li.id, "inventoryItemId", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">-- Custom Item --</SelectItem>
                          {inventory.map((inv: any) => (
                            <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={li.description} onChange={e => updateLineItem(li.id, "description", e.target.value)} placeholder="Item details" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch checked={li.isSqFt} onCheckedChange={(v) => updateLineItem(li.id, "isSqFt", v)} />
                    <Label>Square Foot Pricing (W x H)</Label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {li.isSqFt ? (
                      <>
                        <div className="space-y-2">
                          <Label>Width (ft)</Label>
                          <Input type="number" min="0" value={li.width} onChange={e => updateLineItem(li.id, "width", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (ft)</Label>
                          <Input type="number" min="0" value={li.height} onChange={e => updateLineItem(li.id, "height", parseFloat(e.target.value) || 0)} />
                        </div>
                      </>
                    ) : null}
                    
                    <div className="space-y-2">
                      <Label>Qty</Label>
                      <Input type="number" min="1" value={li.quantity} onChange={e => updateLineItem(li.id, "quantity", parseFloat(e.target.value) || 1)} />
                    </div>
                    {li.isSqFt ? (
                      <div className="space-y-2">
                        <Label>Rate ($ / sqft)</Label>
                        <Input type="number" min="0" step="0.01" value={li.rate} onChange={e => updateLineItem(li.id, "rate", parseFloat(e.target.value) || 0)} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Unit Price ($)</Label>
                        <Input type="number" min="0" step="0.01" value={li.unitPrice} onChange={e => updateLineItem(li.id, "unitPrice", parseFloat(e.target.value) || 0)} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={(val) => setCustomerId(val || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(val) => setPriority(val || "0")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Normal</SelectItem>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {/* Simplified Tax for MVP - assumed 0% unless specified per line item */}
              <div className="flex justify-between font-bold text-lg pt-4 border-t">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <Button className="w-full mt-4" onClick={handleSave} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Work Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
