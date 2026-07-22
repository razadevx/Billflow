"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CreateCustomerInput } from "@/domain/customer/validation/CustomerValidation";

type CustomerFormData = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  preferredContact?: string | null;
  status?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  customer?: CustomerFormData | null;
  redirectOnCreate?: boolean;
}

const initialFormData: Partial<CreateCustomerInput> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  creditLimit: 0,
  preferredContact: "PHONE",
};

export function CustomerForm({ open, onOpenChange, onSuccess, customer, redirectOnCreate = true }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateCustomerInput>>(initialFormData);
  const isEditing = Boolean(customer?.id);

  useEffect(() => {
    if (!open) return;

    setFormData(customer ? {
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      creditLimit: customer.creditLimit || 0,
      preferredContact: (customer.preferredContact as CreateCustomerInput["preferredContact"]) || "PHONE",
    } : initialFormData);
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(isEditing ? `/api/customers/${customer?.id}` : "/api/customers", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(isEditing ? "Customer updated successfully!" : "Customer created successfully!");
        onOpenChange(false);
        if (onSuccess) onSuccess();
        if (!isEditing && redirectOnCreate && data.data?.id) router.push(`/customers/${data.data.id}`);
      } else {
        toast.error(data.error?.message || `Failed to ${isEditing ? "update" : "create"} customer`);
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
          <h2 className="text-lg font-bold">{isEditing ? "Edit Customer" : "New Customer"}</h2>
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
              {isEditing ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
