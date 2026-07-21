"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, AlertTriangle } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem } from "@/domain/inventory/types";

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

  const inventoryItems = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Items</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Low Stock</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-yellow-600">
              {inventoryItems.filter((i: any) => i.status === 'LOW_STOCK').length}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Out of Stock</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-red-600">
              {inventoryItems.filter((i: any) => i.status === 'OUT_OF_STOCK').length}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Valuation (Current View)</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              ${inventoryItems.reduce((acc: number, item: any) => acc + (item.currentStock * (item.unitPrice || 0)), 0).toFixed(2)}
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
                    </div>
                  </TableCell>
                  <TableCell>{item.sku || "-"}</TableCell>
                  <TableCell>{item.category?.name || "Uncategorized"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span>{item.currentStock} {item.unit}</span>
                      {item.availableQuantity !== item.currentStock && (
                        <span className="text-xs text-muted-foreground">
                          {item.availableQuantity} available
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${(item.unitPrice || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${((item.unitPrice || 0) * item.currentStock).toFixed(2)}</TableCell>
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
