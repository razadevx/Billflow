"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search, ClipboardList } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkOrderClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["workorders", statusFilter],
    queryFn: async () => {
      const res = await fetch(`/api/v1/workorders?status=${statusFilter}`);
      if (!res.ok) throw new Error("Failed to fetch work orders");
      return res.json();
    },
  });

  const filteredOrders = workOrders.filter((wo: any) => 
    wo.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "IN_PROGRESS": return <Badge variant="outline" className="bg-blue-50 text-blue-700">In Progress</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case "DELIVERED": return <Badge variant="outline" className="bg-purple-50 text-purple-700">Delivered</Badge>;
      case "CANCELLED": return <Badge variant="outline" className="bg-red-50 text-red-700">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Create and track jobs from one place</h2>
            <p className="text-sm text-muted-foreground">Use the blue button for a new job, or open an existing row to update status and payments.</p>
          </div>
        </div>
        <Link href="/workorders/new" className={buttonVariants({ variant: "default" })}>
          <Plus className="mr-2 h-4 w-4" /> Create Work Order
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/customers" className={buttonVariants({ variant: "outline" })}>
          Choose from Customers
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Loading work orders...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No work orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((wo: any) => (
                <TableRow key={wo.id} className="cursor-pointer" onClick={() => window.location.href = `/workorders/${wo.id}`}>
                  <TableCell className="font-medium">{wo.orderNumber}</TableCell>
                  <TableCell>{wo.title}</TableCell>
                  <TableCell>{wo.customer?.name || "Unknown"}</TableCell>
                  <TableCell>{format(new Date(wo.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>{getStatusBadge(wo.status)}</TableCell>
                  <TableCell className="text-right">${(wo.total || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/workorders/${wo.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
