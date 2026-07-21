"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CreateCustomerInput } from "@/domain/customer/validation/CustomerValidation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CustomerForm({ open, onOpenChange, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateCustomerInput>>({
    name: "", email: "", phone: "", address: "", creditLimit: 0, preferredContact: "PHONE"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Customer created successfully!");
        onOpenChange(false);
        if (onSuccess) onSuccess();
        // Redirect to new customer profile
        if (data.data?.id) router.push(`/customers/${data.data.id}`);
      } else {
        toast.error(data.error?.message || "Failed to create customer");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background text-foreground w-full max-w-lg border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">New Customer</h2>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <Icons.close className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Business Name *</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-3 bg-transparent border rounded-md outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="e.g. Ali Traders"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input 
                value={formData.phone || ""}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-10 px-3 bg-transparent border rounded-md outline-none focus:ring-2 focus:ring-primary/50" 
                placeholder="0300 1234567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input 
                type="email"
                value={formData.email || ""}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-10 px-3 bg-transparent border rounded-md outline-none focus:ring-2 focus:ring-primary/50" 
                placeholder="ali@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <input 
              value={formData.address || ""}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-10 px-3 bg-transparent border rounded-md outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="123 Main St, City"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Limit</label>
              <input 
                type="number"
                value={formData.creditLimit || 0}
                onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-transparent border rounded-md outline-none focus:ring-2 focus:ring-primary/50" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Contact</label>
              <select 
                value={formData.preferredContact || "PHONE"}
                onChange={e => setFormData({ ...formData, preferredContact: e.target.value as any })}
                className="w-full h-10 px-3 bg-transparent border rounded-md outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="PHONE">Phone</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Icons.loader className="animate-spin h-4 w-4 mr-2" /> : null}
              Create Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
