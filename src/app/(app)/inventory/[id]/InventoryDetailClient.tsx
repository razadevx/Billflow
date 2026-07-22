"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdjustStockDialog from "../AdjustStockDialog";
import { formatCurrency } from "@/lib/utils";

export default function InventoryDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const { data: item, isLoading } = useQuery({
    queryKey: ["inventory", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/inventory/${id}`);
      if (!res.ok) throw new Error("Failed to fetch inventory item");
      const json = await res.json();
      setFormData({
        name: json.name,
        sku: json.sku || "",
        description: json.description || "",
        unitPrice: json.unitPrice || 0,
        reorderLevel: json.reorderLevel || 0,
      });
      return json;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/v1/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Item updated");
      queryClient.invalidateQueries({ queryKey: ["inventory", id] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;
  if (!item) return <div className="p-10 text-center">Item not found.</div>;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      unitPrice: Number(formData.unitPrice),
      reorderLevel: Number(formData.reorderLevel),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
      case "LOW_STOCK": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Low Stock</Badge>;
      case "OUT_OF_STOCK": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Out of Stock</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const lastMovement = item.history?.[0];
  const lastRestock = item.history?.find((h: any) => h.action === "RESTOCK" || h.action === "INITIAL_STOCK");

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/inventory" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{item.name}</h2>
          <p className="text-sm text-muted-foreground">SKU: {item.sku || "N/A"} • Category: {item.category?.name || "Uncategorized"}</p>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          {getStatusBadge(item.status)}
          <Button onClick={() => setIsAdjustOpen(true)}>Adjust Stock</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.currentStock} {item.unit}</div>
            <p className="text-xs text-muted-foreground">{item.availableQuantity} available, {item.reservedQuantity} reserved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((item.unitPrice || 0) * item.currentStock)}</div>
            <p className="text-xs text-muted-foreground">@ {formatCurrency(item.unitPrice || 0)} per {item.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastMovement ? format(new Date(lastMovement.createdAt), "MMM d, yyyy") : "Never"}</div>
            <p className="text-xs text-muted-foreground">{lastMovement?.action || "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Restock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastRestock ? format(new Date(lastRestock.createdAt), "MMM d, yyyy") : "Never"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <div>{item.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">SKU</div>
                  <div>{item.sku || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Description</div>
                  <div>{item.description || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Reorder Level</div>
                  <div>{item.reorderLevel} {item.unit}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Immutable Movement History</CardTitle>
              <CardDescription>An audit log of all stock changes over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">New</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.history?.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell>{format(new Date(h.createdAt), "PP pp")}</TableCell>
                      <TableCell><Badge variant="secondary">{h.action}</Badge></TableCell>
                      <TableCell className="text-right">{h.previousQuantity}</TableCell>
                      <TableCell className="text-right">{h.newQuantity}</TableCell>
                    </TableRow>
                  ))}
                  {(!item.history || item.history.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No history found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle>Manual Adjustments</CardTitle>
              <CardDescription>Records of manual stock adjustments made by users.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.adjustments?.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>{format(new Date(a.createdAt), "PP")}</TableCell>
                      <TableCell>{a.user?.name || a.userId || "System"}</TableCell>
                      <TableCell>{a.reason}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{a.notes || "-"}</TableCell>
                      <TableCell className={`text-right font-medium ${a.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                        {a.quantity > 0 ? "+" : ""}{a.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!item.adjustments || item.adjustments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No manual adjustments found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Edit Inventory Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Cost Price</Label>
                    <Input id="unitPrice" type="number" step="0.01" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isAdjustOpen && (
        <AdjustStockDialog 
          item={item} 
          open={isAdjustOpen} 
          onOpenChange={setIsAdjustOpen} 
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["inventory", id] })}
        />
      )}
    </div>
  );
}
