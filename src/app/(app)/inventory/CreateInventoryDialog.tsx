import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CreateInventoryDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "pcs",
    unitPrice: 0,
    reorderLevel: 0,
    initialStock: 0,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create item");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Inventory item created");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "", sku: "", description: "", unit: "pcs", unitPrice: 0, reorderLevel: 0, initialStock: 0
      });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      unitPrice: Number(formData.unitPrice),
      reorderLevel: Number(formData.reorderLevel),
      initialStock: Number(formData.initialStock),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input 
                id="sku" 
                value={formData.sku} 
                onChange={e => setFormData({...formData, sku: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input 
                id="unit" 
                list="unit-suggestions"
                value={formData.unit} 
                onChange={e => setFormData({...formData, unit: e.target.value})} 
                required 
              />
              <datalist id="unit-suggestions">
                <option value="pcs" />
                <option value="kg" />
                <option value="g" />
                <option value="l" />
                <option value="ml" />
                <option value="m" />
                <option value="ft" />
                <option value="box" />
                <option value="pack" />
                <option value="set" />
                <option value="roll" />
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialStock">Initial Stock</Label>
              <Input 
                id="initialStock" 
                type="number" 
                min="0"
                value={formData.initialStock} 
                onChange={e => setFormData({...formData, initialStock: Number(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Lvl</Label>
              <Input 
                id="reorderLevel" 
                type="number" 
                min="0"
                value={formData.reorderLevel} 
                onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input 
                id="unitPrice" 
                type="number" 
                min="0" step="0.01"
                value={formData.unitPrice} 
                onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
