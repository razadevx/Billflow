"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, AlertTriangle, Package, Ruler } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "@/domain/inventory/types";
import { formatCurrency } from "@/lib/utils";

import CreateInventoryDialog from "./CreateInventoryDialog";
import AdjustStockDialog from "./AdjustStockDialog";

export default function InventoryClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", search, filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("query", search);
      if (filter === "LOW_STOCK") params.append("lowStockOnly", "true");
      
      const res = await fetch(`/api/v1/inventory?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
      case "LOW_STOCK": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Low Stock</Badge>;
      case "OUT_OF_STOCK": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Out of Stock</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const inventoryItems = Array.isArray(data) ? data : data?.items || data?.data || [];
  const squareFootItems = inventoryItems.filter((item: any) => ["sqft", "sq ft", "ft2"].includes(String(item.unit).toLowerCase()));
  const totalSqFtAvailable = squareFootItems.reduce((acc: number, item: any) => acc + Number(item.availableQuantity ?? item.currentStock ?? 0), 0);
  const totalSqFtReserved = squareFootItems.reduce((acc: number, item: any) => acc + Number(item.reservedQuantity ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Manage materials for printing jobs</h2>
            <p className="text-sm text-muted-foreground">
              Add flex, vinyl, boards, ink, and stock. Square-foot materials use unit <span className="font-mono">sqft</span>.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Flex / Item
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Items</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{data?.total || inventoryItems.length}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Low / Out of Stock</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-amber-400">
              {inventoryItems.filter((i: any) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK').length}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">SqFt Available Stock</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
              <Ruler className="h-5 w-5 text-emerald-400" /> {totalSqFtAvailable.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">sqft</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">SqFt Reserved</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-amber-400 flex items-center gap-1">
              <Ruler className="h-5 w-5 text-amber-400" /> {totalSqFtReserved.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">sqft</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search inventory..."
              className="pl-8 w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={(val) => val && setFilter(val)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Items</SelectItem>
              <SelectItem value="LOW_STOCK">Low Stock Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : inventoryItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              inventoryItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                      {["sqft", "sq ft", "ft2"].includes(String(item.unit).toLowerCase()) && (
                        <span className="mt-1 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          Square-foot pricing
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.sku || "-"}</TableCell>
                  <TableCell>{item.category?.name || "Uncategorized"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-0.5 font-mono">
                      <span className="font-semibold text-sm">{item.currentStock} {item.unit}</span>
                      {Number(item.reservedQuantity || 0) > 0 && (
                        <span className="text-[11px] text-amber-400">
                          {item.reservedQuantity} {item.unit} reserved
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {item.availableQuantity ?? item.currentStock} {item.unit} available
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice || 0)} / {item.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency((item.unitPrice || 0) * item.currentStock)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setAdjustItem(item)}>
                      Adjust
                    </Button>
                    <Link href={`/inventory/${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateInventoryDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["inventory"] })} 
      />
      
      {adjustItem && (
        <AdjustStockDialog 
          item={adjustItem} 
          open={!!adjustItem} 
          onOpenChange={(open) => !open && setAdjustItem(null)} 
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["inventory"] })}
        />
      )}
    </div>
  );
}
