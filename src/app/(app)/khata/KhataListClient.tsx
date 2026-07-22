"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Eye, User } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export default function KhataListClient() {
  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ["khata"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/khata`);
      if (!res.ok) throw new Error("Failed to load khata");
      return res.json();
    }
  });

  const [search, setSearch] = useState("");

  const filtered = customers.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.customerCode && c.customerCode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Khata (Ledger)</h2>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Filter customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="p-4">Loading khata...</p>
        ) : filtered.length === 0 ? (
          <p className="p-4">No customers found.</p>
        ) : (
          filtered.map((customer: any) => (
            <Card key={customer.id} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {customer.name} {customer.customerCode && `(${customer.customerCode})`}
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className={`text-2xl font-bold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : ''}`}>
                      {formatCurrency(Math.abs(customer.balance))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      {customer.balance > 0 ? (
                        <><ArrowUpRight className="h-3 w-3 mr-1 text-red-600"/> Customer owes you</>
                      ) : customer.balance < 0 ? (
                        <><ArrowDownRight className="h-3 w-3 mr-1 text-green-600"/> Advance (You owe)</>
                      ) : (
                        "Settled"
                      )}
                    </p>
                  </div>
                  <Link href={`/khata/${customer.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                  {customer.balance > 0 && (
                    <Link href={`/payments/new?customerId=${customer.id}&amount=${customer.balance}`} className={buttonVariants({ variant: "default", size: "sm" })}>
                      Pay
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
